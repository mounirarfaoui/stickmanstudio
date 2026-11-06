// Sound design for FLOOR 0 — Part 7 "The Truth".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, loop, scrape, staticBurst, shatter } = makeKit(ctx, fx);
  const at = storySec;
  const P1 = "floor-0/part01/sfx/";
  const P4 = "floor-0/part04/sfx/";
  const P6 = "floor-0/part06/sfx/";
  const freeze = at(beats.freeze);

  // ---------- 200 heads turn at once ----------
  boom(0, 0.9);
  for (let s = beats.turn[0]; s < beats.turn[1]; s += 2) blip(at(s), 2600 - s * 30, 2400 - s * 30, 0.03, 0.08, Math.sin(s * 1.3) * 0.8);
  boom(at(beats.turn[1]), 0.6);
  for (const s of [60, 110]) boom(at(s), 0.45);
  loop(`${P4}screens`, 0, at(beats.voice[0]), 0.3);

  // ---------- into the mic ----------
  sample(`${P6}radio`, at(beats.truth) - 0.3, 0.6, { from: "onset", dur: 1.0, fadeOut: 0.3 });
  for (let s = beats.truth; s < beats.girl; s += 26) heartbeat(at(s), 0.2);

  // ---------- the girl ----------
  whoosh(at(beats.girl), 0.9, 200, 1800, 0.25);
  chime(at(beats.frown), 1245, 0.22);
  staticBurst(at(beats.frown), 0.15, 0.08);

  // ---------- a light goes out ----------
  sample("pop", at(beats.bulb) - 0.05, 1, { from: "onset", dur: 1.4, fadeOut: 0.4 });
  shatter(at(beats.bulb), 0.6);
  boom(at(beats.bulb), 1);
  thud(at(beats.bulb), 0.8, 45);

  // ---------- the voice above ----------
  staticBurst(at(beats.voice[0]) - 0.2, 0.4, 0.16);
  boom(at(beats.voice[0]), 0.6);
  for (let s = beats.voice[0]; s < beats.voice[1]; s += 30) heartbeat(at(s), 0.26);

  // ---------- the hatch, the ladder ----------
  sample("hatch", at(beats.hatch[0]) - 0.1, 0.9, { from: "onset", dur: at(beats.ladder[1]) - at(beats.hatch[0]) + 0.8, fadeOut: 0.5 });
  scrape(at(beats.ladder[0]), at(beats.ladder[1]), 0.1);
  thud(at(beats.ladder[1]), 0.8, 70);
  chime(at(beats.hatch[0]) + 0.5, 2093, 0.18);

  // ---------- the doors, the run ----------
  sample(`${P1}doors`, at(beats.doors[0]) - 0.2, 0.8, { from: "onset", dur: 1.8, fadeOut: 0.4 });
  for (let s = beats.timer; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);
  whoosh(at(beats.centre), 1.0, 200, 2200, 0.3);
  for (let s = beats.centre; s < beats.freeze; s += 12) heartbeat(at(s), 0.3 + (s - beats.centre) / 450);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);
  boom(at(beats.card), 0.45);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
