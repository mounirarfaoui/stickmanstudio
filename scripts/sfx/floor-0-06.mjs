// Sound design for FLOOR 0 — Part 6 "The Headset".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, loop, scrape, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const P1 = "floor-0/part01/sfx/";
  const P4 = "floor-0/part04/sfx/";
  const freeze = at(beats.freeze);

  // ---------- the headset goes on, the wall wakes ----------
  boom(0, 0.8);
  thud(at(beats.on), 0.7, 70);
  sample("radio", at(beats.on), 0.8, { from: "onset", dur: 1.2, fadeOut: 0.3 });
  sample("powerup", at(beats.wake[0]), 0.9, { from: "onset", dur: at(beats.wake[1]) - at(beats.wake[0]) + 0.6, fadeOut: 0.6 });
  for (let s = beats.wake[0]; s < beats.wake[1]; s += 5) blip(at(s), 900 + (s - beats.wake[0]) * 30, 1800, 0.06, 0.1, Math.sin(s) * 0.7);
  boom(at(beats.wake[1]), 0.6);
  for (const s of [60, 110]) boom(at(s), 0.5);
  loop(`${P4}screens`, at(beats.wake[0]), freeze, 0.35);

  // ---------- the doors shut ----------
  sample(`${P1}doors`, at(beats.shut[0]) - 0.2, 0.8, { from: "onset", dur: 1.6, fadeOut: 0.3 });
  thud(at(beats.shut[1]), 0.9, 50);
  boom(at(beats.shut[1]), 0.7);

  // ---------- the wall of falls ----------
  for (let s = beats.pan[0]; s < beats.pan[1]; s += 8) blip(at(s), 1400, 700, 0.08, 0.08, Math.sin(s * 0.7) * 0.8);
  whoosh(at(beats.pan[0]), 1.2, 300, 1200, 0.25);

  // ---------- the voice in the headset ----------
  staticBurst(at(beats.op) - 0.15, 0.3, 0.14);
  blip(at(beats.op) - 0.1, 1200, 1200, 0.04, 0.12);
  for (let s = beats.tally[0]; s < beats.tally[1]; s += 4) scrape(at(s), at(s) + 0.12, 0.08);
  boom(at(beats.tally[0]), 0.5);
  staticBurst(at(beats.op2) - 0.15, 0.3, 0.12);
  for (let s = 300; s < beats.centre; s += 24) heartbeat(at(s), 0.2);

  // ---------- the script, the centre screen ----------
  scrape(at(beats.paper[0]), at(beats.paper[0]) + 0.5, 0.12);
  boom(at(beats.paper[0]), 0.4);
  whoosh(at(beats.zoom[0]), 1.0, 200, 2200, 0.3);
  chime(at(beats.centre) + 0.3, 2093, 0.22);
  staticBurst(at(beats.mic), 0.2, 0.12);
  chime(at(beats.mic) + 0.1, 1568, 0.2);
  for (let s = beats.mic; s < beats.freeze; s += 12) heartbeat(at(s), 0.32 + (s - beats.mic) / 450);
  for (let s = beats.dark[0]; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);
  boom(at(beats.card), 0.45);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
