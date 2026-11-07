// Sound design for FLOOR 0 — Part 8 "The Cables".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, loop, scrape, clang, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const P1 = "floor-0/part01/sfx/";
  const P4 = "floor-0/part04/sfx/";
  const freeze = at(beats.freeze);

  // ---------- the climb: hands and feet on metal rungs ----------
  boom(0, 0.9);
  for (let s = beats.climb[0] + 4; s < beats.climb[1]; s += 14) clang(at(s), 0.14);
  for (const s of [30, 65]) boom(at(s), 0.45);
  loop(`${P4}screens`, 0, at(beats.emerge[0]), 0.25);
  for (let s = beats.climb[0]; s < beats.emerge[0]; s += 22) heartbeat(at(s), 0.22);

  // ---------- the doors shut below ----------
  sample(`${P1}doors`, at(beats.doors[0]) - 0.2, 0.7, { from: "onset", dur: 1.8, fadeOut: 0.4 });
  thud(at(beats.doors[1]), 0.7, 55);
  staticBurst(at(beats.dark), 0.2, 0.08);

  // ---------- up into the cable room ----------
  whoosh(at(beats.emerge[0]), 1.0, 200, 1600, 0.3);
  scrape(at(beats.emerge[0] + 30), at(beats.snap - 10), 0.03);
  chime(at(beats.tag[1]) - 0.4, 1245, 0.2);

  // ---------- one of them snaps ----------
  sample("snap", at(beats.snap) - 0.05, 1, { from: "onset", dur: 2.2, fadeOut: 0.6 });
  boom(at(beats.snap), 1);
  thud(at(beats.snap), 0.8, 45);

  // ---------- somewhere below, a Theo falls ----------
  whoosh(at(beats.fall[0]), 4.2, 120, 900, 0.45);
  scrape(at(beats.fall[0]), at(beats.fall[1] - 20), 0.12);
  for (let s = beats.fall[0]; s < beats.fall[1]; s += 16) heartbeat(at(s), 0.3);

  // ---------- footsteps and snips, coming closer ----------
  for (let s = beats.steps[0] + 10; s < beats.reveal - 6; s += 18) thud(at(s), 0.12 + (s - beats.steps[0]) / 900, 90);
  beats.snips.forEach((s, i) => {
    sample("snip", at(s) - 0.15, 0.4 + i * 0.12, { from: "onset", dur: 0.9, fadeOut: 0.3 });
    sample("snap", at(s) + 0.05, 0.12 + i * 0.05, { from: "onset", dur: 0.8, fadeOut: 0.4 });
  });

  // ---------- it was her ----------
  staticBurst(at(beats.reveal) - 0.1, 0.25, 0.12);
  boom(at(beats.reveal), 0.95);
  chime(at(beats.reveal) + 0.3, 1568, 0.18);
  chime(at(beats.keyUp[0]), 2093, 0.2);
  sample("snip", at(beats.point[0]), 0.7, { from: "onset", dur: 0.9, fadeOut: 0.3 });
  whoosh(at(beats.point[0]), 0.6, 300, 2400, 0.3);
  for (let s = beats.point[0]; s < beats.freeze; s += 12) heartbeat(at(s), 0.3 + (s - beats.point[0]) / 450);
  for (let s = beats.choice; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);
  boom(at(beats.card), 0.45);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
