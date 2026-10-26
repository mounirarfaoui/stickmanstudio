// Sound design for LAST LIGHT — Part 5 "The Signal".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { SR, N, storySec, stem, effects, beats, timeline } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, breathNoise, blip, heartbeat } = fx;
  const { sample, thud, slap, staticBurst, loop, scrape } = makeKit(ctx, fx);
  const at = storySec;
  const end = N / SR;
  const door = at(beats.door);

  // ---------- outside: the dead radio, the walk ----------
  loop("last-light/part02/sfx/alley", 0, door, 0.3);
  staticBurst(at(2), at(beats.deadScreen) - at(2), 0.05);
  blip(at(beats.deadScreen), 900, 300, 0.12, 0.12, 0);
  for (let s = beats.shake[0]; s < beats.shake[1]; s += 6) thud(at(s), 0.12, 140);
  slap(at(beats.smack), 0.5);
  staticBurst(at(76), 0.15, 0.08);
  for (let s = beats.walkUp[0] + 6; s < beats.door - 4; s += 17) thud(at(s), 0.14, 90);
  sample("last-light/part01/sfx/growl", at(150), 0.25, { from: "onset", dur: 2, fadeOut: 0.6 });

  // ---------- inside ----------
  loop("store", door, end, 0.5);
  sample("bell", door + 0.05, 0.75, { from: "onset", dur: 1.6, fadeOut: 0.3 });
  sample("creak", door, 0.4, { from: "onset", dur: 1.2, fadeOut: 0.3 });
  thud(at(beats.grabBell[0] + 4), 0.2, 200);
  thud(at(246), 0.35, 70);
  blip(at(beats.torchOn), 2400, 1800, 0.01, 0.25, 0.2);
  for (let s = beats.sweep[0]; s < beats.sweep[1]; s += 22) thud(at(s), 0.08, 110);
  for (let s = beats.behind; s < beats.whip[0]; s += 14) heartbeat(at(s), 0.4);
  // the scare: whip, sting, the bat, the cardboard falling flat
  whoosh(at(beats.whip[0]), 0.35, 3500, 400, 0.5);
  boom(at(456), 0.8);
  whoosh(at(beats.swing[0]), 0.25, 3000, 500, 0.45);
  slap(at(488), 0.9);
  scrape(at(beats.fold[0]), at(beats.fold[1]), 0.15);
  thud(at(beats.fold[1]), 0.6, 70);
  slap(at(beats.fold[1]), 0.35);
  breathNoise(at(512), at(560), true, 0.08);
  // the shelf, the box, the batteries
  for (const s of [beats.sniff[0], beats.sniff[0] + 12, beats.sniff[0] + 24]) thud(at(s), 0.08, 300);
  scrape(at(beats.pull[0]), at(beats.pull[1]), 0.2);
  sample("batteries", at(842), 0.7, { from: "onset", dur: at(beats.live) - at(842), fadeOut: 0.2 });
  // the signal comes through
  sample("last-light/part04/sfx/radio", at(beats.live), 0.85, { from: "onset", dur: 1.0, fadeOut: 0.3 });
  const sig = timeline.voice.find((v) => v.id === "signal");
  if (sig) staticBurst(sig.speech[1] + 0.05, 0.4, 0.05);
  whoosh(at(beats.map[0]) - 0.1, 0.3, 2500, 300, 0.3);
  blip(at(beats.lamp), 660, 880, 0.02, 0.6, 0);
  // the bell, the door, the stranger
  sample("bell", at(beats.bellRing), 0.95, { from: "onset", dur: 1.8, fadeOut: 0.4 });
  boom(at(beats.bellRing), 0.5);
  sample("creak", at(beats.doorOpen[0]), 0.7, { from: "onset", dur: at(beats.doorOpen[1]) - at(beats.doorOpen[0]) + 0.5, fadeOut: 0.4 });
  sample("last-light/part03/sfx/bark", at(beats.doorOpen[0] + 20), 0.3, { from: "onset", dur: 0.8, fadeOut: 0.3 });
  blip(at(beats.blind - 14), 2400, 1800, 0.01, 0.3, -0.2);
  whoosh(at(beats.blind - 4), 0.4, 6000, 800, 0.4);
  boom(at(beats.card), 0.75);

  // Effects are levelled on the scare
  return { stem: out, levelSpan: [at(beats.whip[0]), at(beats.fold[1] + 10)], levelDb: -21 };
}
