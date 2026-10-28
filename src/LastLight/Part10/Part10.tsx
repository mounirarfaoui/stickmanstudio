import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Gait, GAITS, lerpPose, Pose, POSES, skeleton, StickFigure, walkPose } from "../../shared/rig";
import { ACTION, cameraTransform, clamp01, handheld, impulse, KAI, makeWarp, Shot, shotCamera, track } from "../kit";
import { Captions, PartCard, SeriesBadge, SPEAKERS } from "../Overlays";
import { Dog } from "../sets";
import { Defs } from "../world";
import {
  Bat,
  Coast,
  COAST,
  Generator,
  GlassView,
  Kai,
  LAMP_Y,
  LampRoom,
  Lever,
  leverHand,
  LHDefs,
  LR,
  Note,
  Rocks,
  ROCKS,
  stairAt,
  Stairwell,
  tearAt,
  TOWER,
  WellDown,
} from "../lighthouse";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toStory, toOut } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const GREY = 0.6;
const CLIMB: Gait = { stride: 26, knee: 40, arms: 0, lean: 16 };
const P10 = {
  // climbing: Kai reaches ahead for Mia's hand, she reaches back for his
  kaiClimb: { ...POSES.stand, tilt: 14, duck: 0.4, lUA: 76, lFA: 84, rUA: 20, rFA: 30 },
  miaPull: { ...POSES.stand, tilt: -12, lUA: -12, lFA: -6, rUA: -72, rFA: -96 },
  look: { ...POSES.stand, lean: -4, tilt: 30, duck: 0.4, lUA: -12, lFA: -6, rUA: 20, rFA: 30 },
  cordIn: { ...POSES.stand, lean: 22, tilt: 6, duck: 0.4, lUA: 30, lFA: 60, rUA: 62, rFA: 70, lTh: -22, lSh: -10, rTh: 20, rSh: 4 },
  cordOut: { ...POSES.stand, lean: -16, tilt: -10, duck: 0.3, lUA: 20, lFA: 50, rUA: -70, rFA: -100, lTh: -24, lSh: -6, rTh: 26, rSh: 12 },
  sag: { ...POSES.stand, lean: 12, tilt: 24, duck: 0.7, chest: 0.96, lUA: 10, lFA: 14, rUA: 16, rFA: 20 },
  give: { ...POSES.stand, tilt: 10, duck: 0.3, lUA: -10, lFA: -4, rUA: 72, rFA: 80 },
  take: { ...POSES.stand, tilt: 6, duck: 0.4, lUA: -10, lFA: -4, rUA: 64, rFA: 76 },
  ladder: { ...ACTION.climbUp, tilt: -20 },
  upLook: { ...POSES.stand, tilt: -30, lUA: -12, lFA: -6, rUA: 150, rFA: 170 },
  kneel: { lean: 40, tilt: -10, duck: 0.5, chest: 1, lUA: 120, lFA: 150, rUA: 130, rFA: 160, lTh: 90, lSh: -10, rTh: 80, rSh: -30 },
  kneelPush: { lean: 34, tilt: 4, duck: 0.6, chest: 1, lUA: 70, lFA: 80, rUA: 76, rFA: 86, lTh: 90, lSh: -10, rTh: 80, rSh: -30 },
  sob: { lean: 30, tilt: 30, duck: 0.9, chest: 0.95, lUA: 110, lFA: 200, rUA: 100, rFA: 196, lTh: 90, lSh: -10, rTh: 80, rSh: -30 },
  brace: { ...POSES.stand, lean: 10, tilt: -8, duck: 0.3, lUA: 110, lFA: 150, rUA: 120, rFA: 160, lTh: -26, lSh: -14, rTh: 30, rSh: 4 },
  read: { ...KAI.sit, lean: 4, tilt: 20, duck: 0.7, lUA: 60, lFA: 120, rUA: 66, rFA: 126 },
  lever: { ...POSES.stand, lean: 6, tilt: -16, lUA: -10, lFA: -6, rUA: 150, rFA: 168 },
  leverDown: { ...POSES.stand, lean: 16, tilt: 4, duck: 0.4, lUA: -10, lFA: -6, rUA: 100, rFA: 120, lTh: -20, lSh: -8, rTh: 22, rSh: 6 },
  glass: { ...POSES.stand, lean: 4, tilt: -6, lUA: -10, lFA: -4, rUA: 110, rFA: 150 },
  hug: { ...KAI.sit, lean: 10, tilt: 26, duck: 0.8, lUA: 40, lFA: 140, rUA: 46, rFA: 146 },
  dead: { ...POSES.stand, tilt: -34, duck: 0.2, lUA: -6, lFA: 0, rUA: 10, rFA: 4, lTh: -6, lSh: 4, rTh: 8, rSh: 8 },
} satisfies Record<string, Pose>;
const deadReach: Pose = { ...POSES.stand, tilt: 12, duck: 0.3, lUA: 150, lFA: 165, rUA: 150, rFA: 168 };

const face = (worry: number, mouth = 0, sweat = 0, smile = 0) => ({ worry, smile, mouth, sweat });
const pant = (frame: number) => 0.15 + 0.15 * Math.abs(Math.sin(frame * 0.3));
const worldOf = (pose: Pose, p: "rHand" | "lHand" | "head", x: number, y: number, scale: number, flip: boolean) => {
  const q = skeleton(pose)[p];
  return { x: x + (flip ? -q.x : q.x) * scale, y: y + q.y * scale };
};
const eyeFlicker = (frame: number) => (Math.sin(frame * 1.3) * Math.sin(frame * 0.41) > 0.15 ? 1 : 0.35);

// ================= Scene 1: the stair =================
const MU = (s: number) => 2.0 + 0.0085 * Math.min(s, 300);
const deadP = (s: number, i: number) => (s - beats.gave) * 0.013 - 1 - i * 0.14;
const deadPos = (p: number) => {
  if (p < 0) return { x: 300 + Math.min(1, -p) * 1250, y: TOWER.base, flip: true, front: true };
  return stairAt(p);
};

const Stairs: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const mu = MU(s);
  const M = stairAt(mu);
  const K = stairAt(mu - 0.09);
  const D = stairAt(mu + 0.24);
  const look = track(s, [250, 262, 296, 300], [0, 1, 1, 0]);
  const kaiPose = lerpPose(walkPose(((mu - 0.09) * 1480) / 170, CLIMB, P10.kaiClimb), P10.look, look);
  const miaPose = lerpPose(walkPose((mu * 1480) / 170, { ...CLIMB, lean: 10 }, P10.miaPull), P10.look, look);
  const back: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  const put = (front_: boolean, el: React.ReactNode) => (front_ ? front : back).push(el);
  // the dead flood in and climb
  if (s > beats.gave) {
    for (let i = 0; i < 26; i++) {
      const p = deadP(s, i);
      if (p < -1) continue;
      const q = deadPos(p);
      const pose = lerpPose(walkPose(p * 9 + i * 0.3, GAITS.shamble, deadReach), deadReach, 0.3);
      put(q.front, <StickFigure key={`z${i}`} pose={pose} x={q.x + ((i * 37) % 60) - 30} y={q.y} scale={1} frame={frame} color="#3f4a3a" zombie={{ glow: 1 }} flip={q.flip} face={face(0)} />);
    }
  }
  put(D.front, <Dog key="dog" x={D.x} y={D.y} scale={0.8} bark={s > 255 && s < 300 ? Math.abs(Math.sin(frame * 0.7)) * 0.5 : 0} walk={frame / 6} flip={D.flip} />);
  put(K.front, <Kai key="kai" pose={kaiPose} x={K.x} y={K.y} frame={frame} flip={K.flip} grey={GREY - 0.1} green={eyeFlicker(frame)} face={face(0.8, pant(frame), 0.9)} />);
  put(M.front, <StickFigure key="mia" pose={miaPose} x={M.x} y={M.y} scale={0.92} frame={frame} flip={M.flip} hair="ponytail" face={face(0.9, look > 0.5 ? 0.5 : 0.2)} prop={(sk) => <Bat sk={sk} angle={170} />} />);
  const bang = impulse(frame, beats.bang.map(toOut), 3);
  const door = s < beats.gave ? bang * 0.04 : track(s, [beats.gave, beats.gave + 6], [0.1, 1]);
  const b = TOWER.base;
  const SHOTS: Shot[] = [
    { from: 0, to: 40, keys: [[0, stairAt(MU(0) - 0.05).x + 60, stairAt(MU(0)).y - 220, 2.0], [40, stairAt(MU(40) - 0.05).x + 60, stairAt(MU(40)).y - 220, 1.55]] },
    { from: 40, to: 82, keys: [[40, 1040, stairAt(MU(40)).y + 200, 0.48], [82, 1040, stairAt(MU(82)).y + 100, 0.55]] },
    { from: 82, to: 122, keys: [[82, stairAt(MU(82) - 0.09).x, stairAt(MU(82) - 0.09).y - 280, 3.0], [122, stairAt(MU(122) - 0.09).x, stairAt(MU(122) - 0.09).y - 280, 3.3]] },
    { from: 122, to: 160, keys: [[122, stairAt(MU(122)).x, stairAt(MU(122)).y - 240, 2.3], [160, stairAt(MU(160)).x, stairAt(MU(160)).y - 240, 2.5]] },
    { from: 160, to: 194, keys: [[160, stairAt(MU(160) + 0.24).x, stairAt(MU(160) + 0.24).y - 100, 2.2], [194, stairAt(MU(194) + 0.24).x, stairAt(MU(194) + 0.24).y - 100, 2.4]] },
    { from: 194, to: 226, keys: [[194, stairAt(MU(194)).x, stairAt(MU(194)).y - 200, 1.2], [226, stairAt(MU(226)).x, stairAt(MU(226)).y - 200, 1.35]] },
    { from: 226, to: 250, keys: [[226, 1540, b - 200, 1.5], [250, 1540, b - 200, 1.7]] },
    { from: 250, to: beats.gave, keys: [[250, stairAt(MU(250) - 0.05).x, stairAt(MU(250)).y - 260, 2.4], [beats.gave, stairAt(MU(279) - 0.05).x, stairAt(MU(279)).y - 260, 2.8]] },
    { from: beats.gave, to: 500, keys: [[beats.gave, 1300, b - 300, 0.9], [beats.well, 1100, b - 500, 0.75]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [...beats.bang.map(toOut), toOut(beats.gave)], 4) * 18;
  return (
    <g transform={cameraTransform(cam, handheld(frame, 5, { x: kick * Math.sin(frame * 3), y: kick * 0.6 }))}>
      <Stairwell frame={frame} door={door} back={back} front={front} />
      {s > beats.gave ? <ellipse cx={1540} cy={b - 150} rx={300 * clamp01((s - beats.gave) / 6)} ry={200} fill="#9CFF57" opacity={0.15} filter="url(#soft)" /> : null}
    </g>
  );
};

const Well: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const z = track(s, [beats.well, beats.room], [1.0, 1.35]);
  return (
    <g transform={cameraTransform({ fx: 540, fy: 960, z }, handheld(frame, 4))}>
      <g transform={`rotate(${(s - beats.well) * 0.8} 540 960)`}>
        <WellDown frame={frame} climb={(s - beats.well) * 0.03 + 0.2} dead={1} />
      </g>
    </g>
  );
};

// ================= Scene 2: the lamp room =================
const g = LR.floor;
const HX = LR.hatch.x;
const Lamp: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const pulls = beats.pulls;
  // the cord: each pull yanks back, then he leans in again
  const yank = pulls.reduce((a, p) => a + track(s, [p - 8, p, p + 10], [0, 1, 0]), 0);
  const run = s >= beats.catch ? 1 : 0;
  const sputter = pulls.reduce((a, p) => a + track(s, [p, p + 3, p + 16], [0, 1, 0]), 0);
  const work = s < beats.catch ? 0 : s < beats.catch + 18 ? (Math.floor((s - beats.catch) / 2) % 3 ? 1 : 0.15) : 1;
  const lamp = s < beats.lever[1] ? 0 : track(s, [beats.lever[1], beats.lever[1] + 4], [0, 1]);
  const rot = lamp > 0 ? 200 + (s - beats.lever[1]) * 2.6 : 0;
  // Kai: at the generator, then facing Mia, the note, the hatch, down the ladder, down below
  const kaiFlipGen = s < beats.catch + 30;
  const KX = { f: [beats.walkHatch[0], beats.walkHatch[1]], v: [600, HX + 130] };
  let kx = s < beats.catch + 30 ? 560 : s < beats.walkHatch[0] ? 600 : track(s, KX.f, KX.v);
  let ky = g;
  let kaiFlip = kaiFlipGen;
  let kaiPose: Pose = lerpPose(P10.cordIn, P10.cordOut, clamp01(yank));
  if (s >= beats.catch && s < beats.catch + 30) kaiPose = lerpPose(P10.cordIn, P10.sag, track(s, [beats.catch, beats.catch + 20], [0, 1]));
  if (s >= beats.catch + 30) kaiPose = lerpPose(P10.sag, P10.give, track(s, [beats.hand - 16, beats.hand], [0, 1]) * (1 - track(s, [beats.hand + 26, beats.walkHatch[0]], [0, 1])));
  if (s >= beats.walkHatch[0] && s < beats.walkHatch[1]) kaiPose = walkPose(kx / 170, GAITS.walk, POSES.stand);
  if (s >= beats.descend[0]) {
    ky = track(s, beats.descend, [g, LR.landing]);
    kx = HX + 130;
    kaiPose = beats.descend[1] > s ? { ...P10.ladder, rTh: P10.ladder.rTh * Math.abs(Math.sin(s * 0.2)) } : P10.upLook;
    kaiFlip = false;
  }
  if (s >= beats.turn) {
    kaiFlip = true;
    kx = track(s, [beats.turn, beats.turn + 30], [HX + 130, 1460]);
    kaiPose = s < beats.turn + 30 ? walkPose(-kx / 170, GAITS.walk, POSES.stand) : P10.brace;
  }
  const kaiBelow = s >= beats.descend[0] + 20;
  const both = s >= beats.eyes - 10;
  // Mia
  const MX = { f: [beats.room, beats.hand - 20, beats.hand + 10, 690, beats.kneel], v: [900, 900, 760, HX - 60, HX - 20] };
  const mx = track(s, MX.f, MX.v);
  let miaPose: Pose = P10.look;
  let miaFlip = true;
  if (s >= beats.hand - 20) miaPose = lerpPose(P10.look, P10.take, track(s, [beats.hand - 10, beats.hand], [0, 1]) * (1 - track(s, [beats.hand + 20, beats.hand + 30], [0, 1])));
  if (s >= beats.hand + 30 && s < beats.kneel) {
    miaFlip = false;
    miaPose = walkPose(mx / 170, GAITS.walk, POSES.stand);
  }
  if (s >= beats.kneel) {
    miaFlip = false;
    miaPose = s < beats.close[0] ? P10.kneel : s < beats.bolt[1] + 10 ? P10.kneelPush : { ...P10.sob, tilt: 30 + Math.sin(frame * 0.9) * 6 };
  }
  // the lever
  const lv = track(s, beats.lever, [0, 1]);
  if (s >= beats.note) {
    miaFlip = false;
    miaPose = s < beats.lever[0] - 14 ? P10.read : lerpPose(P10.lever, P10.leverDown, lv);
  }
  const miaX = s >= beats.note ? leverHand(0).x - 110 : mx;
  const hatch = track(s, beats.close, [0, 1]);
  const bolt = track(s, beats.bolt, [0, 1]);
  const dx = track(s, [beats.room, beats.whine - 20, beats.whine], [1300, 1300, HX + 90]);
  const dogFlip = s < beats.whine - 20 ? true : false;
  const whine = s >= beats.whine && s < beats.note;
  const hand = worldOf(kaiPose, "rHand", kx, ky, 1, kaiFlip);
  const noteOn = s >= beats.hand - 16 && s < beats.hand + 30;
  const noteAt = s < beats.hand ? hand : worldOf(miaPose, "rHand", mx, g, 0.92, miaFlip);
  // the dead coming up the last flight below
  const below: React.ReactNode[] = [];
  if (s > beats.descend[0]) {
    for (let i = 0; i < 16; i++) {
      const q = Math.min(0.97 - (i % 4) * 0.03, (s - 760) * 0.006 - i * 0.06);
      if (q < 0) continue;
      const x = 200 + q * 1200 + (i % 3) * 20;
      const y = LR.landing + 460 * (1 - q) - (q > 0.9 ? 0 : 0);
      below.push(<StickFigure key={i} pose={lerpPose(deadReach, walkPose(q * 20 + i, GAITS.shamble, deadReach), 0.6)} x={x} y={y} scale={1} frame={frame} color="#0c0f0c" zombie={{ glow: 1 }} face={face(0)} />);
    }
  }
  const flick = s > beats.reach ? (Math.sin(frame * 2.1) * Math.sin(frame * 0.7) > 0 ? 1 : 0.2) : 1;
  const SHOTS: Shot[] = [
    { from: 0, to: 345, keys: [[beats.room, 900, 1200, 0.62], [345, 860, 1210, 0.7]] },
    { from: 345, to: 370, keys: [[345, 520, 1250, 2.2], [370, 520, 1250, 2.4]] },
    { from: 370, to: 392, keys: [[370, LR.gen.x + 150, g - 140, 2.7], [392, LR.gen.x + 150, g - 140, 3.0]] },
    { from: 392, to: beats.catch, keys: [[392, 900, g - 250, 2.6], [beats.catch, 900, g - 250, 2.8]] },
    { from: beats.catch, to: 442, keys: [[beats.catch, 1000, 1200, 0.66], [442, 980, 1200, 0.74]] },
    { from: 442, to: beats.eyes, keys: [[442, 560, g - 290, 3.0], [beats.eyes, 560, g - 290, 3.3]] },
    { from: beats.eyes, to: 500, keys: [[beats.eyes, 900, g - 250, 2.6], [500, 900, g - 250, 2.9]] },
    { from: 500, to: 545, keys: [[500, 604, g - 288, 4.4], [545, 604, g - 288, 5.2]] },
    { from: 545, to: 580, keys: [[545, 760, g - 200, 1.5], [580, 760, g - 200, 1.7]] },
    { from: 580, to: 612, keys: [[580, 690, g - 170, 3.4], [612, 700, g - 170, 3.8]] },
    { from: 612, to: 640, keys: [[612, 600, g - 290, 3.2], [640, 600, g - 290, 3.4]] },
    { from: 640, to: 664, keys: [[640, 1100, 1250, 0.8], [664, 1150, 1250, 0.85]] },
    { from: 664, to: 700, keys: [[664, HX + 130, 1750, 1.0], [700, HX + 130, 1800, 1.1]] },
    { from: 700, to: 736, keys: [[700, HX + 20, g - 120, 2.4], [736, HX + 20, g - 120, 2.7]] },
    { from: 736, to: 775, keys: [[736, HX + 130, 1800, 1.6], [775, HX + 130, 1820, 1.8]] },
    { from: 775, to: beats.close[0], keys: [[775, HX + 140, LR.landing - 290, 3.0], [beats.close[0], HX + 140, LR.landing - 290, 3.4]] },
    { from: beats.close[0], to: beats.bolt[0] - 2, keys: [[beats.close[0], HX + 60, g - 60, 1.8], [beats.bolt[0] - 2, HX + 80, g - 60, 2.0]] },
    { from: beats.bolt[0] - 2, to: beats.whine, keys: [[beats.bolt[0] - 2, HX + LR.hatch.w - 40, g - 34, 5.0], [beats.whine, HX + LR.hatch.w - 30, g - 34, 5.6]] },
    { from: beats.whine, to: 872, keys: [[beats.whine, HX + 90, g - 80, 2.6], [872, HX + 90, g - 80, 2.9]] },
    { from: 872, to: 900, keys: [[872, 1150, 2150, 1.3], [900, 1200, 2150, 1.45]] },
    { from: 900, to: 925, keys: [[900, HX - 20, g - 150, 2.4], [925, HX - 20, g - 150, 2.7]] },
    { from: 925, to: beats.note, keys: [[925, 1300, 2120, 1.6], [beats.note, 1300, 2120, 2.0]] },
    // the lever and the lamp
    { from: beats.note, to: beats.lever[1] + 3, keys: [[beats.lever[0] - 20, leverHand(0.3).x, leverHand(0.3).y, 2.6], [beats.lever[1] + 3, leverHand(1).x, leverHand(1).y, 3.0]] },
    { from: beats.lever[1] + 3, to: 2000, keys: [[beats.lever[1] + 3, 1040, 1150, 0.7], [beats.outside, 1040, 1100, 0.85]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [...beats.pulls.map(toOut), toOut(beats.catch), toOut(beats.close[1]), toOut(beats.bolt[1]), toOut(beats.lever[1])], 4) * 14;
  const dark = s < beats.catch ? 0.5 : 0;
  return (
    <g transform={cameraTransform(cam, handheld(frame, 4.5, { x: kick * Math.sin(frame * 3), y: kick * 0.6 }))}>
      <LampRoom
        frame={frame}
        work={work * flick}
        lamp={lamp}
        rot={rot}
        hatch={hatch}
        bolt={bolt}
        outside={<GlassView frame={frame} lamp={lamp} rot={rot} />}
        below={
          <g>
            {below}
            {kaiBelow ? <Kai pose={kaiPose} x={kx} y={ky} frame={frame} flip={kaiFlip} grey={GREY} green={1} both face={face(0.6, s > 775 && s < 812 ? 0.25 : 0)} /> : null}
            {/* the green of their eyes and a dying bulb; at the end, dark */}
            <rect x={-1200} y={g} width={4600} height={1600} fill="#000" opacity={s > beats.reach ? (flick > 0.5 ? 0.2 : 0.75) : 0.15} />
            <rect x={-1200} y={g} width={4600} height={1600} fill="#000" opacity={track(s, [beats.black - 6, beats.black], [0, 1])} />
          </g>
        }
        front={
          <g>
            <Generator frame={frame} run={run} sputter={clamp01(sputter)} hand={s < beats.catch + 30 ? hand : undefined} />
            {s >= beats.note ? <Lever pull={lv} /> : <Lever pull={0} />}
            <Dog x={dx} y={g} scale={0.8} bark={whine ? 0.25 + Math.abs(Math.sin(frame * 0.5)) * 0.2 : 0} walk={s > beats.whine - 20 && s < beats.whine ? frame / 6 : whine ? frame / 14 : 0} flip={dogFlip} />
            {!kaiBelow ? <Kai pose={kaiPose} x={kx} y={ky} frame={frame} flip={kaiFlip} grey={GREY} green={both ? 1 : eyeFlicker(frame)} both={both} face={face(0.6, s < beats.catch ? pant(frame) : 0, 0.8)} /> : null}
            <StickFigure
              pose={miaPose}
              x={miaX}
              y={g}
              scale={0.92}
              frame={frame}
              flip={miaFlip}
              hair="ponytail"
              face={face(0.95, (s > beats.eyes && s < 530) || (s > 700 && s < 760) ? 0.6 : 0.1)}
            />
            {noteOn ? <rect x={noteAt.x - 24} y={noteAt.y - 18} width={48} height={34} rx={3} fill="#e6dcc2" transform={`rotate(-8 ${noteAt.x} ${noteAt.y})`} /> : null}
            <rect x={-1200} y={-1600} width={4600} height={g + 1600} fill="#02030a" opacity={dark} />
          </g>
        }
      />
    </g>
  );
};

// ================= The note =================
const NoteScene: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const reveal = track(s, [beats.note + 10, 1150], [0, 1]);
  const tears = [1000, 1062, 1108, 1140].map((t) => tearAt(s, t));
  const z = track(s, [beats.note, 1040, 1100, beats.lever[0]], [1.0, 1.12, 1.3, 1.45]);
  const fy = track(s, [beats.note, beats.lever[0]], [880, 1150]);
  const cam = { fx: 540 + Math.sin(s * 0.03) * 30, fy, z };
  // the falling tear itself
  const drops = [1000, 1062, 1108, 1140].map((t, i) => {
    const p = clamp01((s - (t - 12)) / 12);
    if (p <= 0 || p >= 1) return null;
    return <ellipse key={i} cx={300 + ((i * 131) % 500)} cy={200 + p * 700} rx={10} ry={16} fill="#9fd0ff" opacity={0.8} />;
  });
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3))}>
      <Note frame={frame} reveal={reveal} tears={tears} shake={3} />
      {drops}
    </g>
  );
};

// ================= Outside: the beam =================
const Outside: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const rot = 200 + (s - beats.lever[1]) * 2.6;
  const lh = COAST.lh;
  const lantern = { x: lh.x, y: lh.y + LAMP_Y * lh.s };
  const inside = s >= 1255 && s < 1295;
  const SHOTS: Shot[] = [
    { from: 0, to: 1255, keys: [[beats.outside, 1700, 900, 0.58], [1255, 1650, 900, 0.64]] },
    { from: 1295, to: 2000, keys: [[1295, -500, 1050, 0.9], [beats.nights, 300, 1050, 0.95]] },
  ];
  if (inside) {
    const z = track(s, [1255, 1295], [0.9, 1.0]);
    return (
      <g transform={cameraTransform({ fx: 700, fy: 1000, z }, handheld(frame, 3))}>
        <LampRoom frame={frame} work={1} lamp={1} rot={rot} hatch={1} bolt={1} outside={<GlassView frame={frame} lamp={1} rot={rot} />}>
          <StickFigure pose={P10.glass} x={420} y={g} scale={0.92} frame={frame} flip hair="ponytail" face={face(0.6)} />
          <Dog x={700} y={g} scale={0.8} bark={0} flip />
        </LampRoom>
      </g>
    );
  }
  const cam = shotCamera(s, SHOTS);
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3.5))}>
      <Coast frame={frame} night={1} lamp={1} rot={rot} moonY={260} sun={0}>
        <circle cx={lantern.x} cy={lantern.y} r={4} fill="#fff" />
      </Coast>
    </g>
  );
};

// ================= Every night =================
const NIGHT_CUTS = [beats.nights, 1353, 1369, 1390, 1422];
const Nights: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const i = NIGHT_CUTS.filter((c) => s >= c).length - 1;
  const t = s - NIGHT_CUTS[i];
  const tally = [4, 12, 23, 38, 61][i];
  const rot = frame * 3.1 + i * 70;
  if (i === 1) {
    // another night: the beam from far off
    return (
      <g transform={cameraTransform({ fx: 1700, fy: 950, z: 0.55 + t * 0.004 }, handheld(frame, 3))}>
        <Coast frame={frame} night={1} lamp={1} rot={rot} moonY={500} sun={0} />
      </g>
    );
  }
  const z = i === 4 ? 2.3 + t * 0.01 : i === 3 ? 1.5 + t * 0.006 : 1.2 + t * 0.01;
  const fx = i === 4 ? 2000 : i === 3 ? 1400 : 1200;
  const fy = i === 4 ? 1340 : 1300;
  return (
    <g transform={cameraTransform({ fx, fy, z }, handheld(frame, 3))}>
      <LampRoom frame={frame} work={0.8} lamp={1} rot={rot} hatch={1} bolt={1} tally={tally} outside={<GlassView frame={frame} lamp={1} rot={rot} moonY={300 + i * 140} />}>
        <StickFigure pose={{ ...P10.hug, tilt: P10.hug.tilt + Math.sin(frame * 0.05) * 4 }} x={1450} y={g} scale={0.92} frame={frame} hair="ponytail" face={face(0.5)} />
        <Dog x={1280} y={g} scale={0.8} bark={0} />
      </LampRoom>
    </g>
  );
};

// ================= The rocks =================
const RocksScene: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const beamX = track(s, [beats.rocks, 1525, 1560, 1640], [-500, 640, 780, 980]);
  const K = ROCKS.kai;
  const dead = (lit: boolean) => (
    <g>
      {Array.from({ length: 20 }, (_, i) => {
        const x = -320 + i * 48 + ((i * 53) % 40);
        const y = 1380 + ((i * 29) % 50);
        const pose = { ...P10.dead, tilt: -20 - ((i * 7) % 20) + Math.sin(frame * 0.05 + i) * 6, lean: Math.sin(frame * 0.04 + i * 2) * 4 };
        return <StickFigure key={i} pose={pose} x={x} y={y} scale={0.62 + (i % 3) * 0.06} frame={frame} color={lit ? "#56604f" : "#0d100d"} zombie={{ glow: 1 }} face={face(0)} flip={i % 2 === 0} />;
      })}
      <Kai pose={P10.dead} x={K.x} y={K.y} scale={0.72} frame={frame} grey={lit ? 1 : 0.15} green={0} zombie face={face(0)} />
    </g>
  );
  const SHOTS: Shot[] = [
    { from: 0, to: 1490, keys: [[beats.rocks, 520, 1100, 0.72], [1490, 520, 1120, 0.78]] },
    { from: 1490, to: 1525, keys: [[1490, 200, 1260, 1.6], [1525, 280, 1260, 1.75]] },
    { from: 1525, to: 1560, keys: [[1525, K.x - 60, 1250, 1.6], [1560, K.x - 40, 1240, 1.9]] },
    { from: 1560, to: 1600, keys: [[1560, K.x + 6, K.y - 230, 3.2], [1600, K.x + 6, K.y - 230, 3.7]] },
    { from: 1600, to: 2000, keys: [[1600, K.x - 20, K.y - 200, 3.0], [beats.fade[1], 600, 1050, 0.8]] },
  ];
  const cam = shotCamera(s, SHOTS);
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3))}>
      <Rocks frame={frame} beamX={beamX} beam={1}>
        {dead}
      </Rocks>
    </g>
  );
};

export const Part10: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);
  const scene =
    s < beats.well ? 0 : s < beats.room ? 1 : s < beats.note ? 2 : s < beats.lever[0] - 14 ? 3 : s < beats.outside ? 2 : s < beats.nights ? 4 : s < beats.rocks ? 5 : 6;
  const cuts = [beats.room, beats.note, beats.rocks];
  const lastCut = cuts.filter((c) => s >= c).pop() ?? -100;
  const dip = 1 - clamp01((s - lastCut) / 5);
  const punch = impulse(frame, EMPH, 5);
  const blaze = s >= beats.lever[1] && s < beats.lever[1] + 10 ? 0.9 * (1 - (s - beats.lever[1]) / 10) : 0;
  const fade = track(s, beats.fade, [0, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        <LHDefs />
        <g transform={`translate(540 960) scale(${1 + 0.1 * punch}) translate(-540 -960)`}>
          {scene === 0 ? (
            <Stairs s={s} frame={frame} />
          ) : scene === 1 ? (
            <Well s={s} frame={frame} />
          ) : scene === 2 ? (
            <Lamp s={s} frame={frame} />
          ) : scene === 3 ? (
            <NoteScene s={s} frame={frame} />
          ) : scene === 4 ? (
            <Outside s={s} frame={frame} />
          ) : scene === 5 ? (
            <Nights s={s} frame={frame} />
          ) : (
            <RocksScene s={s} frame={frame} />
          )}
        </g>
        <rect width={1080} height={1920} fill="url(#vignette10)" />
        <rect width={1080} height={1920} fill="#fff8e0" opacity={blaze} />
        <rect width={1080} height={1920} fill="#000" opacity={Math.max(dip, fade)} />
        <defs>
          <radialGradient id="vignette10" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <SeriesBadge frame={frame} part={10} title="LAST LIGHT" until={Math.round(toOut(70))} />
      <Captions frame={frame} top={s >= beats.note && s < beats.lever[0] - 14 ? 1600 : 470} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <PartCard frame={frame} from={Math.round(toOut(beats.card))} part={10} embers final />
    </AbsoluteFill>
  );
};
