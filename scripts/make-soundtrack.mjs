// Procedural, deterministic soundtrack for the BrainLying composition.
// Reads the same beat timings as the video (src/BrainLying/beats.json) and writes public/soundtrack.wav.
// Run: npm run audio
import fs from "node:fs";

const beats = JSON.parse(fs.readFileSync(new URL("../src/BrainLying/beats.json", import.meta.url), "utf8"));
const SR = 48000;
const FPS = beats.fps;
const N = Math.round((beats.duration / FPS) * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const TAU = Math.PI * 2;

const sec = (frame) => frame / FPS;
const idx = (t) => Math.round(t * SR);

// Seeded PRNG so every run produces identical noise
let seed = 20261026;
const noise = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
};

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
// Same shape as the video's interpolate(..., Easing.inOut(Easing.cubic)) tracks
const track = (frame, frames, values) => {
  if (frame <= frames[0]) return values[0];
  for (let i = 0; i < frames.length - 1; i++) {
    if (frame < frames[i + 1]) {
      const t = (frame - frames[i]) / (frames[i + 1] - frames[i]);
      return values[i] + (values[i + 1] - values[i]) * easeInOutCubic(t);
    }
  }
  return values[values.length - 1];
};
const lpCoef = (fc) => 1 - Math.exp((-TAU * fc) / SR);
const add = (i, v, pan = 0) => {
  if (i < 0 || i >= N) return;
  L[i] += v * (1 - pan) * 0.5 * 2 ** 0.5;
  R[i] += v * (1 + pan) * 0.5 * 2 ** 0.5;
};

// ---------- Music bed: soft detuned pad following the story's mood ----------
const NOTE = { A1: 55, F2: 87.31, G2: 98, A2: 110, Bb2: 116.54, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196, A3: 220, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392 };
const chords = [
  { t: 0, notes: ["A2", "C3", "E3", "A3"], gain: 1 }, // hook: unsettled minor
  { t: 5, notes: ["F2", "A2", "C3", "E3"], gain: 0.9 }, // setup
  { t: 10, notes: ["A1", "Bb2", "E3"], gain: 0.75 }, // fear: dissonant cluster
  { t: 16.8, notes: ["A2", "C3", "E3"], gain: 0.6 }, // freeze + breath: thinned out
  { t: 19.2, notes: ["F2", "A2", "C3", "E3"], gain: 0.85 }, // practice
  { t: 21.3, notes: ["G2", "B2", "D3", "G3"], gain: 0.9 },
  { t: 23.4, notes: ["C3", "E3", "G3", "C4"], gain: 1 }, // speaks: major lift
  { t: 26.7, notes: ["C3", "G3", "D4", "E4"], gain: 1 }, // end card: open Cadd9
];
const XF = 0.8;
for (let c = 0; c < chords.length; c++) {
  const start = chords[c].t;
  const end = c + 1 < chords.length ? chords[c + 1].t : beats.duration / FPS;
  const i0 = idx(Math.max(0, start - XF / 2));
  const i1 = Math.min(N, idx(end + XF / 2));
  chords[c].notes.forEach((name, n) => {
    const f = NOTE[name];
    const pan = (n / Math.max(1, chords[c].notes.length - 1)) * 0.8 - 0.4;
    for (let i = i0; i < i1; i++) {
      const t = i / SR;
      const fadeIn = Math.min(1, (t - (start - XF / 2)) / XF);
      const fadeOut = c + 1 < chords.length ? Math.min(1, (end + XF / 2 - t) / XF) : 1;
      const env = Math.sin((Math.max(0, Math.min(fadeIn, fadeOut)) * Math.PI) / 2);
      const swell = 0.8 + 0.2 * Math.sin(TAU * 0.13 * t + n);
      const v =
        Math.sin(TAU * f * t) + Math.sin(TAU * f * 1.0021 * t + 1) + Math.sin(TAU * f * 0.9979 * t + 2) + 0.25 * Math.sin(TAU * f * 2 * t);
      add(i, v * env * swell * chords[c].gain * 0.013, pan);
    }
  });
}

// Hopeful plucked arpeggio once he starts to speak
const arp = ["C4", "E4", "G4", "E4", "D4", "G4", "E4", "C4"];
for (let k = 0, t0 = 23.4; t0 < 29.2; k++, t0 += 0.375) {
  const f = NOTE[arp[k % arp.length]];
  const i0 = idx(t0);
  const level = Math.min(1, (t0 - 23.4) / 1.5) * 0.05;
  for (let j = 0; j < SR * 1.2; j++) {
    const t = j / SR;
    const env = Math.exp(-t * 4.5) * Math.min(1, t * 400);
    add(i0 + j, (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 3 * t) * Math.exp(-t * 12)) * env * level, k % 2 ? 0.3 : -0.3);
  }
}

// ---------- Monster rumble + growl, driven by the video's monster track ----------
{
  let brown = 0;
  let lp1 = 0;
  let lp2 = 0;
  let sawLp = 0;
  let phase = 0;
  const aRumble = lpCoef(140);
  const aSaw = lpCoef(380);
  for (let i = 0; i < N; i++) {
    const frame = (i / SR) * FPS;
    const m = track(frame, beats.monster.frames, beats.monster.values);
    if (m < 0.002 && Math.abs(lp2) < 1e-4) {
      brown *= 0.999;
      continue;
    }
    brown = brown * 0.996 + noise() * 0.06;
    lp1 += aRumble * (brown - lp1);
    lp2 += aRumble * (lp1 - lp2);
    const t = i / SR;
    const sub = Math.sin(TAU * (38 + 14 * m) * t);
    // Pull the rumble back while he breathes so the breath reads
    const duck = 1 - 0.6 * Math.sin(Math.PI * Math.min(1, Math.max(0, (frame - beats.breath[0] + 8) / (beats.breath[1] - beats.breath[0] + 16))));
    const rumble = (lp2 * 2.2 + sub * 0.5) * m ** 1.3 * 0.2 * duck;
    // Growl only when the monster is large, pulsing with the visual roar
    const roar = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.11));
    const growlEnv = Math.max(0, (m - 0.6) / 0.4) ** 1.5 * roar;
    const f = 52 + 6 * Math.sin(TAU * 0.7 * t);
    phase += f / SR;
    const saw = ((phase % 1) * 2 - 1) * (0.6 + 0.4 * Math.sin(TAU * 7 * t));
    sawLp += aSaw * (saw - sawLp);
    add(i, rumble + sawLp * growlEnv * 0.12 * duck, 0);
  }
}

// ---------- One-shot sound effects ----------
const blip = (t0, f0, f1, dur, level, pan = 0) => {
  const i0 = idx(t0);
  let ph = 0;
  for (let j = 0; j < SR * dur * 3; j++) {
    const t = j / SR;
    const f = f1 + (f0 - f1) * Math.exp(-t / (dur * 0.5));
    ph += f / SR;
    const env = Math.exp(-t / (dur * 0.6)) * Math.min(1, t * 2000);
    add(i0 + j, Math.sin(TAU * ph) * env * level, pan);
  }
};

const boom = (t0, level) => {
  const i0 = idx(t0);
  let ph = 0;
  let lp = 0;
  const a = lpCoef(260);
  for (let j = 0; j < SR * 1.4; j++) {
    const t = j / SR;
    ph += (38 + 52 * Math.exp(-t * 9)) / SR;
    lp += a * (noise() - lp);
    const env = Math.exp(-t * 3.2) * Math.min(1, t * 800);
    add(i0 + j, (Math.sin(TAU * ph) * 0.9 + lp * 1.6 * Math.exp(-t * 10)) * env * level, 0);
  }
};

const whoosh = (t0, dur, fFrom, fTo, level) => {
  const i0 = idx(t0);
  let lp = 0;
  let lp2 = 0;
  for (let j = 0; j < SR * dur; j++) {
    const p = j / (SR * dur);
    const a = lpCoef(fFrom * (fTo / fFrom) ** p);
    const x = noise();
    lp += a * (x - lp);
    lp2 += a * 0.25 * (x - lp2);
    const env = Math.sin(Math.PI * Math.min(1, p * 1.6)) ** 2 * (1 - p) ** 0.5;
    add(i0 + j, (lp - lp2) * env * level, Math.sin(p * Math.PI * 2) * 0.4);
  }
};

const breathNoise = (t0, t1, inhale, level) => {
  const i0 = idx(t0);
  const n = idx(t1) - i0;
  let lo = 0;
  let hi = 0;
  for (let j = 0; j < n; j++) {
    const p = j / n;
    const fc = inhale ? 900 + 900 * p : 1500 - 800 * p;
    const x = noise();
    hi += lpCoef(fc) * (x - hi);
    lo += lpCoef(250) * (x - lo);
    const env = inhale ? Math.sin((Math.PI / 2) * Math.min(1, p * 1.3)) * (1 - p) ** 0.3 : Math.sin(Math.PI * Math.min(1, p * 2.5) * 0.5) * (1 - p) ** 1.2;
    add(i0 + j, (hi - lo) * env * level, 0);
  }
};

const heartbeat = (t0, level) => {
  for (const [dt, amp] of [
    [0, 1],
    [0.2, 0.7],
  ]) {
    const i0 = idx(t0 + dt);
    let ph = 0;
    for (let j = 0; j < SR * 0.3; j++) {
      const t = j / SR;
      ph += (48 + 30 * Math.exp(-t * 30)) / SR;
      add(i0 + j, Math.sin(TAU * ph) * Math.exp(-t * 14) * Math.min(1, t * 600) * amp * level, 0);
    }
  }
};

const chime = (t0, f, level, pan = 0) => {
  const i0 = idx(t0);
  for (let j = 0; j < SR * 1.6; j++) {
    const t = j / SR;
    const env = Math.exp(-t * 3) * Math.min(1, t * 1500);
    add(i0 + j, (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t * 6) + 0.15 * Math.sin(TAU * f * 3.98 * t) * Math.exp(-t * 10)) * env * level, pan);
  }
};

// Title + caption word pops (emphasised words land as booms instead)
blip(0.03, 520, 260, 0.08, 0.16);
for (const chunk of beats.captions) {
  const words = chunk.text.split(" ");
  words.forEach((w, i) => {
    const frame = chunk.times?.[i] ?? chunk.from + i * beats.wordStagger;
    if (w.startsWith("*")) {
      boom(sec(frame), 0.42);
    } else {
      const f = 1250 * (1 + 0.06 * (i % 3));
      blip(sec(frame), f, f * 0.55, 0.03, i === 0 ? 0.075 : 0.05, (i % 2 ? 1 : -1) * 0.15);
    }
  });
}

// Hook: the "snap back" flash
whoosh(sec(beats.flash) - 0.15, 0.55, 7000, 250, 0.35);

// Heartbeat speeding up while the fear takes over (frames 300-450)
for (let t = sec(300), gap = 0.9; t < sec(455); t += gap, gap = Math.max(0.58, gap - 0.05)) {
  heartbeat(t, 0.42 * Math.min(1, (t - sec(300)) / 1.2 + 0.4));
}

// Breath: inhale to the peak of the ring, slow exhale after
const [b0, b1] = beats.breath;
const bMid = (b0 + b1) / 2 + 1.5;
breathNoise(sec(b0) + 0.05, sec(bMid), true, 0.22);
breathNoise(sec(bMid), sec(b1) + 0.35, false, 0.2);

// Practice: soft bubble blips, and a small deflate as each attempt shrinks the shadow
for (const f of beats.practice) {
  blip(sec(f), 520, 720, 0.05, 0.08, 0.3);
  blip(sec(f) + 0.09, 640, 900, 0.05, 0.06, 0.3);
  whoosh(sec(f + 22), 0.5, 900, 120, 0.12);
}

// He speaks: bright bubble pop, then the shadow's final shrink
blip(sec(beats.speech[0]), 900, 1400, 0.06, 0.14);
whoosh(sec(beats.speech[0] + 10), 2.2, 1200, 90, 0.1);

// End card: ascending chimes on each word, a shimmer for the subtitle
const pent = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
for (let i = 0; i < beats.endCard.words; i++) {
  chime(sec(beats.endCard.wordsStart + i * beats.endCard.wordStep), pent[i], 0.06, i / 5 - 0.5);
}
chime(sec(beats.endCard.sub), 1318.5, 0.035, 0.3);
chime(sec(beats.endCard.sub) + 0.12, 1567.98, 0.03, -0.3);

// ---------- Master: fades, soft limiter, normalise, 16-bit WAV ----------
const fadeIn = idx(0.4);
const fadeOut = idx(1.2);
let peak = 0;
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / fadeIn, (N - 1 - i) / fadeOut);
  L[i] = Math.tanh(L[i] * 1.2 * g);
  R[i] = Math.tanh(R[i] * 1.2 * g);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;

const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(L[i] * norm * 32767), i * 4);
  data.writeInt16LE(Math.round(R[i] * norm * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const out = new URL("../public/soundtrack.wav", import.meta.url);
fs.mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
fs.writeFileSync(out, Buffer.concat([header, data]));
console.log(`wrote public/soundtrack.wav (${(N / SR).toFixed(2)}s, peak gain ${norm.toFixed(2)})`);
