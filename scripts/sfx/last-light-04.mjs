// Sound design for LAST LIGHT — Part 4 "The Horde".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { SR, N, storySec, stem, effects, beats, timeline } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, breathNoise, blip } = fx;
  const { sample, thud, clang, loop } = makeKit(ctx, fx);
  const at = storySec;
  const end = N / SR;
  const street = at(beats.street);
  const roof = at(beats.roof);

  // ---------- the chase and the fence ----------
  loop("last-light/part02/sfx/alley", 0, street, 0.35);
  sample("last-light/part01/sfx/horde", 0, 0.85, { from: "onset", dur: street, fadeOut: 0.3 });
  for (let s = 2; s < beats.boost[0]; s += 7) thud(at(s), 0.22, 75);
  for (const b of [20, 48, 80]) sample("last-light/part03/sfx/bark", at(b), 0.55, { from: "onset", dur: 0.6, fadeOut: 0.2 });
  boom(at(beats.fence), 0.45);
  sample("fence", at(beats.boost[0]) + 0.2, 0.35, { from: "onset", dur: 1.2, fadeOut: 0.4 });
  sample("fence", at(beats.kaiClimb[0]), 0.4, { from: "onset", dur: at(beats.kaiDrop[0]) - at(beats.kaiClimb[0]), fadeOut: 0.3 });
  thud(at(beats.kick), 0.8, 60);
  thud(at(beats.miaOver[1]), 0.5, 60);
  thud(at(beats.kaiDrop[1]), 0.7, 55);
  for (const h of beats.fenceHits) {
    thud(at(h), 0.8, 50);
    sample("fence", at(h), 0.75, { from: "onset", dur: 0.9, fadeOut: 0.3 });
  }
  breathNoise(at(beats.kaiDrop[1]) + 0.2, at(beats.kaiDrop[1]) + 0.9, true, 0.1);

  // ---------- the street and the ladder ----------
  whoosh(street - 0.15, 0.4, 4000, 300, 0.3);
  sample("last-light/part03/sfx/turn", street, 0.7, { from: "onset", dur: roof - street, fadeIn: 0.2, fadeOut: 0.3 });
  for (let s = beats.street; s < 404; s += 7) thud(at(s), 0.22, 75);
  for (let s = beats.miaUp[0]; s < beats.miaUp[1]; s += 9) clang(at(s), 0.22);
  for (let s = beats.kaiUp[0]; s < beats.kaiUp[1]; s += 8) clang(at(s), 0.28);
  sample("last-light/part01/sfx/growl", at(beats.zArrive[0]) + 0.3, 0.5, { from: "onset", dur: 2, fadeOut: 0.5 });
  for (const p of [beats.pullUp[0] + 8, beats.pullUp[0] + 24]) {
    clang(at(p), 0.6);
    thud(at(p), 0.5, 70);
  }
  boom(at(beats.pullUp[1]), 0.45);

  // ---------- the rooftop ----------
  loop("crowd", roof, end, 0.55);
  breathNoise(roof + 0.2, roof + 1.0, true, 0.1);
  breathNoise(roof + 1.0, roof + 2.2, false, 0.09);
  sample("heli", at(beats.heli[0]), 0.8, { from: "onset", dur: at(beats.heli[1]) - at(beats.heli[0]) + 1.5, fadeIn: 1.2, fadeOut: 1.5 });
  // the radio: static, then the voice comes through
  sample("radio", at(beats.radio), 0.9, { from: "onset", dur: 1.2, fadeOut: 0.3 });
  const voiceLine = timeline.voice.find((v) => v.id === "voice");
  if (voiceLine) sample("radio", voiceLine.speech[1] + 0.05, 0.45, { from: "onset", dur: 0.6, fadeOut: 0.2 });
  blip(at(beats.grabRadio[1]), 1800, 1400, 0.02, 0.15, 0);
  boom(at(beats.stare[0]), 0.4);
  boom(at(beats.card), 0.75);

  // Effects are levelled on the fence fight
  return { stem: out, levelSpan: [at(beats.kaiClimb[0]), at(beats.street)], levelDb: -21 };
}
