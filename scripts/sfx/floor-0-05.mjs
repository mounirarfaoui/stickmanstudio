// Sound design for FLOOR 0 — Part 5 "Reset".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, loop, staticBurst, shatter } = makeKit(ctx, fx);
  const at = storySec;
  const P1 = "floor-0/part01/sfx/";
  const P4 = "floor-0/part04/sfx/";
  const freeze = at(beats.freeze);

  // ---------- the button, the wall dying ----------
  boom(0, 0.9);
  thud(at(beats.press), 0.9, 50);
  shatter(at(beats.press), 0.7);
  boom(at(beats.press), 1);
  for (let t = at(beats.press); t < at(beats.die[1]); t += 0.5) blip(t, 880, 620, 0.32, 0.2);
  sample("shutdown", at(beats.die[0]), 0.9, { from: "onset", dur: at(beats.die[1]) - at(beats.die[0]) + 0.5, fadeOut: 0.6 });
  for (let s = beats.die[0]; s < beats.die[1]; s += 9) blip(at(s), 2400 - (s - beats.die[0]) * 6, 300, 0.07, 0.12, Math.sin(s) * 0.6);
  for (const s of [20, 60, 110]) boom(at(s), 0.6);
  loop(`${P4}screens`, 0, at(beats.die[1]), 0.4);

  // ---------- he fades ----------
  for (let s = beats.fade[0]; s < beats.gone; s += 6) staticBurst(at(s), 0.05, 0.05 + ((s - beats.fade[0]) / 100) * 0.1);
  whoosh(at(beats.gone) - 0.3, 0.5, 2600, 200, 0.3);
  boom(at(beats.gone), 0.5);

  // ---------- the one screen ----------
  staticBurst(at(beats.screenOn), 0.25, 0.14);
  chime(at(beats.screenOn) + 0.2, 2093, 0.25);
  chime(at(beats.wave), 2637, 0.18);
  for (let s = 480; s < beats.op; s += 22) heartbeat(at(s), 0.22);

  // ---------- the Operator, the doors ----------
  staticBurst(at(beats.op), 0.3, 0.12);
  sample(`${P1}doors`, at(beats.close[0]), 0.7, { from: "onset", dur: 2.5, fadeOut: 0.5 });
  for (let s = beats.timerResume; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);
  for (let s = beats.timerResume; s < beats.freeze; s += 13) heartbeat(at(s), 0.32 + (s - beats.timerResume) / 400);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);
  boom(at(beats.card), 0.45);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
