"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { encodeWavFromFloat } from "@/lib/voice/wav";

// Records raw PCM with the Web Audio API and encodes 16-bit mono WAV in the
// browser. Works in Chrome and Safari (no MediaRecorder codec differences),
// and every provider accepts WAV. Browser voice processing (echo
// cancellation, noise suppression, auto gain) is switched off so the clone
// hears the real voice.

/** 24 kHz keeps speech detail and keeps 3 minutes under ~9 MB. */
export const RECORD_SAMPLE_RATE = 24_000;

export type RecorderState = "idle" | "requesting" | "recording" | "done" | "error";

export interface Recording {
  wav: Uint8Array;
  url: string;
  seconds: number;
  /** When the speaker started (ISO 8601): stored with the consent. */
  startedAt: string;
}

const WORKLET = `
class GgCapture extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("gg-capture", GgCapture);
`;

export function useRecorder(maxSeconds = 180) {
  const [state, setState] = useState<RecorderState>("idle");
  const [level, setLevel] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chunks = useRef<Float32Array[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<{ t: number; iso: string }>({ t: 0, iso: "" });
  const stopRef = useRef<() => void>(() => undefined);

  const teardown = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const ctx = ctxRef.current;
    ctxRef.current = null;
    if (ctx && ctx.state !== "closed") void ctx.close();
  }, []);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const rate = ctx.sampleRate;
    teardown();
    const wav = encodeWavFromFloat(chunks.current, rate, RECORD_SAMPLE_RATE);
    chunks.current = [];
    const secs = (wav.length - 44) / 2 / Math.min(rate, RECORD_SAMPLE_RATE);
    const url = URL.createObjectURL(new Blob([wav as BlobPart], { type: "audio/wav" }));
    setRecording({ wav, url, seconds: secs, startedAt: startRef.current.iso });
    setLevel(0);
    setState("done");
  }, [teardown]);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const start = useCallback(async () => {
    setError(null);
    setState("requesting");
    chunks.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      mute.connect(ctx.destination);

      if (ctx.audioWorklet) {
        const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
        await ctx.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        const node = new AudioWorkletNode(ctx, "gg-capture", { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
        node.port.onmessage = (e: MessageEvent<Float32Array>) => chunks.current.push(e.data);
        source.connect(node);
        node.connect(mute);
      } else {
        // Older browsers: the deprecated ScriptProcessorNode still works.
        const proc = ctx.createScriptProcessor(4096, 1, 1);
        proc.onaudioprocess = (e) => chunks.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        source.connect(proc);
        proc.connect(mute);
      }

      startRef.current = { t: performance.now(), iso: new Date().toISOString() };
      setRecording((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return null;
      });
      setHistory([]);
      setSeconds(0);
      setState("recording");

      const buf = new Float32Array(analyser.fftSize);
      let lastPush = 0;
      const tick = (now: number) => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const lv = Math.min(1, rms * 6);
        setLevel(lv);
        const secs = (now - startRef.current.t) / 1000;
        setSeconds(secs);
        if (now - lastPush > 90) {
          lastPush = now;
          setHistory((h) => [...h.slice(-35), lv]);
        }
        if (secs >= maxSeconds) {
          stopRef.current();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      teardown();
      setState("error");
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone permission was blocked. Allow it in the browser's address bar and try again."
          : "Couldn't start the microphone on this device.",
      );
    }
  }, [maxSeconds, teardown]);

  const reset = useCallback(() => {
    teardown();
    setRecording((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    setState("idle");
    setSeconds(0);
    setHistory([]);
  }, [teardown]);

  useEffect(() => () => teardown(), [teardown]);

  return { state, level, history, seconds, recording, error, start, stop, reset };
}
