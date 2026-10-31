// Sound design for FLOOR 0 — Part 2 "Floor Sixty-Four".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, loop, scrape, staticBurst, shatter } = makeKit(ctx, fx);
  const at = storySec;
  const P1 = "floor-0/part01/sfx/";
  const freeze = at(beats.freeze);

  // ---------- what A would have done ----------
  for (let s = 6; s < beats.grab; s += 9) thud(at(s), 0.2, 110);
  sample(`${P1}doors`, at(8), 0.6, { from: "onset", dur: 1.4, fadeOut: 0.3 });
  sample(`${P1}steps`, at(45), 0.8, { from: "onset", dur: 0.8, fadeOut: 0.2 });
  boom(at(beats.grab), 1);
  whoosh(at(beats.grab - 6), 0.5, 500, 3000, 0.5);
  boom(at(beats.flashEnd), 0.8);

  // ---------- B: the button, the doors, the fingers ----------
  loop(`${P1}hum`, at(beats.flashEnd), at(beats.smash), 0.25);
  for (let s = 110; s < beats.smash; s += 18) heartbeat(at(s), 0.3);
  thud(at(beats.press), 0.5, 220);
  blip(at(beats.press), 1400, 1000, 0.04, 0.3);
  sample(`${P1}doors`, at(beats.closing[0]), 0.7, { from: "onset", dur: 2.5, fadeOut: 0.5 });
  boom(at(beats.fingers), 0.75);
  scrape(at(beats.fingers), at(beats.smash), 0.12);
  sample(`${P1}kids`, at(beats.pat - 35), 0.2, { dur: 2.2, fadeOut: 0.8 });
  // the first light goes
  boom(at(beats.smash), 0.9);
  shatter(at(beats.smash), 0.8);
  staticBurst(at(460), 0.3, 0.12);
  staticBurst(at(568), 0.2, 0.08);

  // ---------- up to 64 ----------
  sample("lift", at(beats.lift), 0.7, { from: "onset", dur: at(beats.ding) - at(beats.lift), fadeOut: 0.3 });
  boom(at(beats.drawing + 40), 0.4);
  chime(at(beats.ding), 1318.5, 0.5);
  chime(at(beats.ding) + 0.28, 1046.5, 0.45);
  sample(`${P1}doors`, at(beats.open[0]), 0.7, { from: "onset", dur: 2.5, fadeOut: 0.5 });

  // ---------- the ward ----------
  loop("ward", at(beats.open[0]), freeze, 0.32);
  // the monitor, in time with its trace
  for (let t = at(beats.open[1]); t < freeze; t += 44 / 90) blip(t, 1050, 1050, 0.08, 0.14, 0.2);
  for (let s = 860; s < beats.pull[0]; s += 16) thud(at(s), 0.12, 90);
  whoosh(at(beats.pull[0]), 0.4, 800, 2400, 0.25);
  boom(at(beats.pull[1]), 0.8);
  boom(at(beats.chart), 0.45);
  sample("sheets", at(beats.up[0]) - 0.1, 0.8, { from: "onset", dur: at(beats.choice) - at(beats.up[0]), fadeOut: 0.5 });
  for (const s of beats.up) thud(at(s), 0.35, 70);
  for (let s = beats.choice; s < beats.freeze; s += 14) heartbeat(at(s), 0.35 + (s - beats.choice) / 400);
  for (let s = beats.choice; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.12);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);
  boom(at(beats.card), 0.55);
  chime(at(beats.card) + 0.1, 1318.5, 0.3);

  return { stem: out, levelSpan: [0, freeze], levelDb: -21 };
}
