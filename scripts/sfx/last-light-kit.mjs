// Sound kit shared by the LAST LIGHT episodes: sample placement (with cross-episode ids such as
// "last-light/part01/sfx/horde") and the procedural hits that have to land on exact frames.
import fs from "node:fs";
import path from "node:path";
import { TAU } from "../synth.mjs";

export const makeKit = (ctx, fx) => {
  const { SR, N, idx, noise, lpCoef, ep } = ctx;
  const { add, boom } = fx;
  const sampleFile = (id) => (id.includes("/") ? path.join(ep.root, "public", `${id}.wav`) : path.join(ep.publicDir, "sfx", `${id}.wav`));
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

  // Footstep on a steel fire escape: a short inharmonic ring
  const clang = (t0, level) => {
    const partials = [
      [420, 1],
      [1060, 0.6],
      [1830, 0.4],
      [2710, 0.25],
    ];
    const detune = 1 + noise() * 0.03;
    for (let j = 0; j < SR * 0.5; j++) {
      const t = j / SR;
      let v = 0;
      for (const [f, a] of partials) v += Math.sin(TAU * f * detune * t) * a * Math.exp(-t * (8 + f / 300));
      add(idx(t0) + j, v * Math.min(1, t * 3000) * level * 0.5, noise() * 0.3);
    }
    thud(t0, level * 0.5, 80);
  };
  const loop = (id, t0, t1, level) => {
    if (!fs.existsSync(sampleFile(id))) return sample(id, t0, level);
    const len = fs.statSync(sampleFile(id)).size / (SR * 4);
    for (let t = t0; t < t1; t += len - 1) sample(id, t, level, { dur: Math.min(len, t1 - t), fadeIn: t === t0 ? 0.4 : 1, fadeOut: 1 });
  };
  const buzz = (t0, t1, level) => {
    // the alley lamp: mains hum that cuts out when it flickers (same pattern as the picture)
    for (let i = idx(t0); i < Math.min(N, idx(t1)); i++) {
      const t = i / SR;
      const frame = t * 30;
      const on = Math.sin(frame * 0.8) * Math.sin(frame * 0.27) > 0.5 ? 0.15 : 1;
      add(i, (Math.sin(TAU * 120 * t) * 0.6 + Math.sin(TAU * 240 * t) * 0.3 + Math.sign(Math.sin(TAU * 120 * t)) * 0.08) * on * level, 0.5);
    }
  };

  return { sampleFile, sample, thud, doorBang, shatter, scrape, staticBurst, alertTone, slap, crackle, clang, loop, buzz };
};
