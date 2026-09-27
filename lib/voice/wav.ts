// 16-bit PCM mono WAV helpers. Pure functions: used in the browser (encoding
// the recording) and on the server (checking uploads, picking the reference
// clip, joining Chatterbox chunks, the mock provider).

export interface PcmAudio {
  sampleRate: number;
  channels: number;
  /** Interleaved 16-bit samples. */
  samples: Int16Array;
}

/**
 * Band-limited resample of mono float samples (windowed-sinc, Blackman window).
 * Downsampling first low-passes at 0.45 x the lower rate, so nothing above the
 * new Nyquist frequency (sibilants, mic hiss between 12 and 24 kHz when going
 * 48 -> 24 kHz) folds back into the speech band. Plain decimation would alias
 * it into both the consent recording and the cloning samples.
 *
 * Polyphase: the kernel is tabulated at PHASES fractional offsets and the
 * nearest one is used, so a 3-minute recording takes well under a second.
 */
export function resampleFloat32(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate || input.length === 0) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  // Cutoff in cycles per input sample.
  const fc = (0.45 * Math.min(fromRate, toRate)) / fromRate;
  const ZERO_CROSSINGS = 16;
  const half = Math.ceil(ZERO_CROSSINGS / (2 * fc));
  const taps = 2 * half + 1;
  const PHASES = 64;
  const table = new Float32Array(PHASES * taps);
  for (let ph = 0; ph < PHASES; ph++) {
    const frac = ph / PHASES;
    let sum = 0;
    for (let k = 0; k < taps; k++) {
      const t = k - half - frac; // distance from the output position, in input samples
      const x = 2 * fc * t;
      const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
      const w = (t + half + 1) / (2 * half + 2); // 0..1 across the window
      const blackman = 0.42 - 0.5 * Math.cos(2 * Math.PI * w) + 0.08 * Math.cos(4 * Math.PI * w);
      const v = sinc * Math.max(0, blackman);
      table[ph * taps + k] = v;
      sum += v;
    }
    for (let k = 0; k < taps; k++) table[ph * taps + k] /= sum; // unity gain at DC
  }
  const n = input.length;
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    let b = Math.floor(pos);
    let ph = Math.round((pos - b) * PHASES);
    if (ph === PHASES) {
      // Rounds up to the next whole input sample.
      ph = 0;
      b++;
    }
    const row = ph * taps;
    let acc = 0;
    const start = b - half;
    for (let k = 0; k < taps; k++) {
      const j = start + k;
      if (j >= 0 && j < n) acc += input[j] * table[row + k];
    }
    out[i] = acc;
  }
  return out;
}

export function floatToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return out;
}

/** Encodes mono 16-bit PCM as a WAV file. */
export function encodeWav(samples: Int16Array, sampleRate: number): Uint8Array {
  const dataBytes = samples.length * 2;
  const buf = new ArrayBuffer(44 + dataBytes);
  const v = new DataView(buf);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + dataBytes, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true); // fmt chunk size
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); // byte rate
  v.setUint16(32, 2, true); // block align
  v.setUint16(34, 16, true); // bits per sample
  str(36, "data");
  v.setUint32(40, dataBytes, true);
  new Int16Array(buf, 44, samples.length).set(samples);
  return new Uint8Array(buf);
}

/** Convenience for the browser recorder: float chunks at any rate -> WAV at targetRate. */
export function encodeWavFromFloat(
  chunks: Float32Array[],
  inputRate: number,
  targetRate: number,
): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const joined = new Float32Array(total);
  let off = 0;
  for (const c of chunks) {
    joined.set(c, off);
    off += c.length;
  }
  const rate = Math.min(inputRate, targetRate);
  return encodeWav(floatToInt16(resampleFloat32(joined, inputRate, rate)), rate);
}

/** Parses a PCM WAV file. Returns null if it is not 16-bit PCM WAV. */
export function decodeWav(bytes: Uint8Array): PcmAudio | null {
  if (bytes.length < 44) return null;
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (off: number) =>
    String.fromCharCode(v.getUint8(off), v.getUint8(off + 1), v.getUint8(off + 2), v.getUint8(off + 3));
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return null;
  let off = 12;
  let sampleRate = 0;
  let channels = 0;
  let bits = 0;
  let format = 0;
  while (off + 8 <= bytes.length) {
    const id = tag(off);
    let size = v.getUint32(off + 4, true);
    const body = off + 8;
    if (id === "fmt ") {
      format = v.getUint16(body, true);
      channels = v.getUint16(body + 2, true);
      sampleRate = v.getUint32(body + 4, true);
      bits = v.getUint16(body + 14, true);
    } else if (id === "data") {
      // Some encoders write 0 or 0xFFFFFFFF for streamed WAVs: use what is there.
      if (size === 0 || size === 0xffffffff || body + size > bytes.length) size = bytes.length - body;
      // WAVE_FORMAT_EXTENSIBLE (0xFFFE) with 16-bit PCM is fine too.
      if ((format !== 1 && format !== 0xfffe) || bits !== 16 || channels < 1) return null;
      const count = Math.floor(size / 2);
      const samples = new Int16Array(count);
      for (let i = 0; i < count; i++) samples[i] = v.getInt16(body + i * 2, true);
      return { sampleRate, channels, samples };
    }
    off = body + size + (size % 2);
  }
  return null;
}

export function durationSeconds(pcm: PcmAudio): number {
  return pcm.samples.length / pcm.channels / pcm.sampleRate;
}

/** Mixes any channel count down to mono. */
export function toMono(pcm: PcmAudio): PcmAudio {
  if (pcm.channels === 1) return pcm;
  const frames = Math.floor(pcm.samples.length / pcm.channels);
  const out = new Int16Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let c = 0; c < pcm.channels; c++) sum += pcm.samples[f * pcm.channels + c];
    out[f] = Math.round(sum / pcm.channels);
  }
  return { sampleRate: pcm.sampleRate, channels: 1, samples: out };
}

/**
 * Joins mono WAV clips with a short silence between them. All clips must share
 * a sample rate (Chatterbox always returns the same rate for one model).
 */
export function concatWav(clips: Uint8Array[], gapMs = 120): Uint8Array {
  const decoded = clips.map((c) => {
    const d = decodeWav(c);
    if (!d) throw new Error("concatWav: not a 16-bit PCM WAV");
    return toMono(d);
  });
  if (decoded.length === 0) throw new Error("concatWav: nothing to join");
  const rate = decoded[0].sampleRate;
  if (decoded.some((d) => d.sampleRate !== rate)) throw new Error("concatWav: sample rates differ");
  const gap = Math.round((rate * gapMs) / 1000);
  const total = decoded.reduce((n, d) => n + d.samples.length, 0) + gap * (decoded.length - 1);
  const out = new Int16Array(total);
  let off = 0;
  decoded.forEach((d, i) => {
    out.set(d.samples, off);
    off += d.samples.length + (i < decoded.length - 1 ? gap : 0);
  });
  return encodeWav(out, rate);
}

/** Root-mean-square level of a window, 0..1. */
function rms(samples: Int16Array, start: number, end: number): number {
  let sum = 0;
  for (let i = start; i < end; i++) sum += (samples[i] / 32768) ** 2;
  return Math.sqrt(sum / Math.max(1, end - start));
}

/** Drops leading and trailing silence (20 ms windows below the threshold). */
export function trimSilence(pcm: PcmAudio, threshold = 0.01): PcmAudio {
  const mono = toMono(pcm);
  const win = Math.max(1, Math.round(mono.sampleRate * 0.02));
  const n = mono.samples.length;
  let start = 0;
  while (start + win <= n && rms(mono.samples, start, start + win) < threshold) start += win;
  let end = n;
  while (end - win >= start && rms(mono.samples, end - win, end) < threshold) end -= win;
  if (end <= start) return { ...mono, samples: new Int16Array(0) };
  return { ...mono, samples: mono.samples.slice(start, end) };
}

/**
 * Picks the reference clip for zero-shot models (Chatterbox reads only the
 * first ~10 s, 15 s for Turbo). Takes the longest recording, trims silence,
 * and keeps up to maxSeconds.
 */
export function pickReferenceClip(wavs: Uint8Array[], maxSeconds = 12): Uint8Array {
  let best: PcmAudio | null = null;
  for (const w of wavs) {
    const d = decodeWav(w);
    if (!d) continue;
    const t = trimSilence(d);
    if (!best || t.samples.length > best.samples.length) best = t;
  }
  if (!best || best.samples.length === 0) throw new Error("no usable recording for a reference clip");
  const max = Math.round(best.sampleRate * maxSeconds);
  return encodeWav(best.samples.slice(0, max), best.sampleRate);
}

/** A soft hum whose length follows the text. Used by the mock provider. */
export function toneWav(seconds: number, sampleRate = 16000, freq = 220): Uint8Array {
  const n = Math.max(1, Math.round(seconds * sampleRate));
  const out = new Int16Array(n);
  const fade = Math.min(n / 2, sampleRate * 0.05);
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / fade, (n - i) / fade);
    const wobble = 1 + 0.15 * Math.sin((2 * Math.PI * 3 * i) / sampleRate);
    out[i] = Math.round(0.2 * env * 32767 * Math.sin((2 * Math.PI * freq * wobble * i) / sampleRate));
  }
  return encodeWav(out, sampleRate);
}
