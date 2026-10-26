// Sound design for LAST LIGHT — Part 3 "Mia".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { SR, N, storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, breathNoise } = fx;
  const { sample, thud, doorBang, clang, loop, buzz } = makeKit(ctx, fx);
  const at = storySec;
  const end = N / SR;

  // The alley at night, the buzzing lamp
  loop("last-light/part02/sfx/alley", 0, end, 0.45);
  buzz(0, end, 0.02);

  // The car door flies open, the bat swings, Kai goes down
  doorBang(at(beats.doorBurst[0]), 0.45);
  sample("swoosh", at(beats.batSwing[0]) + 0.1, 0.9, { from: "onset", dur: 1, fadeOut: 0.3 });
  thud(at(beats.batSwing[1]), 0.5, 55);

  // The lurker: a growl as it closes in, the yank, the shove into the car, the bat
  sample("last-light/part01/sfx/growl", at(beats.lurker[0]) + 0.5, 0.5, { from: "onset", dur: 2.4, fadeOut: 0.6 });
  whoosh(at(beats.yank[0]), at(beats.yank[1]) - at(beats.yank[0]) + 0.2, 1500, 400, 0.25);
  thud(at(beats.shove[1]), 0.8, 60);
  doorBang(at(beats.shove[1] + 8), 0.4);
  thud(at(beats.zFall[1]), 0.7, 45);
  sample("swoosh", at(beats.batHit) - 0.25, 0.7, { from: "onset", dur: 0.8, fadeOut: 0.2 });
  thud(at(beats.batHit), 0.9, 70);
  boom(at(beats.batHit), 0.35);
  breathNoise(at(beats.pant[0]), at(beats.pant[0]) + 0.6, true, 0.12);
  breathNoise(at(beats.pant[0]) + 0.6, at(beats.pant[1]), false, 0.1);

  // Moving out: footsteps, the pipe scraped off the ground
  for (let s = beats.move[0]; s < beats.move[1]; s += 12) thud(at(s), 0.08, 110);
  clang(at(beats.pipe[0] + 6), 0.18);

  // Biscuit barks; the street turns; the horde comes in
  for (const b of beats.bark) sample("bark", at(b), 0.9, { from: "onset", dur: 0.7, fadeOut: 0.2 });
  sample("turn", at(beats.turn[0]), 0.9, { from: "onset", dur: at(beats.card) - at(beats.turn[0]), fadeIn: 0.05, fadeOut: 0.3 });
  boom(at(beats.turn[1]), 0.5);
  sample("last-light/part01/sfx/horde", at(beats.pour[0]), 0.8, { from: "onset", dur: at(beats.card) - at(beats.pour[0]), fadeIn: 0.6, fadeOut: 0.2 });
  for (let s = beats.pour[0]; s < beats.card; s += 7) thud(at(s), 0.12 + 0.12 * ((s - beats.pour[0]) / (beats.card - beats.pour[0])), 50);
  whoosh(at(beats.run), 0.5, 2500, 400, 0.2);
  boom(at(beats.card), 0.75);

  // Effects are levelled on the fight with the lurker
  return { stem: out, levelSpan: [at(beats.lurker[1]), at(beats.pant[0])], levelDb: -21 };
}
