// Sound design for LAST LIGHT — Part 9 "Gull Point".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { SR, N, storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, heartbeat } = fx;
  const { sample, thud, slap, loop, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const end = N / SR;

  // ---------- the coast road ----------
  loop("coast", 0, at(beats.room) + 0.5, 0.55);
  // limping steps: a heavy one and a dragged one
  for (let s = 8; s < beats.gate - 4; s += 19) {
    if (s > beats.stumble - 6 && s < beats.stumble + 34) continue;
    thud(at(s), 0.12, 90);
    thud(at(s + 9), 0.06, 70);
  }
  for (let s = 10; s < beats.room; s += 22) heartbeat(at(s), 0.22);
  boom(at(96), 0.35);
  whoosh(at(beats.stumble - 2), 0.25, 2200, 400, 0.3);
  thud(at(beats.stumble + 3), 0.45, 75);
  slap(at(beats.stumble + 6), 0.2);

  // ---------- the gate ----------
  sample("gate", at(beats.gate) + 0.1, 0.7, { from: "onset", dur: 3.2, fadeOut: 0.6 });
  sample("gate", at(beats.gate + 80), 0.45, { from: "onset", dur: 1.6, fadeOut: 0.5 });
  for (let s = beats.gate + 50; s < beats.room; s += 19) thud(at(s), 0.1, 90);

  // ---------- inside ----------
  loop("room", at(beats.room) - 0.3, end, 0.45);
  sample("last-light/part05/sfx/creak", at(beats.room), 0.35, { from: "onset", dur: 1.0, fadeOut: 0.3 });
  for (let s = beats.room + 10; s < 530; s += 20) thud(at(s), 0.08, 90);
  // the recorder's loop: tape hiss and static around the message
  staticBurst(at(beats.radio) - 0.35, 0.3, 0.12);
  sample("last-light/part04/sfx/radio", at(beats.radio) - 0.2, 0.18, { from: "onset", dur: 6.8, fadeOut: 0.6 });
  staticBurst(at(740), 0.25, 0.1);
  // lifting it off the desk
  whoosh(at(beats.lift), 0.2, 1500, 400, 0.3);
  thud(at(beats.lift + 4), 0.15, 140);
  boom(at(beats.calendar), 0.3);
  // sliding down the wall
  whoosh(at(beats.slide), 0.25, 900, 200, 0.8);
  thud(at(beats.slide + 30), 0.3, 70);
  // the mirror
  for (let s = beats.mirror; s < beats.window; s += 16) heartbeat(at(s), 0.3 + (s - beats.mirror) / 600);
  boom(at(beats.flash), 0.6);
  whoosh(at(beats.flash), 0.3, 5000, 900, 0.3);
  // the horde on the road
  sample("last-light/part01/sfx/horde", at(beats.window), 0.5, { from: "onset", dur: at(beats.card) - at(beats.window), fadeOut: 1.5 });
  boom(at(beats.horde), 0.55);
  sample("last-light/part01/sfx/growl", at(beats.horde + 6), 0.35, { from: "onset", dur: 1.6, fadeOut: 0.5 });
  // Biscuit turns on Kai
  sample("snarl", at(beats.turn), 0.55, { from: "onset", dur: 2.4, fadeOut: 0.4 });
  sample("snarl", at(beats.growl - 4), 0.75, { from: "onset", dur: at(beats.card) - at(beats.growl - 4), fadeOut: 0.8 });
  for (let s = beats.eye; s < beats.card; s += 13) heartbeat(at(s), 0.4);
  boom(at(beats.card), 0.7);

  return { stem: out, levelSpan: [at(beats.gate), at(beats.card)], levelDb: -22 };
}
