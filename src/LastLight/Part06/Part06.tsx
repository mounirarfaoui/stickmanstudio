import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import {
  GAITS,
  lerpPose,
  Pose,
  poseAt,
  POSES,
  skeleton,
  Skeleton,
  StickFigure,
  walkPose,
} from "../../shared/rig";
import {
  ACTION,
  cameraTransform,
  clamp01,
  handheld,
  impulse,
  KAI,
  makeWarp,
  Shot,
  shotCamera,
  track,
} from "../kit";
import { Captions, PartCard, SeriesBadge, SPEAKERS } from "../Overlays";
import { Darkness, Flashlight, FRONT, Light, PharmacyFront, Store, STORE } from "../pharmacy";
import {
  GAS,
  GasStation,
  Road,
  ROAD,
  RoadBehind,
  RoadDefs,
  Truck,
  TRUCK,
  TruckLights,
} from "../road";
import { Dog, NightSky } from "../sets";
import { Defs, Zombie } from "../world";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toStory, toOut } = makeWarp(timeline);
// output frames of the emphasised words: the camera punches in on each
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

// Poses (side view facing +x)
const P6 = {
  ...KAI,
  ...ACTION,
  torch: { ...POSES.stand, lUA: -10, lFA: 14, rUA: 80, rFA: 88 },
  torchLow: { ...POSES.stand, lUA: -10, lFA: 14, rUA: 30, rFA: 60 },
  shield: { ...POSES.stand, lean: -8, tilt: 14, duck: 0.4, lUA: 140, lFA: 236, rUA: 30, rFA: 60 },
  lift: { ...POSES.stand, lean: 10, tilt: 6, duck: 0.2, lUA: 70, lFA: 96, rUA: 78, rFA: 100, lTh: -14, lSh: -8, rTh: 16, rSh: 4 },
  bottles: { ...POSES.stand, lUA: 60, lFA: 110, rUA: 20, rFA: 40 },
  reach: { ...POSES.stand, lean: 18, tilt: -8, lUA: 100, lFA: 96, rUA: -30, rFA: -10, lTh: -24, lSh: -16, rTh: 26, rSh: 8 },
  slump: { ...POSES.stand, lean: 16, tilt: 22, duck: 0.6, chest: 0.96, lUA: 20, lFA: 10, rUA: 24, rFA: 14, lTh: -12, lSh: -4, rTh: 14, rSh: 6 },
  // riding in the bed: sat with the knees up
  ride: { ...KAI.sit, lean: -14, tilt: 6, lUA: 30, lFA: 80, rUA: 50, rFA: 96 },
  rideUp: { ...KAI.sit, lean: -8, tilt: -26, duck: 0.1, lUA: 30, lFA: 80, rUA: 50, rFA: 96 },
  ridePat: { ...KAI.sit, lean: -4, tilt: 10, lUA: 30, lFA: 80, rUA: 110, rFA: 120 },
  rideFlinch: { ...KAI.sit, lean: -26, tilt: -10, duck: 0.5, lUA: 120, lFA: 170, rUA: 130, rFA: 176 },
  // Mia (her bat angle comes from BAT)
  batReady: { ...POSES.stand, lean: 4, tilt: -4, duck: 0.2, lUA: -105, lFA: 55, rUA: -112, rFA: 62 },
  batDown: { ...POSES.stand, lUA: 12, lFA: 24, rUA: 14, rFA: 26 },
  grab: { ...POSES.stand, lean: 10, tilt: -6, duck: 0.2, lUA: 84, lFA: 88, rUA: 14, rFA: 26, lTh: -18, lSh: -10, rTh: 14, rSh: 6 },
  miaRide: { ...KAI.sit, lean: -8, tilt: 4, duck: 0.3, lUA: 40, lFA: 84, rUA: 50, rFA: 90 },
  miaWatch: { ...KAI.sit, lean: 6, tilt: -10, duck: 0.4, lUA: 40, lFA: 84, rUA: 50, rFA: 90 },
  shout: { ...POSES.stand, lean: 20, tilt: -18, chest: 1.05, lUA: -30, lFA: -50, rUA: 30, rFA: 50, lTh: -20, lSh: -14, rTh: 22, rSh: 6 },
  // the strangers
  rifle: { ...POSES.stand, lean: 4, lUA: 60, lFA: 100, rUA: 80, rFA: 90 },
  rifleDown: { ...POSES.stand, lean: -2, lUA: 20, lFA: 40, rUA: 14, rFA: 30 },
  palm: { ...POSES.stand, lean: -4, tilt: -6, lUA: 20, lFA: 40, rUA: 120, rFA: 170 },
  lounge: { ...POSES.stand, lean: -6, tilt: 4, lUA: 20, lFA: 40, rUA: -20, rFA: 30 },
  nozzle: { ...POSES.stand, lean: 6, tilt: 6, lUA: 20, lFA: 40, rUA: 62, rFA: 70 },
  drive: { ...KAI.sit, lUA: 70, lFA: 100, rUA: 72, rFA: 104 },
  lean: { ...KAI.sit, lean: 10, tilt: -10, lUA: 70, lFA: 100, rUA: 40, rFA: 140 },
  // the zombie at the roadside
  lunge: { ...POSES.stand, lean: 22, tilt: 12, duck: 0.3, lUA: 80, lFA: 92, rUA: 86, rFA: 98, lTh: -26, lSh: -18, rTh: 30, rSh: 6 },
  sprawl: { ...POSES.stand, lean: 70, tilt: 20, duck: 0.4, lUA: 120, lFA: 130, rUA: 140, rFA: 150, lTh: -40, lSh: -20, rTh: 50, rSh: 10 },
} satisfies Record<string, Pose>;
type P6Pose = keyof typeof P6;

// Where Mia's bat points (degrees, rig convention) for each of her poses
const BAT: Partial<Record<P6Pose, number>> = {
  batReady: -150,
  batDown: 8,
  grab: 10,
  miaRide: 80,
  miaWatch: 80,
  shout: 30,
  stand: 10,
};

const face = (worry: number, mouth = 0, sweat = 0, smile = 0) => ({ worry, smile, mouth, sweat });
const speedOf = (s: number, f: number[], v: number[]) => Math.abs(track(s + 1, f, v) - track(s - 1, f, v)) / 2;
const moving = (base: Pose, x: number, speed: number, flip: boolean) =>
  lerpPose(base, walkPose((flip ? -x : x) / (speed > 9 ? 300 : 190), speed > 9 ? GAITS.run : GAITS.walk, base), clamp01(speed / 3));
// Interpolated pose plus the bat angle that goes with it
const keyed = (s: number, keys: [number, P6Pose][]) => {
  const pose = poseAt<P6Pose>(s, keys, P6);
  let i = keys.findIndex(([f]) => f > s);
  if (i === -1) i = keys.length;
  const [f0, k0] = keys[Math.max(0, i - 1)];
  const [f1, k1] = keys[Math.min(keys.length - 1, i)];
  const t = f1 === f0 ? 1 : clamp01((s - f0) / (f1 - f0));
  const bat = (BAT[k0] ?? 10) + ((BAT[k1] ?? 10) - (BAT[k0] ?? 10)) * (t * t * (3 - 2 * t));
  return { pose, bat };
};
// A hop along an arc from (x0, y0) to (x1, y1)
const arc = (s: number, s0: number, s1: number, x0: number, y0: number, x1: number, y1: number, h = 120) => {
  const t = clamp01((s - s0) / (s1 - s0));
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * h, t };
};

const Bat: React.FC<{ sk: Skeleton; angle: number }> = ({ sk, angle }) => {
  const r = (angle * Math.PI) / 180;
  const h = sk.rHand;
  const tip = { x: h.x + Math.sin(r) * 150, y: h.y + Math.cos(r) * 150 };
  return (
    <g>
      <line x1={h.x - Math.sin(r) * 14} y1={h.y - Math.cos(r) * 14} x2={tip.x} y2={tip.y} stroke="#b0844e" strokeWidth={13} strokeLinecap="round" />
      <line x1={h.x + Math.sin(r) * 60} y1={h.y + Math.cos(r) * 60} x2={tip.x} y2={tip.y} stroke="#b0844e" strokeWidth={20} strokeLinecap="round" />
    </g>
  );
};

// Wade's gear: a wide-brimmed hat, and a rifle held at `angle` (rig convention, 0 = pointing down)
const Wade: React.FC<{ sk: Skeleton; rifle: number }> = ({ sk, rifle }) => {
  const r = (rifle * Math.PI) / 180;
  const h = sk.lHand;
  return (
    <g>
      <line
        x1={h.x - Math.sin(r) * 50}
        y1={h.y - Math.cos(r) * 50}
        x2={h.x + Math.sin(r) * 130}
        y2={h.y + Math.cos(r) * 130}
        stroke="#1a120c"
        strokeWidth={13}
        strokeLinecap="round"
      />
      <line x1={h.x - Math.sin(r) * 50} y1={h.y - Math.cos(r) * 50} x2={h.x - Math.sin(r) * 10} y2={h.y - Math.cos(r) * 10} stroke="#5a3a22" strokeWidth={20} strokeLinecap="round" />
      <g transform={`translate(${sk.head.x} ${sk.head.y}) rotate(${sk.headAngle})`}>
        <ellipse cx={0} cy={-24} rx={56} ry={9} fill="#6b4a2c" />
        <path d="M -28 -26 Q -26 -64 0 -62 Q 26 -64 28 -26 Z" fill="#6b4a2c" />
        <rect x={-28} y={-34} width={56} height={8} fill="#3a2414" />
        {/* stubble */}
        <path d="M -20 8 Q 0 30 20 8 L 20 16 Q 0 36 -20 16 Z" fill="#2a2a2a" opacity={0.6} />
      </g>
    </g>
  );
};
const Beanie: React.FC<{ sk: Skeleton }> = ({ sk }) => (
  <g transform={`translate(${sk.head.x} ${sk.head.y}) rotate(${sk.headAngle})`}>
    <path d="M -32 -8 Q -32 -46 0 -46 Q 32 -46 32 -8 Z" fill="#8a2a2a" />
    <rect x={-34} y={-14} width={68} height={12} rx={4} fill="#6a1e1e" />
    <circle cx={0} cy={-50} r={9} fill="#6a1e1e" />
  </g>
);
const Bottles: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    {[-14, 10].map((bx) => (
      <g key={bx}>
        <rect x={x + bx - 9} y={y - 34} width={18} height={44} rx={5} fill="#7fc8ff" opacity={0.8} />
        <rect x={x + bx - 5} y={y - 42} width={10} height={9} fill="#2a6ab0" />
      </g>
    ))}
  </g>
);

// A point of the figure's skeleton in world coordinates
const worldOf = (sk: Skeleton, p: keyof Skeleton, x: number, y: number, scale: number, flip: boolean) => {
  const q = sk[p] as { x: number; y: number };
  return { x: x + (flip ? -q.x : q.x) * scale, y: y + q.y * scale };
};
// A torch aimed `aim` degrees below the figure's facing direction, held in the right hand
const torchOf = (pose: Pose, x: number, y: number, flip: boolean, aim: number, scale = 1) => {
  const hand = worldOf(skeleton(pose), "rHand", x, y, scale, flip);
  const dir = flip ? 180 - aim : aim;
  const a = (dir * Math.PI) / 180;
  return { hand, dir, tip: { x: hand.x + Math.cos(a) * 30 * scale, y: hand.y + Math.sin(a) * 30 * scale } };
};

// June behind the wheel, in truck-local coordinates (the window clips her)
const June: React.FC<{ frame: number; turn: number; smile: number }> = ({ frame, turn, smile }) => {
  const pose = turn > 0.5 ? P6.lean : P6.drive;
  return (
    <StickFigure
      pose={pose}
      x={466 - turn * 20}
      y={-120}
      scale={0.95}
      frame={frame}
      flip={turn > 0.5}
      face={face(0, 0, 0, smile)}
      prop={(sk) => <Beanie sk={sk} />}
    />
  );
};

// ================= Scene 1: the pharmacy doorway =================
const G = STORE.floor;
const Doorway: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const kx = 1640;
  const mx = 1800;
  const dx = 2010;
  const wx = 2400;
  const shield = 1 - clamp01((s - 26) / 10);
  const lookDoor = clamp01((s - beats.headlights) / 6) * (1 - clamp01((s - 100) / 10));
  const kaiPose = lerpPose({ ...P6.torchLow, tilt: -lookDoor * 10 }, P6.shield, shield);
  const mia = keyed(s, [
    [0, "batReady"],
    [150, "batReady"],
  ]);
  const miaPose = { ...mia.pose, tilt: mia.pose.tilt + Math.sin(frame * 1.9) * 2 - lookDoor * 8 };
  const wadePose = lerpPose(lerpPose(P6.rifle, P6.rifleDown, clamp01((s - beats.rifleDown[0]) / 20)), P6.palm, track(s, [128, 140, 180, 196], [0, 1, 1, 0]));
  const rifleAng = track(s, beats.rifleDown, [102, 20]);
  const aim = track(s, beats.lower, [2, 38]) + (s > 140 && s < 190 ? Math.sin((s - 140) * 0.12) * 14 : 0);
  const wTorch = torchOf(wadePose, wx, G, true, aim, 1.05);
  const kTorch = torchOf(kaiPose, kx, G, false, 40);
  const hl = s > beats.headlights ? Math.min(1, (s - beats.headlights) / 3) * (s < beats.headlights + 4 ? 1.4 : 1) : 0;
  const lights: Light[] = [
    { kind: "glow", x: STORE.door.x + STORE.door.w / 2, y: 1180, r: 150, power: 0.35 },
    { kind: "glow", x: STORE.door.x + STORE.door.w / 2, y: 1250, r: 560 * hl, power: Math.min(1, 0.95 * hl) },
    { kind: "cone", x: wTorch.tip.x, y: wTorch.tip.y, dir: wTorch.dir, spread: 18 },
    { kind: "cone", x: kTorch.tip.x, y: kTorch.tip.y, dir: kTorch.dir, power: 0.55 },
  ];
  for (const c of [kx, mx, wx]) lights.push({ kind: "glow", x: c, y: G - 280, r: 170, power: 0.45 });
  const SHOTS: Shot[] = [
    { from: 0, to: 30, keys: [[0, 2330, 1200, 2.4], [30, 2340, 1200, 2.0]] },
    { from: 30, to: 60, keys: [[30, kx + 10, 1190, 2.6], [60, kx + 10, 1195, 2.85]] },
    { from: 60, to: 104, keys: [[60, 1980, 1210, 1.0], [104, 2020, 1210, 1.3]] },
    { from: 104, to: 128, keys: [[104, wx - 20, 1190, 2.6], [128, wx - 20, 1190, 2.9]] },
    { from: 128, to: 150, keys: [[128, mx + 10, 1180, 3.0], [150, mx + 10, 1185, 3.4]] },
    { from: 150, to: 176, keys: [[150, wx - 40, 1200, 1.9], [176, wx - 60, 1200, 2.2]] },
    { from: 176, to: 400, keys: [[176, 1730, 1225, 1.8], [200, 1740, 1220, 2.05]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(beats.headlights)], 4) * 16;
  const blind = 1 - clamp01(s / 12);
  return (
    <g>
      <g transform={cameraTransform(cam, handheld(frame, 3.2, { x: kick * Math.sin(frame * 3), y: kick * 0.5 }))}>
        <Store
          frame={frame}
          door={0.85}
          standeeFall={1}
          standeeWobble={0}
          hookSwing={2}
          boxOut={1}
          front={
            <g>
              {/* the truck's headlights blaze through the door glass */}
              {hl > 0 ? (
                <g>
                  <ellipse cx={STORE.door.x + 110} cy={1250} rx={180} ry={260} fill="#fff3c4" opacity={0.35 * hl} filter="url(#soft)" />
                  {[0, 1].map((i) => (
                    <circle key={i} cx={STORE.door.x + 50 + i * 120} cy={1300} r={24} fill="#fffbe8" opacity={0.9 * Math.min(1, hl)} />
                  ))}
                </g>
              ) : null}
              <Dog x={dx} y={G} scale={0.8} bark={0.35 + Math.abs(Math.sin(frame * 0.6)) * 0.3} />
              <StickFigure
                pose={wadePose}
                x={wx}
                y={G}
                scale={1.05}
                frame={frame}
                flip
                face={face(0, 0, 0, s > 120 ? 1 : 0.3)}
                prop={(sk) => <Wade sk={sk} rifle={rifleAng} />}
              />
              <Flashlight x={wTorch.hand.x} y={wTorch.hand.y} dir={wTorch.dir} on={1} />
              <StickFigure pose={miaPose} x={mx} y={G} scale={0.92} frame={frame} hair="ponytail" face={face(0.9)} prop={(sk) => <Bat sk={sk} angle={mia.bat} />} />
              <StickFigure pose={kaiPose} x={kx} y={G} scale={1} frame={frame} face={face(0.8, s > 60 && s < 90 ? 0.3 : 0)} />
              <Flashlight x={kTorch.hand.x} y={kTorch.hand.y} dir={kTorch.dir} on={1} />
            </g>
          }
        />
        <Darkness id="p6dark" lights={lights} />
      </g>
      <rect width={1080} height={1920} fill="#fffbe8" opacity={blind} />
    </g>
  );
};

// ================= Scene 2: outside, the truck =================
const TX1 = 1900;
const Curb: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const g = FRONT.ground;
  const bedY = g + TRUCK.bed;
  const KX = { f: [200, 280, 418, 440, 452, 470], v: [1560, 1770, 1770, 1730, 1730, 1830] };
  const MX = { f: [205, 290, 404, 416, 505], v: [1500, 1660, 1660, 1700, 1720] };
  const DX = { f: [200, 250, 300, 330, 440, 466], v: [1600, 2010, 2010, 1990, 1990, 1860] };
  const WX = { f: [200, 300], v: [1600, 2720] };
  // Kai: walks out, nods, gets pulled back, lifts Biscuit, climbs in
  const climbK = arc(s, beats.climb[0], beats.climb[0] + 22, 1830, g, TX1 + 300, bedY, 90);
  let kx = track(s, KX.f, KX.v);
  let ky = g;
  if (s >= beats.climb[0]) {
    kx = climbK.x;
    ky = climbK.y;
  }
  const nod = s > beats.nod && s < beats.nod + 18 ? Math.sin((s - beats.nod) * 0.7) * 10 : 0;
  let kaiPose: Pose = moving(POSES.stand, kx, speedOf(s, KX.f, KX.v), false);
  if (s > 280 && s < 418) kaiPose = { ...POSES.stand, tilt: -6 + nod };
  if (s >= 418 && s < 452) kaiPose = { ...POSES.stand, lean: -8, tilt: 10, lUA: -30, lFA: -20 };
  if (s >= 452 && s < beats.lift[0]) kaiPose = moving(POSES.stand, kx, speedOf(s, KX.f, KX.v), false);
  if (s >= beats.lift[0] && s < beats.climb[0]) kaiPose = P6.lift;
  if (s >= beats.climb[0]) kaiPose = s < beats.climb[0] + 22 ? lerpPose(P6.climbOver, P6.ride, climbK.t) : P6.ride;
  const kaiFlip = s >= beats.climb[0] + 22;
  // Mia
  const climbM = arc(s, beats.climb[0] + 14, beats.climb[1], 1720, g, TX1 + 110, bedY, 90);
  let mx = track(s, MX.f, MX.v);
  let my = g;
  if (s >= beats.climb[0] + 14) {
    mx = climbM.x;
    my = climbM.y;
  }
  const mia = keyed(s, [
    [200, "batDown"],
    [404, "batDown"],
    [418, "grab"],
    [452, "grab"],
    [470, "batDown"],
    [beats.climb[1], "miaRide"],
  ]);
  const miaPose = s < 404 ? moving(mia.pose, mx, speedOf(s, MX.f, MX.v), false) : mia.pose;
  // Biscuit: sniffs the tyre, then gets lifted into the bed
  const lift = arc(s, beats.lift[0], beats.lift[1], 1860, g, TX1 + 215, bedY, 110);
  const dx = s < beats.lift[0] ? track(s, DX.f, DX.v) : lift.x;
  const dy = s < beats.lift[0] ? g : lift.y;
  const dogFlip = s > 300 && s < 466;
  const dogIn = s >= beats.lift[1];
  // Wade walks round to the hood and leans there
  const wx = track(s, WX.f, WX.v);
  const wadePose = s < 300 ? moving(P6.rifleDown, wx, speedOf(s, WX.f, WX.v), false) : P6.lounge;
  const wadeFlip = s >= 300;
  const juneTurn = s > 232 && s < 312 ? 1 : 0;
  const idle = Math.sin(frame * 1.3) * 1.5 + impulse(frame, [toOut(beats.tailgate)], 4) * 6;
  const juneShot = s >= 232 && s < 300;
  const SHOTS: Shot[] = [
    { from: 0, to: 232, keys: [[200, 1950, 1200, 0.8], [232, 1980, 1210, 0.88]] },
    { from: 232, to: 300, keys: [[232, TX1 + 440, 1200, 2.5], [300, TX1 + 440, 1205, 2.8]] },
    { from: 300, to: 330, keys: [[300, 1790, 1200, 2.0], [330, 1790, 1205, 2.3]] },
    { from: 330, to: 352, keys: [[330, TX1 + 760, 1290, 1.4], [352, TX1 + 900, 1290, 1.7]] },
    { from: 352, to: 370, keys: [[352, 1790, 1200, 2.4], [370, 1790, 1205, 2.6]] },
    { from: 370, to: 410, keys: [[370, 2050, 1250, 1.0], [410, 2050, 1250, 1.1]] },
    { from: 410, to: 452, keys: [[410, 1735, 1200, 2.0], [452, 1740, 1205, 2.3]] },
    { from: 452, to: 600, keys: [[452, 1980, 1260, 1.2], [532, 2000, 1260, 1.35]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kai = (
    <StickFigure
      pose={kaiPose}
      x={kx}
      y={ky}
      scale={1}
      frame={frame}
      flip={kaiFlip}
      face={face(s >= 418 && s < 452 ? 0.6 : 0.3, 0, 0, s > 300 && s < 418 ? 0.7 : 0)}
    />
  );
  const miaFig = (
    <StickFigure
      pose={{ ...miaPose, tilt: miaPose.tilt + (s > 300 && s < 404 ? 6 : 0) }}
      x={mx}
      y={my}
      scale={0.92}
      frame={frame}
      hair="ponytail"
      face={face(0.9, s > 410 && s < 440 ? 0.25 : 0)}
      prop={(sk) => <Bat sk={sk} angle={mia.bat} />}
    />
  );
  const dog = <Dog x={dx} y={dy} scale={0.8} bark={s > 260 && s < 300 ? Math.abs(Math.sin(frame * 0.8)) * 0.3 : 0} walk={speedOf(s, DX.f, DX.v) > 0.5 ? frame / 8 : dogIn ? frame / 14 : 0} flip={dogFlip} />;
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3.4))}>
      <NightSky t={1} frame={frame} moonY={260} />
      <PharmacyFront frame={frame} cross={Math.sin(frame * 0.9) * Math.sin(frame * 0.31) > 0.35 ? 0.15 : 1}>
        <StickFigure pose={wadePose} x={wx} y={g} scale={1.05} frame={frame} flip={wadeFlip} face={face(0, 0, 0, 0.8)} prop={(sk) => <Wade sk={sk} rifle={20} />} />
        <Truck
          id="t1"
          x={TX1}
          y={g}
          frame={frame}
          bounce={idle}
          exhaust={0.6}
          driver={<June frame={frame} turn={juneTurn} smile={juneShot ? 1 : 0.4} />}
        >
          {dogIn ? dog : null}
          {s >= beats.climb[0] + 14 && climbM.t > 0.6 ? miaFig : null}
          {s >= beats.climb[0] && climbK.t > 0.6 ? kai : null}
        </Truck>
        <TruckLights x={TX1} y={g} headlights={1} brake={0} />
        {!dogIn ? dog : null}
        {!(s >= beats.climb[0] + 14 && climbM.t > 0.6) ? miaFig : null}
        {!(s >= beats.climb[0] && climbK.t > 0.6) ? kai : null}
      </PharmacyFront>
    </g>
  );
};

// ================= Scene 3: the night road =================
const Ride: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const g = ROAD.ground;
  const TX = 0;
  const bedY = g + TRUCK.bed;
  const travel = (s - beats.road) * 38;
  const bounce = Math.abs(Math.sin(frame * 0.9)) * 3 + Math.sin(frame * 0.23) * 2;
  const kx = TX + 255;
  const mx = TX + 100;
  const flinch = track(s, [646, 652, 672, 690], [0, 1, 1, 0]);
  const kai = poseAt<P6Pose>(s, [
    [beats.road, "ride"],
    [575, "ride"],
    [590, "rideUp"],
    [640, "rideUp"],
    [778, "ride"],
    [790, "ridePat"],
    [820, "ridePat"],
  ], P6);
  const kaiPose = lerpPose(kai, P6.rideFlinch, flinch);
  const pat = s > 790 && s < 826 ? Math.sin((s - 790) * 0.5) * 12 : 0;
  const mia = keyed(s, [
    [beats.road, "miaRide"],
    [690, "miaRide"],
    [706, "miaWatch"],
  ]);
  // the zombie on the shoulder lunges as the truck passes, and goes down
  const zx = 500 - (s - 652) * 38;
  const zPose = lerpPose(lerpPose(POSES.stand, P6.lunge, clamp01((s - 622) / 14)), P6.sprawl, clamp01((s - 652) / 10));
  // the stare in the mirror: road, then the bed, then away
  const eyes = track(s, [690, 700, 706, 744, 752], [1, 1, -1, -1, 0.6]);
  const SHOTS: Shot[] = [
    { from: 0, to: 580, keys: [[beats.road, 560, 1200, 0.85], [580, 520, 1200, 0.95]] },
    { from: 580, to: 640, keys: [[580, kx - 10, 1130, 2.1], [640, kx - 10, 1130, 2.4]] },
    { from: 640, to: 690, keys: [[640, 520, 1250, 1.0], [690, 480, 1250, 1.15]] },
    { from: 690, to: 722, keys: [[690, TX + TRUCK.mirror.x + 30, g + TRUCK.mirror.y - 8, 6.0], [722, TX + TRUCK.mirror.x + 30, g + TRUCK.mirror.y - 8, 6.6]] },
    { from: 722, to: 766, keys: [[722, mx + 20, 1130, 2.5], [766, mx + 20, 1130, 2.85]] },
    { from: 766, to: 900, keys: [[766, 230, 1250, 1.5], [832, 240, 1250, 1.75]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(652)], 4) * 18;
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3.2, { x: kick * Math.sin(frame * 3), y: kick * 0.5 + bounce }))}>
      <NightSky t={1} frame={frame} moonY={300} drift={frame * 2} />
      <Road
        frame={frame}
        travel={travel}
        front={
          s > 600 && s < 690 ? (
            <Zombie x={zx} y={g + 120} scale={1.05} pose={zPose} frame={frame} glow={1} flip />
          ) : null
        }
      >
        <Truck id="t2" x={TX} y={g} frame={frame} roll={-travel * 0.9} bounce={bounce} exhaust={0.9} mirrorEyes={eyes} driver={<June frame={frame} turn={0} smile={0} />}>
          <Dog x={TX + 215} y={bedY} scale={0.8} bark={Math.abs(Math.sin(frame * 0.3)) * 0.15} walk={frame / 9} />
          <StickFigure
            pose={{ ...mia.pose, tilt: mia.pose.tilt + Math.sin(frame * 0.7) * 1.5 }}
            x={mx}
            y={bedY}
            scale={0.92}
            frame={frame * 3}
            hair="ponytail"
            face={face(s > 700 ? 0.9 : 0.5)}
            prop={(sk) => <Bat sk={sk} angle={mia.bat} />}
          />
          <StickFigure
            pose={{ ...kaiPose, rFA: kaiPose.rFA + pat }}
            x={kx}
            y={bedY}
            scale={1}
            frame={frame}
            flip
            face={face(flinch > 0.3 ? 1 : 0.2, flinch > 0.3 ? 0.5 : 0, 0, s > 585 && s < 640 ? 1 : 0)}
          />
        </Truck>
        <TruckLights x={TX} y={g} headlights={1} brake={0} len={1500} />
      </Road>
    </g>
  );
};

// ================= Scene 4: the gas station =================
const GasStop: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const g = GAS.ground;
  const bedY = g + TRUCK.bed;
  const TX = s < beats.brake ? track(s, [beats.gas, beats.brake], [-700, 300]) : s < beats.depart[0] ? 300 : 300 + 0.45 * (s - beats.depart[0]) ** 2;
  const roll = -(TX / 60) * 57.3;
  const running = s >= beats.engine;
  const headlights = s < 868 ? 1 : running ? (s < beats.engine + 4 ? (Math.floor(frame / 2) % 2 ? 1 : 0.2) : 1) : 0;
  const brake = s > 840 && s < 872 ? 1 : 0;
  const bounce = s < beats.brake ? 0 : s < 870 ? Math.sin((s - beats.brake) * 0.6) * 6 * Math.exp(-(s - beats.brake) / 8) : running ? Math.abs(Math.sin(frame * 1.6)) * 3 : 0;
  // Kai and Mia hop out, walk to the store, go in; then burst out and chase
  const hopK = arc(s, beats.hop[0], beats.hop[0] + 18, TX + 300, bedY, 760, g, 70);
  const hopM = arc(s, beats.hop[0] + 6, beats.hop[1], TX + 110, bedY, 640, g, 70);
  const inBed = s < beats.hop[0];
  const KX = { f: [beats.walkStore[0], beats.enter, beats.burst, 1090, 1100, 1190], v: [760, 2160, 2160, 2330, 2340, 2900] };
  const MX = { f: [beats.walkStore[0] + 4, beats.enter + 2, beats.burst + 4, 1100, 1156, 1190], v: [640, 2110, 2110, 2280, 2600, 2610] };
  const kx = s < beats.hop[0] ? TX + 300 : s < beats.walkStore[0] ? hopK.x : track(s, KX.f, KX.v);
  const ky = s < beats.hop[0] ? bedY : s < beats.walkStore[0] ? hopK.y : g;
  const mx = s < beats.hop[0] + 6 ? TX + 110 : s < beats.walkStore[0] + 4 ? hopM.x : track(s, MX.f, MX.v);
  const my = s < beats.hop[0] + 6 ? bedY : s < beats.walkStore[0] + 4 ? hopM.y : g;
  const away = s >= beats.enter - 4 && s < beats.burst;
  const fade = s < beats.burst ? 1 - clamp01((s - (beats.enter - 6)) / 6) : clamp01((s - beats.burst) / 3);
  const kv = speedOf(s, KX.f, KX.v);
  let kaiPose: Pose = inBed ? P6.ride : s < beats.walkStore[0] ? P6.climbOver : moving(s < beats.burst ? POSES.stand : P6.bottles, kx, kv, false);
  if (s >= 1086 && s < 1100) kaiPose = P6.reach;
  if (s >= 1170) kaiPose = lerpPose(kaiPose, P6.slump, clamp01((s - 1170) / 12));
  const holding = s >= beats.burst && s < beats.drop;
  const mia = keyed(s, [
    [beats.gas, "miaRide"],
    [beats.hop[0], "batDown"],
    [beats.burst, "batDown"],
    [1150, "batDown"],
    [1158, "shout"],
  ]);
  const mv = speedOf(s, MX.f, MX.v);
  const miaPose = inBed || s < beats.walkStore[0] + 4 ? mia.pose : s >= 1156 ? mia.pose : moving(mia.pose, mx, mv, false);
  const batDropped = s >= 1162;
  // Wade: round the front, fuels up, hangs the nozzle back, slips into the cab
  const WX = { f: [858, 884, 985, 1000, 1022], v: [1060, 740, 740, 300, 1040] };
  const wx = track(s, WX.f, WX.v);
  const wv = speedOf(s, WX.f, WX.v);
  const wadeFlip = s > 858 && s < 1000;
  const wadePose = s >= 884 && s < 985 ? P6.nozzle : moving(P6.rifleDown, wx, wv, wadeFlip);
  const wadeOn = s > 856 && s < 1024 ? Math.min(clamp01((s - 856) / 4), 1 - clamp01((s - 1018) / 6)) : 0;
  const fueling = s >= 884 && s < 990;
  const dogFlip = s > 1098 || (s > beats.hop[0] && s < 960 ? false : false);
  const bark = s > beats.burst ? Math.abs(Math.sin(frame * 0.7)) * 0.9 : s > 960 && s < 985 ? 0.1 : 0;
  const tubes = [0, 1, 2, 3].map((i) => (i === 2 ? (Math.sin(frame * 0.8 + i) * Math.sin(frame * 0.27) > 0.3 ? 0.1 : 1) : 1));
  const inside = s > 966 && s < beats.burst ? 1 : 0;
  const insideX = track(s, [966, 1000, 1040], [1660, 1960, 1800]);
  const door = track(s, [beats.enter - 8, beats.enter, beats.enter + 10, beats.enter + 16], [0, 1, 1, 0]) + (s >= beats.burst - 2 ? track(s, [beats.burst - 2, beats.burst, 1070], [0, 1, 0.6]) : 0);
  const SHOTS: Shot[] = [
    { from: 0, to: 862, keys: [[beats.gas, 420, 1150, 0.75], [862, 460, 1160, 0.82]] },
    { from: 862, to: 884, keys: [[862, 760, 1220, 1.4], [884, 760, 1220, 1.6]] },
    { from: 884, to: 906, keys: [[884, GAS.pump + 20, g - 240, 3.0], [906, GAS.pump + 20, g - 240, 3.4]] },
    { from: 906, to: 960, keys: [[906, 1300, 1150, 0.62], [960, 1450, 1150, 0.66]] },
    { from: 960, to: 985, keys: [[960, 300 + 240, 1260, 2.6], [985, 300 + 240, 1260, 2.9]] },
    { from: 985, to: beats.engine, keys: [[985, 1150, 1150, 0.6], [beats.engine, 1200, 1150, 0.66]] },
    { from: beats.engine, to: beats.burst, keys: [[beats.engine, TX + 40, 1320, 2.2], [beats.burst, TX + 40, 1320, 2.5]] },
    { from: beats.burst, to: 1098, keys: [[beats.burst, 2160, 1200, 1.15], [1098, 2340, 1210, 1.05]] },
    { from: 1098, to: 1122, keys: [[1098, TX + 260, 1260, 2.0], [1122, TX + 260, 1260, 2.2]] },
    { from: 1122, to: 1150, keys: [[1122, 2450, 1200, 0.9], [1150, 2700, 1210, 1.0]] },
    { from: 1150, to: 1300, keys: [[1150, 2620, 1180, 2.2], [1190, 2630, 1180, 2.5]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(beats.brake), toOut(beats.engine), toOut(beats.burst)], 4) * 14;
  const kaiFig = (
    <StickFigure
      pose={kaiPose}
      x={kx}
      y={ky}
      scale={1}
      frame={frame}
      flip={inBed}
      face={face(s >= beats.engine ? 1 : 0.3, s >= beats.burst ? 0.6 : 0, s >= beats.burst ? 0.8 : 0)}
      prop={(sk) => (holding ? <Bottles x={sk.lHand.x} y={sk.lHand.y + 10} /> : null)}
    />
  );
  const miaFig = (
    <StickFigure
      pose={miaPose}
      x={mx}
      y={my}
      scale={0.92}
      frame={frame}
      hair="ponytail"
      face={face(s >= beats.engine ? 1 : 0.6, s >= 1150 ? 0.9 : 0)}
      prop={(sk) => (batDropped ? null : <Bat sk={sk} angle={mia.bat} />)}
    />
  );
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3.2, { x: kick * Math.sin(frame * 3), y: kick * 0.5 }))}>
      <NightSky t={1} frame={frame} moonY={240} />
      <GasStation
        frame={frame}
        tubes={tubes}
        sign={Math.sin(frame * 0.5) * Math.sin(frame * 0.13) > 0.5 ? 0.2 : 1}
        door={Math.min(1, door)}
        inside={inside}
        insideX={insideX}
        hose={fueling ? { x: TX + TRUCK.cap, y: g - 168 } : undefined}
      >
        {away ? null : <g opacity={fade}>{!inBed && s >= beats.walkStore[0] ? kaiFig : null}</g>}
        {away ? null : <g opacity={fade}>{!inBed && s >= beats.walkStore[0] + 4 ? miaFig : null}</g>}
        <Truck
          id="t3"
          x={TX}
          y={g}
          frame={frame}
          roll={roll}
          bounce={bounce}
          headlights={headlights}
          brake={brake}
          exhaust={s < 870 ? 0.8 : running ? 1.3 : 0}
          mirrorEyes={running ? -1 : 0}
          driver={<June frame={frame} turn={0} smile={running ? 1 : 0.3} />}
        >
          {/* their bags, left in the bed */}
          <rect x={TX + 40} y={bedY - 60} width={90} height={64} rx={16} fill="#3d5a6e" />
          <rect x={TX + 140} y={bedY - 52} width={76} height={56} rx={16} fill="#6e3d3d" />
          <Dog x={TX + 240} y={bedY} scale={0.8} bark={bark} flip={dogFlip} walk={s > beats.burst ? frame / 6 : 0} />
          {inBed ? miaFig : null}
          {inBed ? kaiFig : null}
        </Truck>
        <TruckLights x={TX} y={g} headlights={headlights} brake={brake || (running ? 0.4 : 0)} len={1400} />
        {!inBed && s < beats.walkStore[0] ? kaiFig : null}
        {!inBed && s < beats.walkStore[0] + 4 ? miaFig : null}
        {wadeOn > 0 ? (
          <g opacity={wadeOn}>
            <StickFigure pose={wadePose} x={wx} y={g} scale={1.05} frame={frame} flip={wadeFlip} face={face(0, 0, 0, 0.6)} prop={(sk) => <Wade sk={sk} rifle={20} />} />
          </g>
        ) : null}
        {/* dropped water bottles roll on the forecourt */}
        {s >= beats.drop ? (
          <g transform={`translate(${track(s, [beats.drop, beats.drop + 30], [2230, 2300])} ${g - 6}) rotate(${(s - beats.drop) * 14})`}>
            <Bottles x={0} y={10} />
          </g>
        ) : null}
        {batDropped ? (
          <g transform={`translate(${mx - 40} ${g - 10}) rotate(${track(s, [1162, 1172], [20, 88])})`}>
            <line x1={0} y1={0} x2={0} y2={150} stroke="#b0844e" strokeWidth={16} strokeLinecap="round" />
          </g>
        ) : null}
      </GasStation>
    </g>
  );
};

// ================= Scene 5: watching the tail lights go =================
const Behind: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const dist = track(s, [beats.behind, 1340], [0.3, 0.985]);
  const run = s < beats.stop;
  const kx = track(s, [beats.behind, beats.stop], [150, 290]);
  const kaiPose = run ? walkPose(kx / 300, GAITS.run) : lerpPose(P6.slump, { ...P6.slump, chest: 1.04 }, Math.abs(Math.sin(frame * 0.25)));
  const mx = track(s, [beats.behind, 1250, 1270], [1300, 960, 930]);
  const miaPose = s < 1250 ? walkPose(-mx / 300, GAITS.run) : { ...P6.slump, lean: 16 + Math.sin(frame * 0.9) * 5, tilt: 30 + Math.sin(frame * 1.3) * 7, lUA: 150 + Math.sin(frame * 0.8) * 10, lFA: 200 };
  const SHOTS: Shot[] = [
    { from: 0, to: 1222, keys: [[beats.behind, 540, 960, 1.0], [1222, 540, 1000, 1.12]] },
    { from: 1222, to: 1252, keys: [[1222, 540, 860, 1.6], [1252, 540, 850, 2.1]] },
    { from: 1252, to: 1290, keys: [[1252, kx + 40, 1300, 1.9], [1290, kx + 40, 1290, 2.2]] },
    { from: 1290, to: 1320, keys: [[1290, mx - 40, 1330, 2.0], [1320, mx - 40, 1320, 2.3]] },
    { from: 1320, to: 2000, keys: [[1320, 540, 960, 1.05], [1370, 460, 1150, 1.5]] },
  ];
  const cam = shotCamera(s, SHOTS);
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3.4))}>
      <RoadBehind frame={frame} dist={dist} bark={Math.abs(Math.sin(frame * 0.7)) * (1 - dist)}>
        <StickFigure pose={kaiPose} x={kx} y={2060} scale={2.3} frame={frame} face={face(1, run ? 0.6 : 0.2, 0.6)} />
        <StickFigure pose={miaPose} x={mx} y={2080} scale={2.1} frame={frame} flip hair="ponytail" face={face(1, s < 1250 ? 0.8 : 0.1)} />
        {/* red rim light from the tail lights */}
        <ellipse cx={540} cy={1500} rx={700} ry={500} fill="#ff2a1e" opacity={0.08 * (1 - dist)} filter="url(#soft)" />
      </RoadBehind>
    </g>
  );
};

export const Part06: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);
  const cuts = [beats.out, beats.road, beats.gas, beats.behind];
  const scene = cuts.filter((c) => s >= c).length;
  const cut = scene > 0 ? cuts[scene - 1] : 0;
  const dip = cut > 0 ? 1 - clamp01((s - cut) / 4) : 0;
  const punch = impulse(frame, EMPH, 5);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        <RoadDefs />
        <g transform={`translate(540 960) scale(${1 + 0.07 * punch}) translate(-540 -960)`}>
        {scene === 0 ? (
          <Doorway s={s} frame={frame} />
        ) : scene === 1 ? (
          <Curb s={s} frame={frame} />
        ) : scene === 2 ? (
          <Ride s={s} frame={frame} />
        ) : scene === 3 ? (
          <GasStop s={s} frame={frame} />
        ) : (
          <Behind s={s} frame={frame} />
        )}
        </g>
        <rect width={1080} height={1920} fill="url(#vignette6)" />
        <rect width={1080} height={1920} fill="#000" opacity={dip} />
        <defs>
          <radialGradient id="vignette6" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <SeriesBadge frame={frame} part={6} title="STRANGERS" until={Math.round(toOut(70))} />
      <Captions
        frame={frame}
        chunks={timeline.captions}
        speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>}
      />
      <PartCard frame={frame} from={Math.round(toOut(beats.card))} part={6} embers />
    </AbsoluteFill>
  );
};
