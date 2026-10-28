// Sound design for LAST LIGHT — Part 10 "Last Light".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { SR, N, storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, heartbeat } = fx;
  const { sample, thud, doorBang, clang, loop, slap } = makeKit(ctx, fx);
  const at = storySec;
  const end = N / SR;

  // ---------- the stair ----------
  loop("tower", 0, at(beats.note), 0.5);
  for (let s = 4; s < beats.well; s += 11) clang(at(s), 0.08);
  for (let s = 6; s < beats.room; s += 24) heartbeat(at(s), 0.3);
  sample("last-light/part03/sfx/bark", at(262), 0.3, { from: "onset", dur: 0.6, fadeOut: 0.3 });
  for (const b of beats.bang) doorBang(at(b), 0.55);
  doorBang(at(beats.gave), 0.9);
  sample("last-light/part02/sfx/glass", at(beats.gave), 0.3, { from: "onset", dur: 1.0, fadeOut: 0.4 });
  sample("last-light/part01/sfx/horde", at(beats.gave), 0.55, { from: "onset", dur: at(beats.room + 40) - at(beats.gave), fadeOut: 1.2 });
  sample("last-light/part01/sfx/growl", at(beats.gave + 8), 0.45, { from: "onset", dur: 1.6, fadeOut: 0.5 });
  whoosh(at(beats.well), 0.4, 3000, 300, 0.6);

  // ---------- the lamp room ----------
  sample("generator", at(beats.pulls[0]) - 0.3, 0.75, { from: "onset", dur: at(beats.note) - at(beats.pulls[0]), fadeOut: 2.0 });
  for (const p of beats.pulls) whoosh(at(p - 6), 0.2, 2500, 700, 0.3);
  boom(at(beats.catch), 0.4);
  for (let s = beats.catch + 2; s < beats.catch + 16; s += 4) thud(at(s), 0.12, 300);
  for (let s = beats.eyes; s < beats.hand; s += 26) heartbeat(at(s), 0.35);
  for (let s = beats.walkHatch[0]; s < beats.walkHatch[1]; s += 16) thud(at(s), 0.15, 90);
  for (let s = beats.descend[0]; s < beats.descend[1]; s += 12) clang(at(s), 0.12);
  // the dead on the stairs below
  sample("last-light/part01/sfx/horde", at(760), 0.45, { from: "onset", dur: at(beats.black) - at(760), fadeOut: 0.6 });
  sample("last-light/part01/sfx/growl", at(beats.turn + 20), 0.5, { from: "onset", dur: 1.6, fadeOut: 0.5 });
  slap(at(beats.close[1]), 0.8);
  thud(at(beats.close[1]), 0.6, 60);
  sample("last-light/part05/sfx/creak", at(beats.close[0]), 0.4, { from: "onset", dur: 0.8, fadeOut: 0.3 });
  slap(at(beats.bolt[1]), 0.5);
  clang(at(beats.bolt[1]), 0.35);
  sample("whine", at(beats.whine), 0.6, { from: "onset", dur: at(beats.note + 60) - at(beats.whine), fadeOut: 1.5 });
  for (let s = beats.reach; s < beats.black; s += 7) thud(at(s), 0.25, 70);
  boom(at(beats.black), 0.6);

  // ---------- the note: almost nothing, the wind and the dog ----------
  loop("tower", at(beats.note), at(beats.lever[1]), 0.25);
  // the lever, the lamp
  clang(at(beats.lever[1]), 0.6);
  sample("lamp", at(beats.lever[1]) - 0.1, 0.8, { from: "onset", dur: at(beats.outside + 40) - at(beats.lever[1]), fadeOut: 2 });
  boom(at(beats.lever[1]), 0.7);
  // the sea under the beam, every night
  loop("sea", at(beats.outside) - 0.5, end, 0.5);
  for (let s = beats.outside; s < beats.rocks; s += 90) whoosh(at(s), 1.2, 500, 200, 0.12);
  // the rocks: the dead below the light
  sample("last-light/part01/sfx/growl", at(beats.rocks + 30), 0.18, { from: "onset", dur: 1.6, fadeOut: 0.8 });

  return { stem: out, levelSpan: [at(beats.gave), at(beats.black)], levelDb: -22 };
}
