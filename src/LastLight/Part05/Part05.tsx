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
  sneakPose,
  track,
} from "../kit";
import { Captions, PartCard, SeriesBadge, SPEAKERS } from "../Overlays";
import {
  BatteryBox,
  Bell,
  Darkness,
  Flashlight,
  FRONT,
  Light,
  Moth,
  PharmacyFront,
  RoadMap,
  Store,
  STORE,
} from "../pharmacy";
import { Dog, NightSky, Walkie } from "../sets";
import { Defs, rand } from "../world";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toStory, toOut } = makeWarp(timeline);

// Poses (side view facing +x)
const P5 = {
  ...KAI,
  ...ACTION,
  holdWalkie: {
    ...POSES.stand,
    tilt: 10,
    duck: 0.2,
    lUA: 40,
    lFA: 160,
    rUA: 14,
    rFA: 24,
  },
  smack: {
    ...POSES.stand,
    tilt: 10,
    duck: 0.2,
    lUA: 40,
    lFA: 160,
    rUA: 150,
    rFA: 175,
  },
  torch: { ...POSES.stand, lUA: -10, lFA: 14, rUA: 80, rFA: 88 },
  torchLow: { ...POSES.stand, lUA: -10, lFA: 14, rUA: 30, rFA: 60 },
  torchUp: { ...POSES.stand, tilt: -12, lUA: -10, lFA: 14, rUA: 118, rFA: 126 },
  startle: {
    ...POSES.stand,
    lean: -12,
    tilt: -10,
    duck: 0.4,
    lUA: 40,
    lFA: 150,
    rUA: 80,
    rFA: 88,
    lTh: -22,
    lSh: -8,
    rTh: 18,
    rSh: 10,
  },
  sheepish: {
    ...POSES.stand,
    tilt: 16,
    duck: 0.3,
    lUA: 30,
    lFA: 150,
    rUA: 40,
    rFA: 64,
  },
  bellGrab: { ...POSES.stand, tilt: -16, lUA: 168, lFA: 176, rUA: 30, rFA: 60 },
  kneel: { ...ACTION.crouch, lean: 34, lUA: 40, lFA: 30, rUA: 60, rFA: 64 },
  kneelLit: {
    ...ACTION.crouch,
    lean: 10,
    tilt: 6,
    lUA: 40,
    lFA: 60,
    rUA: 46,
    rFA: 50,
  },
  // Mia with her bat (the bat angle is separate, see BAT)
  batReady: {
    ...POSES.stand,
    lean: 4,
    tilt: -4,
    duck: 0.2,
    lUA: -105,
    lFA: 55,
    rUA: -112,
    rFA: 62,
  },
  batSwing: {
    ...POSES.stand,
    lean: 16,
    tilt: 4,
    duck: 0.2,
    lUA: 75,
    lFA: 82,
    rUA: 82,
    rFA: 88,
    lTh: -24,
    lSh: -20,
    rTh: 26,
    rSh: 6,
  },
  batDown: { ...POSES.stand, lUA: 12, lFA: 24, rUA: 14, rFA: 26 },
  pantBat: {
    ...POSES.stand,
    lean: 18,
    tilt: 10,
    duck: 0.4,
    lUA: 30,
    lFA: 20,
    rUA: 26,
    rFA: 30,
    lTh: 18,
    lSh: -10,
    rTh: 24,
    rSh: -6,
  },
  frozen: {
    ...POSES.stand,
    tilt: -6,
    duck: 0.5,
    lUA: 30,
    lFA: 120,
    rUA: -112,
    rFA: 62,
  },
  walkieCrouch: {
    ...ACTION.crouch,
    lean: 8,
    tilt: -4,
    lUA: 50,
    lFA: 158,
    rUA: 30,
    rFA: 40,
  },
  walkieUp: { ...POSES.stand, tilt: 6, lUA: 54, lFA: 160, rUA: 12, rFA: 24 },
  // the stranger in the doorway
  rifle: { ...POSES.stand, lean: 4, lUA: 60, lFA: 100, rUA: 80, rFA: 90 },
  rifleTorch: { ...POSES.stand, lean: 2, lUA: 60, lFA: 100, rUA: 86, rFA: 92 },
} satisfies Record<string, Pose>;
type P5Pose = keyof typeof P5;

// Where Mia's bat points (degrees, rig convention) for each of her poses
const BAT: Partial<Record<P5Pose, number>> = {
  batReady: -150,
  batSwing: 95,
  batDown: 8,
  pantBat: 30,
  frozen: -150,
  walkieCrouch: 40,
  walkieUp: 8,
  crouch: 40,
  stand: 10,
};

const face = (worry: number, mouth = 0, sweat = 0) => ({
  worry,
  smile: 0,
  mouth,
  sweat,
});
const speedOf = (s: number, f: number[], v: number[]) =>
  Math.abs(track(s + 1, f, v) - track(s - 1, f, v)) / 2;
const moving = (base: Pose, x: number, speed: number, flip: boolean) =>
  lerpPose(
    base,
    walkPose(
      (flip ? -x : x) / (speed > 9 ? 300 : 190),
      speed > 9 ? GAITS.run : GAITS.walk,
      base,
    ),
    clamp01(speed / 3),
  );
// Keep the arms of `arms` while the legs walk
const withArms = (legs: Pose, arms: Pose): Pose => ({
  ...legs,
  lUA: arms.lUA,
  lFA: arms.lFA,
  rUA: arms.rUA,
  rFA: arms.rFA,
});

// Interpolated pose plus the bat angle that goes with it
const keyed = (s: number, keys: [number, P5Pose][]) => {
  const pose = poseAt<P5Pose>(s, keys, P5);
  let i = keys.findIndex(([f]) => f > s);
  if (i === -1) i = keys.length;
  const [f0, k0] = keys[Math.max(0, i - 1)];
  const [f1, k1] = keys[Math.min(keys.length - 1, i)];
  const t = f1 === f0 ? 1 : clamp01((s - f0) / (f1 - f0));
  const bat =
    (BAT[k0] ?? 10) +
    ((BAT[k1] ?? 10) - (BAT[k0] ?? 10)) * (t * t * (3 - 2 * t));
  return { pose, bat };
};

const Bat: React.FC<{ sk: Skeleton; angle: number }> = ({ sk, angle }) => {
  const r = (angle * Math.PI) / 180;
  const h = sk.rHand;
  const tip = { x: h.x + Math.sin(r) * 150, y: h.y + Math.cos(r) * 150 };
  return (
    <g>
      <line
        x1={h.x - Math.sin(r) * 14}
        y1={h.y - Math.cos(r) * 14}
        x2={tip.x}
        y2={tip.y}
        stroke="#b0844e"
        strokeWidth={13}
        strokeLinecap="round"
      />
      <line
        x1={h.x + Math.sin(r) * 60}
        y1={h.y + Math.cos(r) * 60}
        x2={tip.x}
        y2={tip.y}
        stroke="#b0844e"
        strokeWidth={20}
        strokeLinecap="round"
      />
    </g>
  );
};

// A point of the figure's skeleton in world coordinates
const worldOf = (
  sk: Skeleton,
  p: keyof Skeleton,
  x: number,
  y: number,
  scale: number,
  flip: boolean,
) => {
  const q = sk[p] as { x: number; y: number };
  return { x: x + (flip ? -q.x : q.x) * scale, y: y + q.y * scale };
};
// A torch aimed `aim` degrees below the figure's facing direction, held in the right hand
const torchOf = (
  pose: Pose,
  x: number,
  y: number,
  flip: boolean,
  aim: number,
  scale = 1,
) => {
  const hand = worldOf(skeleton(pose), "rHand", x, y, scale, flip);
  const dir = flip ? 180 - aim : aim;
  const a = (dir * Math.PI) / 180;
  return {
    hand,
    dir,
    tip: {
      x: hand.x + Math.cos(a) * 30 * scale,
      y: hand.y + Math.sin(a) * 30 * scale,
    },
  };
};

const Glitch: React.FC<{ s: number; frame: number; at: number[][] }> = ({
  s,
  frame,
  at,
}) => {
  if (!at.some(([a, b]) => s >= a && s < b)) return null;
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", pointerEvents: "none" }}
    >
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={0}
          y={rand(frame * 7 + i) * 1920}
          width={1080}
          height={4 + rand(frame * 3 + i) * 40}
          fill={i % 3 ? "#ffffff" : "#7fe3ff"}
          opacity={0.12 + rand(frame + i * 11) * 0.25}
        />
      ))}
    </svg>
  );
};

// ================= Scene 1: outside, the dead radio, the walk to the pharmacy =================
const Outside: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const G = FRONT.ground;
  const KX = { f: [0, 90, 190], v: [600, 600, 1430] };
  const MX = { f: [0, 96, 196], v: [430, 430, 1270] };
  const DX = { f: [0, 92, 186], v: [780, 780, 1620] };
  const kx = track(s, KX.f, KX.v);
  const mx = track(s, MX.f, MX.v);
  const dx = track(s, DX.f, DX.v);
  // the smack: the free hand swings up and comes down on the radio
  const smackT = track(s, [62, 70, 74, 84], [0, 1, 0.2, 0]);
  const kaiBase =
    s < 90 ? lerpPose(P5.holdWalkie, P5.smack, smackT) : P5.holdWalkie;
  const kaiPose =
    s < 90 ? kaiBase : moving(kaiBase, kx, speedOf(s, KX.f, KX.v), false);
  const shake =
    s > beats.shake[0] && s < beats.shake[1] ? Math.sin(frame * 2.2) * 9 : 0;
  // the screen fades, then a last blink after the smack
  const live =
    s < beats.deadScreen
      ? Math.floor(frame / 3) % 4 === 0
        ? 0
        : 1
      : s > 76 && s < 81
        ? 1
        : 0;
  const mia = keyed(s, [
    [0, "batDown"],
    [100, "batDown"],
    [160, "batReady"],
  ]);
  const miaPose =
    s < 96 ? mia.pose : moving(mia.pose, mx, speedOf(s, MX.f, MX.v), false);
  const cross =
    Math.sin(frame * 0.9) * Math.sin(frame * 0.31) > 0.35 ? 0.15 : 1;
  const hand = worldOf(skeleton(kaiPose), "lHand", kx, G, 1, false);
  const SHOTS: Shot[] = [
    {
      from: 0,
      to: 40,
      keys: [
        [0, hand.x, hand.y - 20, 3.6],
        [40, hand.x, hand.y - 20, 3.3],
      ],
    },
    {
      from: 40,
      to: 74,
      keys: [
        [40, kx + 10, hand.y - 30, 2.4],
        [74, kx + 10, hand.y - 30, 2.6],
      ],
    },
    {
      from: 74,
      to: 100,
      keys: [
        [74, 600, 1230, 1.6],
        [100, 640, 1240, 1.5],
      ],
    },
    {
      from: 100,
      to: 146,
      keys: [
        [100, 1100, 1000, 0.6],
        [146, 1250, 1060, 0.7],
      ],
    },
    { from: 146, to: 178, keys: [[s, kx + 60, 1260, 1.25]] },
    {
      from: 178,
      to: 400,
      keys: [
        [178, FRONT.doorX + 80, 1230, 1.8],
        [200, FRONT.doorX + 90, 1220, 2.0],
      ],
    },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(beats.smack)], 4) * 14;
  return (
    <g
      transform={cameraTransform(
        cam,
        handheld(frame, 1.5, { x: kick * Math.sin(frame * 3), y: kick * 0.5 }),
      )}
    >
      <NightSky t={1} frame={frame} moonY={260} />
      <PharmacyFront frame={frame} cross={cross}>
        <Dog
          x={dx}
          y={G}
          scale={0.8}
          bark={0}
          walk={speedOf(s, DX.f, DX.v) > 0.5 ? frame / 8 : 0}
        />
        <StickFigure
          pose={miaPose}
          x={mx}
          y={G}
          scale={0.92}
          frame={frame}
          hair="ponytail"
          face={face(0.7)}
          prop={(sk) => <Bat sk={sk} angle={mia.bat} />}
        />
        <StickFigure
          pose={kaiPose}
          x={kx}
          y={G}
          scale={1}
          frame={frame}
          face={face(s < 90 ? 0.9 : 0.6, s > 74 && s < 90 ? 0.4 : 0)}
          prop={(sk) => (
            <Walkie
              x={sk.lHand.x + shake}
              y={sk.lHand.y - 6}
              live={live}
              frame={frame}
              angle={-8 + shake}
            />
          )}
        />
      </PharmacyFront>
    </g>
  );
};

// ================= Scene 2: inside the pharmacy =================
const G = STORE.floor;
const KX = {
  f: [200, 232, 290, 410, 600, 640, 760, 800, 830, 842],
  v: [2420, 2170, 2170, 700, 700, 1250, 1250, 1350, 1350, 1560],
};
const MX = {
  f: [210, 252, 292, 412, 476, 486, 600, 645, 836, 846],
  v: [2440, 2060, 2060, 900, 900, 970, 970, 1880, 1880, 1760],
};
const DX = {
  f: [200, 240, 290, 410, 600, 700, 800, 830, 846],
  v: [2460, 2000, 2000, 1000, 1000, 1660, 1660, 1820, 2030],
};

const kaiInside = (s: number, frame: number) => {
  const kx = track(s, KX.f, KX.v);
  const flip = s < 452;
  const v = speedOf(s, KX.f, KX.v);
  let pose: Pose;
  let aim = 10;
  if (s < 232)
    pose = lerpPose(
      moving(P5.torchLow, kx, v, true),
      P5.bellGrab,
      track(s, [210, 216, 228, 234], [0, 1, 1, 0]),
    );
  else if (s < 268) pose = P5.torchLow;
  else if (s < 290)
    pose = lerpPose(P5.torchLow, P5.torch, clamp01((s - 266) / 4));
  else if (s < 410) {
    pose = withArms(sneakPose((2170 - kx) / 160), P5.torch);
    aim = 10 + Math.sin((s - 290) * 0.06) * 26;
  } else if (s < 446) {
    pose = { ...P5.torch, lean: Math.sin(frame * 0.3) * 2 };
    aim = 14;
  } else if (s < 458) {
    pose = P5.startle;
    aim = track(s, [446, 458], [14, -24]);
  } else if (s < 476) {
    pose = P5.startle;
    aim = -24 + Math.sin(frame * 1.7) * 2;
  } else if (s < 512) {
    pose = lerpPose(P5.startle, P5.torch, clamp01((s - 476) / 14));
    aim = track(s, [476, 512], [-24, 30]);
  } else if (s < 600) {
    pose =
      s > 568
        ? lerpPose(P5.torch, P5.sheepish, clamp01((s - 568) / 8))
        : P5.torch;
    aim = 30;
  } else if (s < 640) {
    pose = moving(P5.torch, kx, v, false);
    aim = 18;
  } else if (s < 760) {
    // he searches the hooks, then his shoulders drop
    const sigh = clamp01((s - 712) / 14);
    pose = lerpPose(
      P5.torchUp,
      { ...P5.torchLow, tilt: 22, duck: 0.5 },
      sigh * 0.7,
    );
    aim = -36 + Math.sin((s - 640) * 0.09) * 12 + sigh * 40;
  } else if (s < 830) {
    pose =
      s < 800
        ? lerpPose(P5.torchUp, P5.torch, clamp01((s - 760) / 10))
        : moving(P5.torch, kx, v, false);
    aim = 34;
  } else if (s < 960) {
    pose =
      s < 884
        ? lerpPose(P5.torch, P5.kneel, clamp01((s - 842) / 8))
        : lerpPose(P5.kneel, P5.kneelLit, clamp01((s - 884) / 12));
    aim = 24;
  } else if (s < 1250) {
    pose =
      s < 1140
        ? P5.kneelLit
        : lerpPose(P5.kneelLit, P5.torchLow, clamp01((s - 1150) / 16));
    aim = 50;
  } else if (s < 1272) {
    pose = P5.startle;
    aim = 50;
  } else {
    pose = lerpPose(P5.startle, P5.torch, clamp01((s - 1272) / 14));
    aim = track(s, [1272, 1290], [50, -3]);
  }
  // loading the batteries: the hands go to the box, then to the radio
  if (s >= 846 && s < 884) {
    const r = Math.sin((s - 846) * 0.5);
    pose = { ...pose, lUA: 50 + r * 20, lFA: 30 + r * 40 };
  }
  return { kx, flip, pose, aim };
};

const miaInside = (s: number, frame: number) => {
  const mx = track(s, MX.f, MX.v);
  const v = speedOf(s, MX.f, MX.v);
  const flip = s < 416 || (s >= 640 && s < 1272);
  const m = keyed(s, [
    [210, "batReady"],
    [410, "batReady"],
    [420, "frozen"],
    [470, "frozen"],
    [480, "batSwing"],
    [492, "batSwing"],
    [512, "pantBat"],
    [600, "pantBat"],
    [620, "batDown"],
    [836, "batDown"],
    [848, "walkieCrouch"],
    [1150, "walkieCrouch"],
    [1170, "walkieUp"],
    [1215, "walkieUp"],
    [1226, "batReady"],
  ]);
  const walking = v > 0.5;
  const pose = walking
    ? withArms(
        s < 412 ? sneakPose((2060 - mx) / 150) : moving(m.pose, mx, v, flip),
        m.pose,
      )
    : m.pose;
  return {
    mx,
    flip,
    pose: {
      ...pose,
      lean: pose.lean + (s > 512 && s < 600 ? Math.sin(frame * 0.5) * 4 : 0),
      // trembling while she stares at the thing behind Kai
      tilt: pose.tilt + (s > 416 && s < 476 ? Math.sin(frame * 2.1) * 3 : 0),
      lUA: pose.lUA + (s > 416 && s < 476 ? Math.sin(frame * 1.7) * 6 : 0),
    },
    bat: m.bat,
  };
};

const Inside: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const kai = kaiInside(s, frame);
  const mia = miaInside(s, frame);
  const dx = track(s, DX.f, DX.v);
  const dv = speedOf(s, DX.f, DX.v);
  // Biscuit faces left except while trotting to the counter and walking off with nothing to do
  const dogFlip = !(s > 600 && s < 700) && !(s > 830 && s < 1100);
  const sniff =
    s > beats.sniff[0] && s < beats.sniff[1]
      ? Math.abs(Math.sin(frame * 0.8)) * 0.3
      : 0;
  const growl =
    s > beats.doorOpen[0] ? 0.35 + Math.abs(Math.sin(frame * 0.6)) * 0.3 : 0;
  const torchOn =
    s >= beats.torchOn
      ? s < beats.torchOn + 6
        ? Math.floor(frame / 2) % 2
          ? 1
          : 0.2
        : 1
      : 0;
  const torch = torchOf(kai.pose, kai.kx, G, kai.flip, kai.aim);
  const door =
    track(s, [200, 210, 236, 248], [0, 1, 1, 0]) +
    track(s, [beats.doorOpen[0], beats.doorOpen[1]], [0, 0.85]);
  const bellSwing =
    (s > 200 && s < 250
      ? Math.sin(frame * 1.4) * 26 * Math.exp(-Math.max(0, s - 214) / 6)
      : 0) +
    (s > beats.bellRing
      ? Math.sin(frame * 1.4) * 30 * Math.exp(-(s - beats.bellRing) / 14)
      : 0);
  const fall = clamp01((s - beats.fold[0]) / (beats.fold[1] - beats.fold[0]));
  const standeeFall = fall * fall;
  const wobble = s > 486 && s < 490 ? -6 : 0;
  const boxX =
    s < beats.pull[0] ? STORE.counter.x + 120 : s < 830 ? dx - 110 : 1650;
  const live = s >= beats.live ? 1 : 0;
  const miaSk = skeleton(mia.pose);
  const walkie = worldOf(miaSk, "lHand", mia.mx, G, 0.92, mia.flip);
  // the stranger in the doorway
  const strangerIn = clamp01((s - beats.stranger[0]) / 16);
  const strangerPose = s < beats.blind - 16 ? P5.rifle : P5.rifleTorch;
  const strangerX = track(
    s,
    [beats.stranger[0], beats.stranger[1]],
    [2470, 2380],
  );
  const strangerTorch =
    s > beats.blind - 14
      ? s < beats.blind - 10
        ? Math.floor(frame / 2) % 2
          ? 1
          : 0.3
        : 1
      : 0;
  const sTorch = torchOf(strangerPose, strangerX, G, true, 2, 1.05);
  const lights: Light[] = [
    {
      kind: "glow",
      x: STORE.door.x + STORE.door.w / 2,
      y: 1180,
      r: 150,
      power: 0.35,
    },
    {
      kind: "glow",
      x: STORE.door.x + STORE.door.w / 2,
      y: 1240,
      r: 420 * Math.min(1, door),
      power: 0.9 * Math.min(1, door),
    },
  ];
  // spill from the torch keeps both faces readable
  if (torchOn > 0)
    for (const c of [
      { x: kai.kx, y: G - 280 },
      { x: mia.mx, y: G - 260 },
    ])
      // (smaller on Mia while the standee is still a secret)
      lights.push({
        kind: "glow",
        ...c,
        r: c.x === mia.mx && s < 456 ? 95 : 170,
        power: 0.4 * torchOn,
      });
  // the pharmacy cross outside flickers through the door glass
  lights.push({
    kind: "glow",
    x: STORE.door.x + STORE.door.w / 2,
    y: 1150,
    r: 260,
    power: Math.sin(frame * 0.9) * Math.sin(frame * 0.31) > 0.35 ? 0.15 : 0.55,
  });
  if (torchOn > 0)
    lights.push({
      kind: "cone",
      x: torch.tip.x,
      y: torch.tip.y,
      dir: torch.dir,
      power: torchOn * (s > beats.live ? 0.7 : 1),
    });
  if (live)
    lights.push({
      kind: "glow",
      x: walkie.x,
      y: walkie.y - 20,
      r: 300 + Math.sin(frame * 0.9) * 20,
      power: 0.85,
    });
  if (strangerTorch > 0)
    lights.push({
      kind: "cone",
      x: sTorch.tip.x,
      y: sTorch.tip.y,
      dir: sTorch.dir,
      power: strangerTorch,
      spread: 18,
    });
  const beamMid = {
    x: torch.tip.x + Math.cos((torch.dir * Math.PI) / 180) * 380,
    y: torch.tip.y + Math.sin((torch.dir * Math.PI) / 180) * 380,
  };

  const kx = kai.kx;
  const mx = mia.mx;
  const SHOTS: Shot[] = [
    {
      from: 0,
      to: 232,
      keys: [
        [200, 2290, 1180, 1.5],
        [232, 2240, 1170, 1.65],
      ],
    },
    {
      from: 232,
      to: 268,
      keys: [
        [232, 1900, 1150, 0.9],
        [268, 2150, 1260, 1.45],
      ],
    },
    {
      from: 268,
      to: 290,
      keys: [[s, torch.hand.x - 60, torch.hand.y - 60, 2.4]],
    },
    { from: 290, to: 340, keys: [[s, kx - 160, 1250, 1.25]] },
    {
      from: 340,
      to: 380,
      keys: [
        [340, beamMid.x, 1150, 1.9],
        [380, beamMid.x - 40, 1150, 2.0],
      ],
    },
    { from: 380, to: 420, keys: [[s, (kx + mx) / 2, 1240, 1.4]] },
    {
      from: 420,
      to: 446,
      keys: [
        [420, mx, 1180, 3.0],
        [446, mx, 1190, 3.8],
      ],
    },
    {
      from: 446,
      to: 458,
      keys: [
        [446, kx, 1220, 1.7],
        [458, STORE.standee - 40, 1180, 1.9],
      ],
    },
    {
      from: 458,
      to: 476,
      keys: [
        [458, STORE.standee, 1140, 3.2],
        [476, STORE.standee, 1145, 3.6],
      ],
    },
    {
      from: 476,
      to: 512,
      keys: [
        [476, 960, 1260, 1.5],
        [512, 980, 1270, 1.6],
      ],
    },
    {
      from: 512,
      to: 562,
      keys: [
        [512, (kx + mx) / 2, 1250, 1.6],
        [562, (kx + mx) / 2 + 40, 1240, 2.05],
      ],
    },
    {
      from: 562,
      to: 600,
      keys: [
        [562, kx, 1180, 3.0],
        [600, kx, 1190, 3.7],
      ],
    },
    {
      from: 600,
      to: 640,
      keys: [
        [600, 1100, 1150, 0.9],
        [640, 1350, 1150, 0.95],
      ],
    },
    {
      from: 640,
      to: 700,
      keys: [
        [640, STORE.rack.x + 180, 1010, 1.9],
        [700, STORE.rack.x + 240, 1000, 2.1],
      ],
    },
    {
      from: 700,
      to: 760,
      keys: [
        [700, 1400, 1180, 1.3],
        [760, 1360, 1210, 1.75],
      ],
    },
    {
      from: 760,
      to: 800,
      keys: [
        [760, 1560, 1410, 2.4],
        [800, 1570, 1410, 2.6],
      ],
    },
    {
      from: 800,
      to: 830,
      keys: [
        [800, 1660, 1340, 1.6],
        [830, 1700, 1340, 1.65],
      ],
    },
    {
      from: 830,
      to: 884,
      keys: [
        [830, 1640, 1360, 2.3],
        [884, 1660, 1350, 3.0],
      ],
    },
    {
      from: 884,
      to: 960,
      keys: [
        [884, walkie.x - 40, walkie.y - 20, 2.8],
        [960, walkie.x - 40, walkie.y - 30, 3.2],
      ],
    },
    {
      from: 1150,
      to: 1215,
      keys: [
        [1150, 1660, 1300, 1.5],
        [1215, 1660, 1290, 1.65],
      ],
    },
    {
      from: 1215,
      to: beats.bellRing,
      keys: [
        [1215, mx, 1200, 2.6],
        [beats.bellRing, mx, 1205, 2.8],
      ],
    },
    {
      from: beats.bellRing,
      to: beats.lookDoor[0],
      keys: [
        [beats.bellRing, STORE.bell.x, STORE.bell.y + 30, 3.6],
        [beats.lookDoor[0], STORE.bell.x, STORE.bell.y + 30, 3.9],
      ],
    },
    {
      from: beats.lookDoor[0],
      to: beats.doorOpen[0],
      keys: [
        [beats.lookDoor[0], 1680, 1230, 1.7],
        [beats.doorOpen[0], 1700, 1230, 1.8],
      ],
    },
    {
      from: beats.doorOpen[0],
      to: beats.blind - 14,
      keys: [
        [beats.doorOpen[0], 1950, 1180, 1.05],
        [beats.blind - 14, 2050, 1180, 1.2],
      ],
    },
    {
      from: beats.blind - 14,
      to: 3000,
      keys: [
        [beats.blind - 14, 2330, 1200, 1.9],
        [beats.card, 2330, 1200, 2.4],
      ],
    },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick =
    impulse(frame, [toOut(456), toOut(488), toOut(beats.bellRing)], 4) * 14;
  const blind = clamp01((s - (beats.blind - 4)) / 10);
  return (
    <g>
      <g
        transform={cameraTransform(
          cam,
          handheld(frame, 1.5, {
            x: kick * Math.sin(frame * 3),
            y: kick * 0.5,
          }),
        )}
      >
        <Store
          frame={frame}
          door={Math.min(1, door)}
          standeeFall={standeeFall}
          standeeWobble={wobble}
          hookSwing={s > 640 && s < 760 ? 6 : 2}
          boxOut={1}
          front={
            <g>
              {s >= beats.pull[0] - 40 ? (
                <BatteryBox
                  x={boxX}
                  y={G}
                  open={track(s, [842, 856], [0, 1])}
                />
              ) : null}
              <Dog
                x={dx}
                y={G}
                scale={0.8}
                bark={sniff + growl}
                walk={dv > 0.5 ? frame / 8 : 0}
                flip={dogFlip}
              />
              {strangerIn > 0 ? (
                <g opacity={strangerIn}>
                  <StickFigure
                    pose={strangerPose}
                    x={strangerX}
                    y={G}
                    scale={1.05}
                    frame={frame}
                    color="#040406"
                    flip
                    face={face(0)}
                    prop={(sk) => (
                      <g>
                        <line
                          x1={sk.lHand.x - 40}
                          y1={sk.lHand.y + 20}
                          x2={sk.lHand.x + 120}
                          y2={sk.lHand.y - 16}
                          stroke="#040406"
                          strokeWidth={14}
                          strokeLinecap="round"
                        />
                        <rect
                          x={sk.head.x - 46}
                          y={sk.head.y - 34}
                          width={92}
                          height={10}
                          fill="#040406"
                        />
                        <rect
                          x={sk.head.x - 28}
                          y={sk.head.y - 62}
                          width={56}
                          height={30}
                          rx={6}
                          fill="#040406"
                        />
                      </g>
                    )}
                  />
                  {strangerTorch > 0 ? (
                    <Flashlight
                      x={sTorch.hand.x}
                      y={sTorch.hand.y}
                      dir={sTorch.dir}
                      on={strangerTorch}
                    />
                  ) : null}
                </g>
              ) : null}
              <StickFigure
                pose={mia.pose}
                x={mx}
                y={G}
                scale={0.92}
                frame={frame}
                flip={mia.flip}
                hair="ponytail"
                face={face(
                  s > 412 && s < 476 ? 1 : 0.6,
                  s > 420 && s < 446 ? 0.3 : 0,
                )}
                prop={(sk) => (
                  <g>
                    {s > 836 ? (
                      <Walkie
                        x={sk.lHand.x}
                        y={sk.lHand.y - 6}
                        live={live}
                        frame={frame}
                        angle={-10}
                      />
                    ) : null}
                    {s < 836 || s > 1215 ? (
                      <Bat sk={sk} angle={mia.bat} />
                    ) : null}
                  </g>
                )}
              />
              <StickFigure
                pose={kai.pose}
                x={kx}
                y={G}
                scale={1}
                frame={frame}
                flip={kai.flip}
                face={face(
                  s > 446 && s < 512 ? 1 : 0.7,
                  s > 452 && s < 476 ? 0.6 : 0,
                  s > 568 && s < 600 ? 1 : 0,
                )}
              />
              {torchOn > 0 || s > 232 ? (
                <Flashlight
                  x={torch.hand.x}
                  y={torch.hand.y}
                  dir={torch.dir}
                  on={torchOn}
                />
              ) : null}
            </g>
          }
        />
        <Darkness id="p5dark" lights={lights} />
        <Bell swing={bellSwing} />
        {torchOn > 0 && s < beats.live ? (
          <Moth x={beamMid.x} y={beamMid.y} frame={frame} />
        ) : null}
      </g>
      <rect width={1080} height={1920} fill="#fffbe8" opacity={blind} />
    </g>
  );
};

// ================= Scene 3: the road map =================
const ROUTE = [
  [380, 1500],
  [420, 1180],
  [520, 880],
  [700, 540],
  [760, 380],
];
const MapScene: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const route = clamp01(
    (s - beats.route[0]) / (beats.route[1] - beats.route[0]),
  );
  const seg = route * (ROUTE.length - 1);
  const i = Math.min(ROUTE.length - 2, Math.floor(seg));
  const f = seg - i;
  const fx = ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * f;
  const fy = ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * f;
  const lamp = clamp01((s - beats.lamp) / 6);
  const z = track(
    s,
    [beats.map[0], beats.route[0], beats.route[1], beats.map[1]],
    [1.25, 1.1, 1.0, 1.15],
  );
  const cy = track(
    s,
    [beats.map[0], beats.route[0], beats.route[1], beats.lamp, beats.map[1]],
    [1300, 1200, 600, 260, 220],
  );
  const finger =
    clamp01((s - beats.route[0] + 10) / 8) *
    (1 - clamp01((s - beats.lamp) / 10));
  return (
    <g
      transform={cameraTransform({ fx: 540, fy: cy, z }, handheld(frame, 1.2))}
    >
      <RoadMap
        frame={frame}
        route={route}
        lamp={lamp}
        fingerX={fx}
        fingerY={fy}
        finger={finger}
      />
    </g>
  );
};

export const Part05: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);
  const scene =
    s < beats.door ? 0 : s >= beats.map[0] && s < beats.map[1] ? 2 : 1;
  const cut =
    s < beats.door
      ? 0
      : scene === 2
        ? beats.map[0]
        : s >= beats.map[1]
          ? beats.map[1]
          : beats.door;
  const dip = cut > 0 ? 1 - clamp01((s - cut) / 4) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        {scene === 0 ? (
          <Outside s={s} frame={frame} />
        ) : scene === 2 ? (
          <MapScene s={s} frame={frame} />
        ) : (
          <Inside s={s} frame={frame} />
        )}
        <rect width={1080} height={1920} fill="url(#vignette5)" />
        <rect width={1080} height={1920} fill="#000" opacity={dip} />
        <defs>
          <radialGradient id="vignette5" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <Glitch
        s={s}
        frame={frame}
        at={[
          [beats.live, beats.live + 6],
          [930, 934],
          [1046, 1050],
        ]}
      />
      <SeriesBadge
        frame={frame}
        part={5}
        title="THE SIGNAL"
        until={Math.round(toOut(70))}
      />
      <Captions
        frame={frame}
        chunks={timeline.captions}
        speakers={
          episode.captions.speakers as Record<string, keyof typeof SPEAKERS>
        }
        broadcast={["signal"]}
      />
      <PartCard
        frame={frame}
        from={Math.round(toOut(beats.card))}
        part={5}
        embers
      />
    </AbsoluteFill>
  );
};
