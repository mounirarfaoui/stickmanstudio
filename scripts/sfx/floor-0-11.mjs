// Sound design for FLOOR 0 — Part 11 "The Leash".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, clang, scrape, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const P8 = "floor-0/part08/sfx/";
  const freeze = at(beats.freeze);
  const stop = at(beats.stop);

  // ---------- the dive and the fall ----------
  boom(0, 1);
  whoosh(0, stop, 100, 1600, 0.5);
  scrape(at(beats.dive[1]), stop - 0.1, 0.12);
  for (let s = 30; s < beats.stop; s += 45) whoosh(at(s), 0.8, 300, 2600, 0.2);
  for (let s = beats.dive[1]; s < beats.stop; s += 14) heartbeat(at(s), 0.25);

  // ---------- the cable bites ----------
  sample(`${P8}snap`, stop - 0.05, 0.9, { from: "onset", dur: 1.6, fadeOut: 0.5 });
  boom(stop, 1);
  thud(stop, 1, 40);
  clang(stop, 0.4);

  // ---------- a door with a zero; kicking at the air ----------
  chime(at(beats.door[0]) + 0.6, 2093, 0.18);
  chime(at(beats.door[0]) + 1.1, 1568, 0.14);
  beats.kicks.forEach((s) => whoosh(at(s), 0.3, 500, 1800, 0.12));

  // ---------- up the cable ----------
  for (let s = beats.up[0]; s < beats.up[1]; s += 24) heartbeat(at(s), 0.22 + (s - beats.up[0]) / 800);
  staticBurst(at(beats.up[1] - 20), 0.3, 0.05);

  // ---------- its eyes; it pulls ----------
  boom(at(beats.eyes), 1);
  chime(at(beats.eyes) + 0.1, 1245, 0.2);
  boom(at(beats.tug), 0.9);
  thud(at(beats.tug), 0.8, 45);
  sample(`${P8}snap`, at(beats.tug), 0.35, { from: "onset", dur: 0.8, fadeOut: 0.3 });
  for (let s = beats.tug; s < beats.freeze; s += 12) heartbeat(at(s), 0.3 + (s - beats.tug) / 300);
  for (let s = beats.choice; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
