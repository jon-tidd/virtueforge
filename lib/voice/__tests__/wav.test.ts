import { describe, expect, it } from "vitest";
import {
  concatWav,
  decodeWav,
  durationSeconds,
  encodeWav,
  encodeWavFromFloat,
  pickReferenceClip,
  resampleFloat32,
  toneWav,
  trimSilence,
} from "../wav";

describe("WAV helpers", () => {
  it("round-trips 16-bit mono PCM", () => {
    const s = new Int16Array([0, 1000, -1000, 32767, -32768]);
    const d = decodeWav(encodeWav(s, 22050))!;
    expect(d.sampleRate).toBe(22050);
    expect(d.channels).toBe(1);
    expect(Array.from(d.samples)).toEqual(Array.from(s));
  });

  it("encodes browser float chunks, downsampling to the target rate", () => {
    const one = new Float32Array(48000).fill(0.5);
    const wav = encodeWavFromFloat([one, one], 48000, 24000);
    const d = decodeWav(wav)!;
    expect(d.sampleRate).toBe(24000);
    expect(durationSeconds(d)).toBeCloseTo(2, 2);
  });

  it("low-passes before downsampling: a 15 kHz tone doesn't alias into the speech band at 24 kHz", () => {
    const rate = 48000;
    const tone = (hz: number) => Float32Array.from({ length: rate }, (_, i) => 0.5 * Math.sin((2 * Math.PI * hz * i) / rate));
    const rms = (a: Float32Array) => Math.sqrt(a.slice(2000, -2000).reduce((n, v) => n + v * v, 0) / (a.length - 4000));
    const high = resampleFloat32(tone(15000), rate, 24000);
    const speech = resampleFloat32(tone(1000), rate, 24000);
    expect(high.length).toBe(24000);
    // Plain decimation would keep ~0.35 RMS (aliased to 9 kHz); the filter removes it.
    expect(rms(high)).toBeLessThan(0.01);
    // Speech-band content passes at full level.
    expect(rms(speech)).toBeGreaterThan(0.34);
    expect(rms(speech)).toBeLessThan(0.36);
    // Non-integer ratios (44.1 kHz mics) work too.
    const odd = resampleFloat32(Float32Array.from({ length: 44100 }, (_, i) => 0.5 * Math.sin((2 * Math.PI * 500 * i) / 44100)), 44100, 24000);
    expect(odd.length).toBe(24000);
    expect(rms(odd)).toBeGreaterThan(0.34);
  });

  it("rejects non-WAV input", () => {
    expect(decodeWav(new Uint8Array(100))).toBeNull();
    expect(decodeWav(new TextEncoder().encode("ID3 not a wav at all, just some mp3 bytes....."))).toBeNull();
  });

  it("joins clips with a gap", () => {
    const joined = decodeWav(concatWav([toneWav(1, 16000), toneWav(0.5, 16000)], 100))!;
    expect(durationSeconds(joined)).toBeCloseTo(1.6, 2);
    expect(() => concatWav([toneWav(1, 16000), toneWav(1, 24000)])).toThrow(/rates differ/);
  });

  it("trims silence and picks a reference clip of at most N seconds", () => {
    const tone = decodeWav(toneWav(20, 16000))!;
    const padded = new Int16Array(16000 * 22);
    padded.set(tone.samples, 16000);
    const t = trimSilence({ sampleRate: 16000, channels: 1, samples: padded });
    expect(durationSeconds(t)).toBeGreaterThan(19.5);
    expect(durationSeconds(t)).toBeLessThan(20.1);
    const ref = decodeWav(pickReferenceClip([toneWav(3, 16000), encodeWav(padded, 16000)], 12))!;
    expect(durationSeconds(ref)).toBeCloseTo(12, 1);
    expect(() => pickReferenceClip([encodeWav(new Int16Array(16000), 16000)])).toThrow(/no usable/);
  });
});
