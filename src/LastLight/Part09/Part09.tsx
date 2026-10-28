import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Gait, GAITS, lerpPose, Pose, POSES, skeleton, StickFigure, walkPose } from "../../shared/rig";
import { cameraTransform, clamp01, handheld, impulse, KAI, makeWarp, Shot, shotCamera, track } from "../kit";
import { Captions, PartCard, SeriesBadge, SPEAKERS } from "../Overlays";
import { Darkness, Flashlight, Light } from "../pharmacy";
import { Dog } from "../sets";
import { Defs } from "../world";
import { Bat, Coast, COAST, Compound, GATE, GateSet, Hackles, HordeRoad, Kai, LAMP_Y, LHDefs, MirrorClose, Recorder, ROOM, roadY } from "../lighthouse";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toStory, toOut } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const LIMP: Gait = { stride: 17, knee: 22, arms: 0, lean: 9, limp: 0.85 };
const P9 = {
  // Kai's arm over Mia's shoulders
  kaiLean: { ...POSES.stand, lean: 8, tilt: 10, duck: 0.3, lUA: 78, lFA: 96, rUA: 16, rFA: 26 },
  stumble: { lean: 38, tilt: 18, duck: 0.6, chest: 0.96, lUA: 90, lFA: 60, rUA: 60, rFA: 30, lTh: 70, lSh: -10, rTh: 40, rSh: -50 },
  // Mia: arm round his waist
  hold: { ...POSES.stand, lean: 6, tilt: -4, lUA: -50, lFA: -76, rUA: 18, rFA: 30 },
  brace: { ...POSES.stand, lean: 18, tilt: -10, duck: 0.4, lUA: 30, lFA: 70, rUA: 60, rFA: 90, lTh: -30, lSh: -20, rTh: 34, rSh: 10 },
  torch: { ...POSES.stand, lUA: -10, lFA: 14, rUA: 80, rFA: 88 },
  lift: { ...POSES.stand, lean: -4, tilt: -10, lUA: 110, lFA: 150, rUA: 80, rFA: 88 },
  carry: { ...POSES.stand, tilt: 14, duck: 0.3, lUA: 50, lFA: 100, rUA: 80, rFA: 88 },
  sill: { ...POSES.stand, lean: 10, tilt: -16, lUA: 140, lFA: 168, rUA: 132, rFA: 162 },
  sillFear: { ...POSES.stand, lean: -6, tilt: -4, duck: 0.4, lUA: 120, lFA: 200, rUA: 110, rFA: 190, lTh: -14, lSh: -6, rTh: 14, rSh: 6 },
  wall: { ...POSES.stand, lean: -8, tilt: 14, duck: 0.4, lUA: -20, lFA: -8, rUA: 14, rFA: 6 },
  sit: { ...KAI.sit, tilt: 22, duck: 0.8 },
  mirror: { ...POSES.stand, lean: 4, tilt: -6, duck: 0.2, lUA: 40, lFA: 140, rUA: 30, rFA: 60 },
  recoil: { ...POSES.stand, lean: -10, tilt: 18, duck: 0.5, lUA: 120, lFA: 190, rUA: 20, rFA: 30, lTh: -16, lSh: -6, rTh: 18, rSh: 6 },
} satisfies Record<string, Pose>;

const face = (worry: number, mouth = 0, sweat = 0, smile = 0) => ({ worry, smile, mouth, sweat });
const speedOf = (s: number, f: number[], v: number[]) => Math.abs(track(s + 1, f, v) - track(s - 1, f, v)) / 2;
const moving = (base: Pose, x: number, speed: number, gait: Gait = GAITS.walk, flip = false) =>
  lerpPose(base, walkPose((flip ? -x : x) / 170, gait, base), clamp01(speed / 2));
const pant = (frame: number) => 0.15 + 0.15 * Math.abs(Math.sin(frame * 0.25));
// world position of a skeleton point
const worldOf = (pose: Pose, p: "rHand" | "lHand" | "head", x: number, y: number, scale: number, flip: boolean) => {
  const q = skeleton(pose)[p];
  return { x: x + (flip ? -q.x : q.x) * scale, y: y + q.y * scale };
};

// ================= Scene 1: the coast road at sunset =================
const Crest: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const KX = { f: [0, beats.stumble, beats.stumble + 34, beats.gate], v: [380, 1060, 1070, 1330] };
  const kx = track(s, KX.f, KX.v);
  const kv = speedOf(s, KX.f, KX.v);
  const ky = roadY(kx);
  const stumble = track(s, [beats.stumble - 4, beats.stumble + 4, beats.stumble + 22, beats.stumble + 36], [0, 1, 1, 0]);
  const kaiPose = lerpPose(moving(P9.kaiLean, kx, kv, LIMP), P9.stumble, stumble);
  const mx = kx + 46;
  const miaPose = lerpPose(moving(P9.hold, mx, kv, { ...GAITS.walk, stride: 18 }), P9.brace, stumble);
  const dx = kx + 300 + Math.sin(s * 0.05) * 30;
  const dv = kv + 0.4;
  const night = track(s, [0, beats.gate], [0.04, 0.22]);
  const lh = COAST.lh;
  const lantern = { x: lh.x, y: lh.y + LAMP_Y * lh.s };
  const SHOTS: Shot[] = [
    { from: 0, to: 36, keys: [[0, 430, roadY(430) - 260, 2.4], [36, 700, roadY(640) - 180, 1.45]] },
    { from: 36, to: 82, keys: [[36, 1380, 1050, 0.62], [82, 1440, 1040, 0.7]] },
    { from: 82, to: 145, keys: [[82, lantern.x, lantern.y + 30, 2.1], [145, lantern.x, lantern.y + 10, 3.0]] },
    { from: 145, to: 186, keys: [[145, track(145, KX.f, KX.v) + 40, roadY(track(145, KX.f, KX.v)) - 250, 2.3], [186, track(186, KX.f, KX.v) + 40, roadY(track(186, KX.f, KX.v)) - 250, 2.55]] },
    { from: 186, to: 226, keys: [[186, track(186, KX.f, KX.v) + 260, roadY(1000) - 160, 1.05], [226, track(226, KX.f, KX.v) + 220, roadY(1000) - 160, 1.2]] },
    { from: 226, to: 272, keys: [[226, 1100, roadY(1060) - 150, 1.5], [272, 1100, roadY(1060) - 140, 1.75]] },
    { from: 272, to: 296, keys: [[272, 1500, 1150, 0.82], [296, 1540, 1140, 0.9]] },
    { from: 296, to: 500, keys: [[296, track(296, KX.f, KX.v) + 300, roadY(1300) - 80, 2.6], [beats.gate, track(beats.gate, KX.f, KX.v) + 320, roadY(1330) - 80, 2.9]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(beats.stumble)], 4) * 18;
  return (
    <g transform={cameraTransform(cam, handheld(frame, 5, { x: kick * Math.sin(frame * 3), y: kick * 0.6 }))}>
      <Coast frame={frame} night={night} lamp={0}>
        <Dog x={dx} y={roadY(dx)} scale={0.8} bark={0} walk={dv > 0.3 ? frame / 7 : 0} />
        <Kai pose={kaiPose} x={kx} y={ky} frame={frame} grey={0.22} green={0} face={face(0.75, pant(frame), 0.9)} />
        <StickFigure pose={miaPose} x={mx} y={roadY(mx)} scale={0.92} frame={frame} hair="ponytail" face={face(0.8, stumble > 0.5 ? 0.4 : 0)} prop={(sk) => <Bat sk={sk} angle={20} />} />
      </Coast>
    </g>
  );
};

// ================= Scene 2: the gate =================
const Gate: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const g = GATE.ground + 30;
  const swing = 52 + 22 * Math.sin(frame * 0.06) + 6 * Math.sin(frame * 0.17);
  const KX = { f: [beats.gate, beats.room], v: [200, 900] };
  const kx = track(s, KX.f, KX.v);
  const kv = speedOf(s, KX.f, KX.v);
  const kaiPose = moving(P9.kaiLean, kx, kv, LIMP);
  const mx = kx + 46;
  const miaPose = moving(P9.hold, mx, kv, { ...GAITS.walk, stride: 18 });
  const dx = kx + 260;
  const SHOTS: Shot[] = [
    { from: 0, to: 362, keys: [[beats.gate, GATE.hinge + 200, g - 200, 1.6], [362, GATE.hinge + 150, g - 215, 1.95]] },
    { from: 362, to: 600, keys: [[362, 840, 1180, 0.72], [beats.room, 880, 1170, 0.82]] },
  ];
  const cam = shotCamera(s, SHOTS);
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3.4))}>
      <GateSet frame={frame} night={0.32} swing={swing}>
        <Dog x={dx} y={g} scale={0.8} bark={0} walk={frame / 7} />
        <Kai pose={kaiPose} x={kx} y={g} frame={frame} grey={0.24} green={0} face={face(0.8, pant(frame), 0.9)} />
        <StickFigure pose={miaPose} x={mx} y={g} scale={0.92} frame={frame} hair="ponytail" face={face(0.9)} prop={(sk) => <Bat sk={sk} angle={20} />} />
      </GateSet>
    </g>
  );
};

// ================= Scene 3: inside the compound =================
const G = ROOM.floor;
const Room: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  // Kai staggers in and leans on the wall by the mirror; slides down; drags himself up to the mirror
  const KX = { f: [beats.room, 530], v: [-160, 880] };
  const kx = track(s, KX.f, KX.v);
  const kv = speedOf(s, KX.f, KX.v);
  const sitT = track(s, [beats.slide, beats.slide + 30, 936, 958], [0, 1, 1, 0]);
  let kaiPose: Pose = s < 530 ? moving(P9.kaiLean, kx, kv, LIMP) : lerpPose(P9.wall, P9.sit, sitT);
  if (s >= beats.mirror) kaiPose = s < beats.away + 4 ? P9.mirror : lerpPose(P9.mirror, P9.recoil, track(s, [beats.away, beats.away + 10], [0, 1]));
  const kaiX = s < beats.mirror ? kx : 960;
  const kaiFlip = s >= beats.away + 4 && s < beats.turn;
  const eyeFlick = s > beats.turn ? (Math.sin(frame * 1.3) * Math.sin(frame * 0.41) > 0.2 ? 1 : 0.25) : 0;
  // Mia with the torch; at the desk; lifts the recorder; then at the window
  const MX = { f: [beats.room, 560, beats.desk, 1080, beats.window], v: [-260, 300, 520, 520, 1780] };
  const mx = track(s, MX.f, MX.v);
  const mv = speedOf(s, MX.f, MX.v);
  const lift = track(s, [beats.lift, beats.lift + 18], [0, 1]) * (1 - track(s, [beats.calendar + 30, beats.calendar + 50], [0, 1]));
  let miaPose: Pose = moving(P9.torch, mx, mv);
  if (s >= beats.desk && s < 1080) miaPose = lerpPose(P9.carry, P9.lift, lift);
  if (s >= beats.window) miaPose = lerpPose(P9.sill, P9.sillFear, track(s, [beats.horde - 6, beats.horde + 10], [0, 1]));
  const holding = s >= beats.lift && s < 1080;
  const torchOn = s < beats.window - 20;
  const miaFlip = s > beats.calendar - 8 && s < 880;
  const aim = track(s, [beats.room, 452, 510, 620, beats.desk, beats.lift, beats.calendar - 8, beats.calendar, 840, 872, 880, 940, 1000], [8, -12, 14, 24, 40, 30, 20, 200, 186, 210, -10, 14, 4]) + Math.sin(frame * 0.2) * 5 + Math.sin(frame * 0.07) * 6;
  const torchHand = worldOf(miaPose, "rHand", mx, G, 0.92, miaFlip);
  const recHand = worldOf(miaPose, "lHand", mx, G, 0.92, miaFlip);
  // Biscuit sniffs about, then turns on Kai
  const DX = { f: [beats.room, 540, 700, 980, beats.turn, beats.growl + 50], v: [-80, 1250, 1400, 1260, 1260, 1420] };
  const dx = track(s, DX.f, DX.v);
  const dv = speedOf(s, DX.f, DX.v);
  const dogFlip = (s > 700 && s < 980) || s >= beats.turn - 10;
  const hackles = track(s, [beats.turn, beats.turn + 16], [0, 1]);
  const growl = s > beats.turn ? 0.25 + Math.abs(Math.sin(frame * 0.9)) * 0.2 : 0;
  const recOn = 1;
  const night = track(s, [beats.room, beats.horde], [0.35, 0.9]);
  const W = ROOM.window;
  const lights: Light[] = [
    { kind: "glow", x: W.x + W.w / 2, y: W.y + W.h / 2, r: 360, power: 0.8 - night * 0.3 },
    { kind: "glow", x: W.x + W.w / 2 - 200, y: G - 60, r: 300, power: 0.5 },
    { kind: "glow", x: -60, y: G - 300, r: 260, power: 0.55 },
    { kind: "glow", x: ROOM.recorder.x + 98, y: ROOM.recorder.y - 20, r: 120, power: Math.floor(frame / 6) % 2 ? 0.7 : 0.45 },
    { kind: "glow", x: ROOM.mirror.x + ROOM.mirror.w / 2, y: ROOM.mirror.y + 120, r: 180, power: 0.35 },
    { kind: "glow", x: kaiX, y: G - 220, r: 170, power: 0.5 },
    { kind: "glow", x: mx, y: G - 220, r: 170, power: 0.55 },
    { kind: "glow", x: dx, y: G - 70, r: 130, power: 0.45 },
  ];
  if (torchOn) lights.push({ kind: "cone", x: torchHand.x + Math.cos((aim * Math.PI) / 180) * 26, y: torchHand.y + Math.sin((aim * Math.PI) / 180) * 26, dir: aim, spread: 16, power: 0.95 });
  if (s > beats.turn) lights.push({ kind: "glow", x: kaiX, y: G - 290, r: 90, power: eyeFlick * 0.5 });
  const SHOTS: Shot[] = [
    { from: 0, to: 452, keys: [[beats.room, 1650, 1300, 1.25], [452, 1350, 1310, 1.4]] },
    { from: 452, to: 492, keys: [[452, ROOM.recorder.x, 1220, 3.0], [492, ROOM.recorder.x + 10, 1225, 3.4]] },
    { from: 492, to: 524, keys: [[492, 820, 1180, 0.72], [524, 860, 1180, 0.8]] },
    { from: 524, to: beats.radio, keys: [[524, track(524, KX.f, KX.v), G - 240, 2.4], [beats.radio, 880, G - 240, 2.7]] },
    { from: beats.radio, to: 581, keys: [[beats.radio, ROOM.recorder.x, 1225, 4.4], [581, ROOM.recorder.x - 20, 1230, 4.9]] },
    { from: 581, to: 606, keys: [[581, track(581, MX.f, MX.v) + 10, G - 240, 2.0], [606, track(606, MX.f, MX.v) + 10, G - 250, 2.3]] },
    { from: 606, to: 631, keys: [[606, ROOM.recorder.x + 60, 1240, 6.0], [631, ROOM.recorder.x + 80, 1240, 6.6]] },
    { from: 631, to: 656, keys: [[631, 900, G - 260, 2.8], [656, 905, G - 255, 3.1]] },
    { from: 656, to: 681, keys: [[656, 600, 1200, 0.85], [681, 900, 1200, 1.05]] },
    { from: 681, to: 706, keys: [[681, track(681, MX.f, MX.v) + 10, G - 260, 2.5], [706, track(706, MX.f, MX.v) + 10, G - 255, 2.8]] },
    { from: 706, to: 730, keys: [[706, ROOM.recorder.x - 40, 1230, 5.2], [730, ROOM.recorder.x + 20, 1230, 5.8]] },
    { from: 730, to: beats.lift, keys: [[730, 900, G - 260, 3.2], [beats.lift, 900, G - 260, 2.6]] },
    { from: beats.lift, to: beats.calendar, keys: [[beats.lift, 520, 1180, 2.0], [beats.calendar, 520, 1150, 2.3]] },
    { from: beats.calendar, to: 840, keys: [[beats.calendar, ROOM.calendar.x + 105, ROOM.calendar.y - 40, 3.0], [840, ROOM.calendar.x + 105, ROOM.calendar.y - 10, 3.4]] },
    { from: 840, to: 872, keys: [[840, track(840, MX.f, MX.v), G - 250, 2.6], [872, track(872, MX.f, MX.v), G - 250, 2.9]] },
    { from: 872, to: 900, keys: [[872, 820, 1160, 0.78], [900, 840, 1180, 0.88]] },
    { from: 900, to: 926, keys: [[900, 900, G - 120, 2.6], [926, 900, G - 130, 2.9]] },
    { from: 926, to: 944, keys: [[926, 1260, 1250, 1.3], [944, 1240, 1250, 1.45]] },
    { from: 944, to: beats.mirror, keys: [[944, 930, G - 150, 2.2], [beats.mirror, 930, G - 190, 2.6]] },
    { from: beats.mirror, to: beats.window, keys: [[beats.mirror, 980, G - 250, 2.6], [beats.window, 980, G - 250, 2.9]] },
    { from: beats.window, to: beats.horde, keys: [[beats.window, 1790, G - 250, 2.4], [beats.horde, 1790, G - 265, 2.8]] },
    { from: beats.horde, to: beats.turn, keys: [[beats.horde, 1780, 1000, 1.0], [beats.turn, 1780, 1000, 1.0]] },
    { from: beats.turn, to: 1215, keys: [[beats.turn, 1180, 1200, 0.85], [1215, 1200, 1200, 0.95]] },
    { from: 1240, to: 1270, keys: [[1240, 966, G - 290, 3.6], [1270, 966, G - 290, 4.2]] },
    { from: 1290, to: 1320, keys: [[1290, track(1290, DX.f, DX.v) + 20, G - 90, 3.0], [1320, track(1320, DX.f, DX.v) + 20, G - 90, 3.4]] },
    { from: 1320, to: 1345, keys: [[1320, 972, G - 292, 6.0], [1345, 972, G - 292, 6.8]] },
    { from: 1345, to: 1370, keys: [[1345, track(1345, DX.f, DX.v) + 50, G - 110, 5.0], [1370, track(1370, DX.f, DX.v) + 50, G - 110, 5.6]] },
    { from: 1370, to: 1600, keys: [[1370, 1150, G - 200, 1.5], [beats.card, 1160, G - 200, 1.8]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(beats.turn), toOut(beats.growl), toOut(1320), toOut(1345)], 5) * 16;
  const dust = s >= beats.lift ? clamp01(1 - (s - beats.lift) / 40) : 0;
  return (
    <g transform={cameraTransform(cam, handheld(frame, 5.5, { x: kick * Math.sin(frame * 3), y: kick * 0.5 }))}>
      <Compound frame={frame} recorderOnDesk={!holding} on={recOn} outside={<HordeRoad frame={frame} flow={frame * 3} fill={s > 1080 ? track(s, [1080, beats.turn], [0.25, 1]) : 0} night={night} />}>
        <Dog x={dx} y={G} scale={0.8} bark={growl} walk={dv > 0.4 ? frame / 7 : 0} flip={dogFlip} />
        <Hackles x={dx} y={G} scale={0.8} flip={dogFlip} up={hackles} frame={frame} />
        <Kai pose={kaiPose} x={kaiX} y={G} frame={frame} flip={kaiFlip} grey={0.3} green={eyeFlick} face={face(s > beats.turn ? 0.9 : 0.75, pant(frame) * (s < beats.mirror ? 1 : 0.5), 0.9)} />
        <StickFigure
          pose={miaPose}
          x={mx}
          y={G}
          scale={0.92}
          frame={frame}
          flip={miaFlip}
          hair="ponytail"
          face={face(s > beats.horde ? 1 : 0.7, s > beats.horde ? 0.6 : s > beats.lift && s < beats.calendar ? 0.2 : 0)}
          prop={(sk) => (torchOn ? null : s < beats.window ? null : <Bat sk={sk} angle={150} />)}
        />
        {torchOn ? <Flashlight x={torchHand.x} y={torchHand.y} dir={aim} on={1} /> : null}
        {holding ? <Recorder x={recHand.x - 30} y={recHand.y + 50} frame={frame} on={recOn} dust={0.5} angle={-4} /> : null}
        {dust > 0
          ? Array.from({ length: 14 }, (_, i) => {
              const p = 1 - dust;
              return <circle key={i} cx={recHand.x - 30 + Math.cos(i * 0.9) * (30 + p * 160)} cy={recHand.y - 40 - p * 80 + Math.sin(i * 1.7) * 40} r={6 + p * 14} fill="#c9c2b2" opacity={0.5 * dust} />;
            })
          : null}
        {/* shadows of the dead passing the window slide across the floor */}
        {s > beats.window
          ? Array.from({ length: 9 }, (_, i) => {
              const x = 2300 - ((frame * 9 + i * 260) % 2400);
              return <ellipse key={i} cx={x} cy={G + 40} rx={46} ry={240} fill="#000" opacity={0.35} transform={`skewX(-30)`} />;
            })
          : null}
        <Darkness id="p9dark" lights={lights} dark={0.6} />
      </Compound>
    </g>
  );
};

// ================= Inserts =================
const Mirror: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const green = s < beats.flash ? 0 : s < beats.flash + 26 ? (Math.floor((s - beats.flash) / 3) % 2 ? 1 : 0.35) : 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.5));
  const look = track(s, [beats.away - 4, beats.away + 10], [0, 1]);
  const z = track(s, [beats.mirror, beats.flash, beats.away], [1.0, 1.22, 1.32]);
  const cam = { fx: 540, fy: 980 - (z - 1) * 60, z };
  const kick = impulse(frame, [toOut(beats.flash)], 4) * 24;
  return (
    <g transform={cameraTransform(cam, handheld(frame, 2.4, { x: kick * Math.sin(frame * 3), y: kick * 0.5 }))}>
      <MirrorClose frame={frame} grey={0.32} green={green} look={look} shake={1.5} />
    </g>
  );
};

const Horde: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const z = track(s, [beats.horde, beats.card], [1.05, 1.6]) + (s > beats.turn ? 0.25 : 0);
  return (
    <g transform={cameraTransform({ fx: 560, fy: 1080, z }, handheld(frame, 4))}>
      <HordeRoad frame={frame} flow={frame * 4} fill={track(s, [beats.horde, beats.turn], [0.4, 1])} night={0.5} />
    </g>
  );
};

export const Part09: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);
  // scenes: crest, gate, room, [mirror insert], room, [horde through the window], room
  const scene = s < beats.gate ? 0 : s < beats.room ? 1 : s >= beats.mirror && s < beats.window ? 3 : (s >= beats.horde && s < beats.turn) || (s >= 1215 && s < 1240) || (s >= 1270 && s < 1290) ? 4 : 2;
  const cuts = [beats.gate, beats.room];
  const lastCut = cuts.filter((c) => s >= c).pop() ?? -100;
  const dip = 1 - clamp01((s - lastCut) / 4);
  const punch = impulse(frame, EMPH, 5);
  const flash = s >= beats.flash && s < beats.flash + 6 ? 0.35 * (1 - (s - beats.flash) / 6) : 0;
  const fade = track(s, [beats.card - 20, beats.card], [0, 0.7]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        <LHDefs />
        <g transform={`translate(540 960) scale(${1 + 0.1 * punch}) translate(-540 -960)`}>
          {scene === 0 ? (
            <Crest s={s} frame={frame} />
          ) : scene === 1 ? (
            <Gate s={s} frame={frame} />
          ) : scene === 3 ? (
            <Mirror s={s} frame={frame} />
          ) : scene === 4 ? (
            <Horde s={s} frame={frame} />
          ) : (
            <Room s={s} frame={frame} />
          )}
        </g>
        <rect width={1080} height={1920} fill="url(#vignette9)" />
        <rect width={1080} height={1920} fill="#B6FF5C" opacity={flash} />
        <rect width={1080} height={1920} fill="#000" opacity={Math.max(dip, fade)} />
        <defs>
          <radialGradient id="vignette9" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <SeriesBadge frame={frame} part={9} title="GULL POINT" until={Math.round(toOut(70))} />
      <Captions frame={frame} chunks={timeline.captions} broadcast={["radio"]} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <PartCard frame={frame} from={Math.round(toOut(beats.card))} part={9} embers />
    </AbsoluteFill>
  );
};
