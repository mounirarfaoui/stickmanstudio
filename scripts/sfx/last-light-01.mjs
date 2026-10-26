// Sound design for LAST LIGHT — Part 1 "Day One". Sampled textures (Suno sounds) where they exist,
// procedural hits wherever an effect has to land on an exact frame or spoken word.
import fs from "node:fs";
import path from "node:path";
import { TAU } from "../synth.mjs";

export default function sfx(ctx) {
  const { SR, FPS, N, idx, storySec, stem, noise, lpCoef, effects, timeline, beats, ep } = ctx;
  const out = stem();
  const fx = effects(out);
  const { add, boom, whoosh, heartbeat } = fx;
  const dur = N / SR;
  const sampleFile = (id) => path.join(ep.publicDir, "sfx", `${id}.wav`);
  const sample = (id, t0, level, opts) => {
    if (fs.existsSync(sampleFile(id))) fx.sample(sampleFile(id), t0, level, opts);
    else console.warn(`sfx: missing ${id}.wav (run npm run sounds)`);
  };

  // ---------- procedural hits ----------
  const thud = (t0, level, f = 60) => {
    let ph = 0;
    for (let j = 0; j < SR * 0.25; j++) {
      const t = j / SR;
      ph += (f + 40 * Math.exp(-t * 40)) / SR;
      add(idx(t0) + j, Math.sin(TAU * ph) * Math.exp(-t * 22) * Math.min(1, t * 900) * level, 0);
    }
  };
  // Heavy fist on a wooden door: low boom, a woody knock and a rattle of the frame
  const doorBang = (t0, level) => {
    boom(t0, level * 0.9);
    let bp1 = 0;
    let bp2 = 0;
    for (let j = 0; j < SR * 0.35; j++) {
      const t = j / SR;
      const x = noise();
      bp1 += lpCoef(900) * (x - bp1);
      bp2 += lpCoef(250) * (x - bp2);
      const knock = (bp1 - bp2) * Math.exp(-t * 28) * 2.2;
      const rattle = (bp1 - bp2) * Math.exp(-t * 9) * (0.5 + 0.5 * Math.sin(TAU * 38 * t)) * 0.35;
      add(idx(t0) + j, (knock + rattle) * level, 0.25);
    }
  };
  // Ceramic shatter: a noise burst plus scattered bright pings
  const shatter = (t0, level) => {
    let hp = 0;
    for (let j = 0; j < SR * 0.25; j++) {
      const t = j / SR;
      const x = noise();
      hp += lpCoef(2500) * (x - hp);
      add(idx(t0) + j, (x - hp) * Math.exp(-t * 18) * level, -0.2);
    }
    for (let k = 0; k < 14; k++) {
      const at = t0 + Math.abs(noise()) * 0.35;
      const f = 2200 + Math.abs(noise()) * 4500;
      for (let j = 0; j < SR * 0.12; j++) {
        const t = j / SR;
        add(idx(at) + j, Math.sin(TAU * f * t) * Math.exp(-t * 45) * level * 0.35, noise() * 0.6);
      }
    }
  };
  const scrape = (t0, t1, level) => {
    let lp = 0;
    for (let i = idx(t0); i < idx(t1); i++) {
      const t = i / SR - t0;
      lp += lpCoef(700) * (noise() - lp);
      const am = 0.55 + 0.45 * Math.sin(TAU * 23 * t) * Math.sin(TAU * 3.1 * t);
      const env = Math.min(1, t / 0.08, (t1 - i / SR) / 0.12);
      add(i, lp * am * env * level * 3, 0.1);
    }
  };
  const staticBurst = (t0, d, level) => {
    let lp = 0;
    for (let j = 0; j < SR * d; j++) {
      lp += lpCoef(4000) * (noise() - lp);
      add(idx(t0) + j, lp * level * Math.min(1, (SR * d - j) / (SR * 0.03)), 0.35);
    }
  };
  // Emergency Alert System style two-tone beep
  const alertTone = (t0, d, level) => {
    for (let j = 0; j < SR * d; j++) {
      const t = j / SR;
      const env = Math.min(1, t / 0.01, (d - t) / 0.02);
      add(idx(t0) + j, (Math.sin(TAU * 853 * t) + Math.sin(TAU * 960 * t)) * 0.5 * env * level, 0.35);
    }
  };
  const slap = (t0, level) => {
    let bp = 0;
    let lo = 0;
    for (let j = 0; j < SR * 0.12; j++) {
      const t = j / SR;
      const x = noise();
      bp += lpCoef(1800) * (x - bp);
      lo += lpCoef(300) * (x - lo);
      add(idx(t0) + j, (bp - lo) * Math.exp(-t * 40) * level, noise() * 0.5);
    }
    thud(t0, level * 0.4, 90);
  };
  const crackle = (t0, t1, level) => {
    // clicks get denser as the crack spreads, then one final snap
    for (let t = t0; t < t1; ) {
      const p = (t - t0) / (t1 - t0);
      const f = 3000 + Math.abs(noise()) * 3000;
      for (let j = 0; j < SR * 0.02; j++) add(idx(t) + j, Math.sin(TAU * f * (j / SR)) * Math.exp(-(j / SR) * 260) * level * (0.4 + p), noise() * 0.4);
      t += 0.12 - 0.1 * p + Math.abs(noise()) * 0.05;
    }
    shatter(t1, level * 0.8);
  };

  // ---------- the scene ----------
  // Night ambience under everything, looped
  const ambFile = sampleFile("ambience");
  if (fs.existsSync(ambFile)) {
    const len = fs.statSync(ambFile).size / (SR * 4);
    for (let t = 0; t < dur; t += len - 1) sample("ambience", t, 0.35, { fadeIn: t === 0 ? 0.3 : 1, fadeOut: 1 });
  }

  // TV switches itself on: static, then the alert beeps, then the anchor
  const tv = storySec(beats.tvOn);
  staticBurst(tv, 0.22, 0.25);
  alertTone(tv + 0.25, 0.16, 0.16);
  alertTone(tv + 0.47, 0.16, 0.16);
  // ...and the broadcast dies
  staticBurst(storySec(beats.tvDead), 0.28, 0.18);

  // Mr. Dawson looks up: a sting and a growl
  const snap = storySec(beats.dawsonSnap);
  boom(snap, 0.5);
  sample("growl", snap + 0.05, 0.9, { from: "onset", dur: 2.2, fadeOut: 0.6 });
  // He charges: fast heavy steps and a rush of air
  for (let s = beats.charge[0]; s < beats.charge[1]; s += 4) thud(storySec(s), 0.35 + 0.4 * ((s - beats.charge[0]) / (beats.charge[1] - beats.charge[0])), 55);
  whoosh(storySec(beats.charge[0]), storySec(beats.charge[1]) - storySec(beats.charge[0]) + 0.3, 400, 3000, 0.3);

  // The mug: slips, falls, shatters
  whoosh(storySec(beats.mugDrop), 0.35, 2500, 600, 0.12);
  shatter(storySec(beats.mugShatter), 0.55);

  // Kai runs for the door and drags the dresser across it
  for (let s = 478; s < 530; s += 7) thud(storySec(s), 0.28, 70);
  scrape(storySec(beats.dresser[0]), storySec(beats.dresser[1]), 0.5);

  // Bangs on the spoken "hit / Again / again", the last one hardest; a muffled growl through the door
  const bangs = timeline.captions.filter((c) => c.line === "hit").flatMap((c) => c.words.map((w) => w.frame / FPS));
  bangs.forEach((t, i) => doorBang(t, 0.55 + i * 0.12));
  if (bangs.length > 1) sample("growl", bangs[1] + 0.25, 0.35, { from: "onset", dur: 1.6, fadeOut: 0.5 });

  // Silence: just a heartbeat, slow then quicker
  const sil = storySec(beats.silence);
  for (let t = sil + 0.3, gap = 0.95; t < storySec(beats.whip) - 0.1; t += gap, gap = Math.max(0.6, gap - 0.04)) heartbeat(t, 0.4);

  // Whip pan to the window: the horde, hands on the glass, the crack
  const whip = storySec(beats.whip);
  whoosh(whip - 0.1, 0.45, 5000, 300, 0.4);
  sample("horde", whip + 0.1, 0.8, { from: "onset", dur: storySec(beats.card) - whip, fadeIn: 0.4, fadeOut: 0.3 });
  [0, 0.15, 0.3, 0.42, 0.55, 0.68, 0.8].forEach((at) => slap(storySec(beats.whip + 6 + at * 70), 0.45));
  crackle(storySec(beats.crack[0]), storySec(beats.crack[1]), 0.3);

  // Cut to the card: one last impact
  boom(storySec(beats.card), 0.75);

  // Effects are levelled on the door-banging section
  return { stem: out, levelSpan: [storySec(572), storySec(666)], levelDb: -21 };
}
