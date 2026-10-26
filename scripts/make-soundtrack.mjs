// Mixes an episode's soundtrack into public/<publicDir>/soundtrack.wav:
//   voice  - narration clips placed by <episode>/timeline.json (fx "tv" = small-speaker broadcast filter)
//   music  - public/<publicDir>/music.wav, ducked under the voice
//   sfx    - scripts/sfx/<episode.sfx>.mjs, procedural and sampled effects synced to the story
// Run: npm run audio [-- <episode dir>] (after npm run voice / timeline / music)
import fs from "node:fs";
import path from "node:path";
import { readWav, writeWav } from "./audio-utils.mjs";
import { loadEpisode } from "./episode.mjs";
import { createContext } from "./synth.mjs";

const ep = loadEpisode();
const timeline = ep.readJson("timeline.json");
const beats = ep.readJson("beats.json");
const ctx = createContext({ timeline, beats });
const { SR, N, idx, stem, addTo, lpCoef } = ctx;
const dbToGain = (db) => 10 ** (db / 20);
const rms = ([L, R], t0 = 0, t1 = N / SR) => {
  let s = 0;
  const a = idx(t0);
  const b = Math.min(N, idx(t1));
  for (let i = a; i < b; i++) s += (L[i] * L[i] + R[i] * R[i]) / 2;
  return Math.sqrt(s / Math.max(1, b - a));
};
const scale = ([L, R], g) => {
  for (let i = 0; i < N; i++) {
    L[i] *= g;
    R[i] *= g;
  }
};

// A TV / phone speaker: band-limited and lightly driven
const tvFilter = (x) => {
  const y = new Float32Array(x.length);
  const aHp = lpCoef(380);
  const aLp = lpCoef(3000);
  let lowBand = 0;
  let lp1 = 0;
  let lp2 = 0;
  for (let i = 0; i < x.length; i++) {
    lowBand += aHp * (x[i] - lowBand);
    lp1 += aLp * (x[i] - lowBand - lp1);
    lp2 += aLp * (lp1 - lp2);
    y[i] = Math.tanh(lp2 * 2.2) * 0.8;
  }
  return y;
};

// ================= Voice =================
const voice = stem();
for (const line of timeline.voice) {
  const { sampleRate, channels } = readWav(path.join(ep.root, "public", line.file));
  if (sampleRate !== SR) throw new Error(`${line.file}: expected ${SR} Hz`);
  let x = line.fx === "tv" ? tvFilter(channels[0]) : channels[0];
  // mix.levelLines: bring every line to the same loudness first (plus an optional per-fx offset),
  // so a processed or quieter take doesn't get buried
  if (ep.cfg.mix?.levelLines) {
    const a = Math.max(0, Math.round((line.speech[0] - line.at) * SR));
    const b = Math.min(x.length, Math.round((line.speech[1] - line.at) * SR));
    let e = 0;
    for (let j = a; j < b; j++) e += x[j] * x[j];
    const g = 10 ** (((ep.cfg.mix.fxGainDb?.[line.fx] ?? 0) - 18) / 20) / Math.sqrt(e / Math.max(1, b - a));
    x = x.map((v) => v * g);
  }
  const i0 = idx(line.at);
  for (let j = 0; j < x.length; j++) addTo(voice, i0 + j, x[j]);
}
// Speech activity (for ducking), smoothed with a fast attack / slow release
const speaking = new Float32Array(N);
for (const line of timeline.voice) {
  for (let i = idx(line.speech[0]); i < Math.min(N, idx(line.speech[1])); i++) speaking[i] = 1;
}
const duckEnv = new Float32Array(N);
{
  const att = 1 - Math.exp(-1 / (0.06 * SR));
  const rel = 1 - Math.exp(-1 / (0.35 * SR));
  let e = 0;
  // Look ahead 80 ms so the music is already down when a word starts
  const look = idx(0.08);
  for (let i = 0; i < N; i++) {
    const target = speaking[Math.min(N - 1, i + look)];
    e += (target > e ? att : rel) * (target - e);
    duckEnv[i] = e;
  }
}

// ================= Music =================
const music = stem();
const musicFile = path.join(ep.publicDir, "music.wav");
const hasMusic = fs.existsSync(musicFile);
if (hasMusic) {
  const { sampleRate, channels } = readWav(musicFile);
  if (sampleRate !== SR) throw new Error(`music.wav: expected ${SR} Hz`);
  const [ml, mr] = channels.length > 1 ? channels : [channels[0], channels[0]];
  const fadeOut = idx(2.2);
  for (let i = 0; i < N && i < ml.length; i++) {
    const g = Math.min(1, i / idx(0.4), (N - 1 - i) / fadeOut);
    music[0][i] = ml[i] * g;
    music[1][i] = mr[i] * g;
  }
  // Duck ~10 dB under the narration
  for (let i = 0; i < N; i++) {
    const g = 1 - duckEnv[i] * (1 - dbToGain(-10));
    music[0][i] *= g;
    music[1][i] *= g;
  }
} else {
  console.warn(`no ${path.relative(ep.root, musicFile)} — mixing without music (run npm run music)`);
}

// ================= Sound effects =================
const { default: makeSfx } = await import(`./sfx/${ep.cfg.sfx}.mjs`);
const { stem: sfx, levelSpan, levelDb } = await makeSfx({ ...ctx, ep, dbToGain });

// ================= Mix =================
// Level each stem against the narration: speech RMS -> -18 dBFS, the music bed sits under it,
// effects are measured over the span their module nominates.
const speechSpans = timeline.voice.map((v) => v.speech);
const speechRms = Math.sqrt(speechSpans.reduce((a, [t0, t1]) => a + rms(voice, t0, t1) ** 2 * (t1 - t0), 0) / speechSpans.reduce((a, [t0, t1]) => a + t1 - t0, 0));
scale(voice, dbToGain(-18) / speechRms);
if (hasMusic) scale(music, dbToGain(ep.cfg.mix?.musicDb ?? -27) / rms(music, 0, N / SR));
scale(sfx, dbToGain(levelDb) / rms(sfx, ...levelSpan));

const L = new Float32Array(N);
const R = new Float32Array(N);
const fade = idx(1.2);
let peak = 0;
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / idx(0.05), (N - 1 - i) / fade);
  L[i] = Math.tanh((voice[0][i] + music[0][i] + sfx[0][i]) * g * 1.1);
  R[i] = Math.tanh((voice[1][i] + music[1][i] + sfx[1][i]) * g * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = dbToGain(-1) / peak;
for (let i = 0; i < N; i++) {
  L[i] *= norm;
  R[i] *= norm;
}
const out = path.join(ep.publicDir, "soundtrack.wav");
writeWav(out, SR, [L, R]);
console.log(`wrote ${path.relative(ep.root, out)} (${(N / SR).toFixed(2)}s, music: ${hasMusic ? "yes" : "none"}, post gain ${(20 * Math.log10(norm)).toFixed(1)} dB)`);
