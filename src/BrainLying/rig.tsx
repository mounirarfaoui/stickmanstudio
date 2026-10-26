import React from "react";

// Angles in degrees. Limb angles: 0 = pointing down, positive = toward screen right.
export type Pose = {
  lean: number;
  tilt: number;
  duck: number;
  chest: number;
  lUA: number;
  lFA: number;
  rUA: number;
  rFA: number;
  lTh: number;
  lSh: number;
  rTh: number;
  rSh: number;
};

const POSE_KEYS: (keyof Pose)[] = [
  "lean",
  "tilt",
  "duck",
  "chest",
  "lUA",
  "lFA",
  "rUA",
  "rFA",
  "lTh",
  "lSh",
  "rTh",
  "rSh",
];

const legs = { lTh: -9, lSh: -5, rTh: 9, rSh: 5 };
const upright = { lean: 0, tilt: 0, duck: 0, chest: 1 };

export const POSES = {
  stand: { ...upright, ...legs, lUA: -12, lFA: -6, rUA: 12, rFA: 6 },
  nervous: {
    ...upright,
    tilt: 7,
    duck: 0.35,
    lUA: -14,
    lFA: 30,
    rUA: 14,
    rFA: -30,
    lTh: -6,
    lSh: -3,
    rTh: 6,
    rSh: 3,
  },
  cower: {
    lean: 5,
    tilt: 20,
    duck: 1,
    chest: 0.94,
    lUA: -30,
    lFA: 150,
    rUA: 30,
    rFA: -150,
    lTh: -38,
    lSh: 12,
    rTh: 38,
    rSh: -12,
  },
  freeze: {
    ...upright,
    tilt: 3,
    duck: 0.6,
    lUA: -4,
    lFA: -2,
    rUA: 4,
    rFA: 2,
    lTh: -4,
    lSh: -2,
    rTh: 4,
    rSh: 2,
  },
  breatheIn: {
    ...upright,
    ...legs,
    lean: -2,
    chest: 1.07,
    lUA: -34,
    lFA: -24,
    rUA: 34,
    rFA: 24,
  },
  breatheOut: { ...upright, ...legs, tilt: 2, lUA: -10, lFA: -4, rUA: 10, rFA: 4 },
  gestureA: { ...upright, ...legs, tilt: -4, lUA: -12, lFA: -6, rUA: 50, rFA: 110 },
  gestureB: { ...upright, ...legs, tilt: 3, lUA: -16, lFA: -10, rUA: 35, rFA: 75 },
  speak: {
    ...upright,
    lean: -3,
    tilt: -6,
    chest: 1.04,
    lUA: -40,
    lFA: -60,
    rUA: 70,
    rFA: 120,
    lTh: -12,
    lSh: -7,
    rTh: 12,
    rSh: 7,
  },
  proud: { ...upright, ...legs, lean: -2, tilt: -4, chest: 1.04, lUA: -16, lFA: -8, rUA: 16, rFA: 8 },
  // Where the shadow's limbs drift as the fear grows
  loom: {
    ...upright,
    tilt: -4,
    chest: 1.1,
    lUA: -120,
    lFA: -150,
    rUA: 120,
    rFA: 150,
    lTh: -22,
    lSh: -16,
    rTh: 22,
    rSh: 16,
  },
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof POSES;

export const lerpPose = (a: Pose, b: Pose, t: number): Pose => {
  const out = { ...a };
  for (const k of POSE_KEYS) {
    out[k] = a[k] + (b[k] - a[k]) * t;
  }
  return out;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

export const poseAt = (frame: number, keys: [number, PoseName][]): Pose => {
  if (frame <= keys[0][0]) return POSES[keys[0][1]];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, p0] = keys[i];
    const [f1, p1] = keys[i + 1];
    if (frame < f1) {
      return lerpPose(POSES[p0], POSES[p1], smooth((frame - f0) / (f1 - f0)));
    }
  }
  return POSES[keys[keys.length - 1][1]];
};

type Pt = { x: number; y: number };

const LEN = { torso: 112, neck: 12, head: 30, ua: 60, fa: 56, th: 76, sh: 72 };

const rad = (d: number) => (d * Math.PI) / 180;
const limb = (p: Pt, deg: number, len: number): Pt => ({
  x: p.x + Math.sin(rad(deg)) * len,
  y: p.y + Math.cos(rad(deg)) * len,
});

export type Skeleton = {
  hip: Pt;
  neck: Pt;
  shoulder: Pt;
  head: Pt;
  headAngle: number;
  lElbow: Pt;
  lHand: Pt;
  rElbow: Pt;
  rHand: Pt;
  lKnee: Pt;
  lFoot: Pt;
  rKnee: Pt;
  rFoot: Pt;
};

// Forward kinematics from the hip, then dropped so the lowest foot rests on y = 0.
export const skeleton = (p: Pose): Skeleton => {
  const hip = { x: 0, y: 0 };
  const neck = limb(hip, 180 - p.lean, LEN.torso * p.chest);
  const shoulder = { x: hip.x + (neck.x - hip.x) * 0.9, y: hip.y + (neck.y - hip.y) * 0.9 };
  const headAngle = p.lean + p.tilt;
  const head = limb(neck, 180 - headAngle, LEN.neck + LEN.head - p.duck * 16);
  const lElbow = limb(shoulder, p.lUA, LEN.ua);
  const rElbow = limb(shoulder, p.rUA, LEN.ua);
  const lKnee = limb(hip, p.lTh, LEN.th);
  const rKnee = limb(hip, p.rTh, LEN.th);
  const s: Skeleton = {
    hip,
    neck,
    shoulder,
    head,
    headAngle,
    lElbow,
    lHand: limb(lElbow, p.lFA, LEN.fa),
    rElbow,
    rHand: limb(rElbow, p.rFA, LEN.fa),
    lKnee,
    lFoot: limb(lKnee, p.lSh, LEN.sh),
    rKnee,
    rFoot: limb(rKnee, p.rSh, LEN.sh),
  };
  const ground = Math.max(s.lFoot.y, s.rFoot.y);
  for (const k of Object.keys(s) as (keyof Skeleton)[]) {
    const v = s[k];
    if (typeof v === "object") s[k] = { x: v.x, y: v.y - ground } as never;
  }
  return s;
};

const pts = (...p: Pt[]) => p.map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(" ");

export type Face = { worry: number; smile: number; mouth: number; sweat: number };

const FaceFeatures: React.FC<{ face: Face; frame: number }> = ({ face, frame }) => {
  const eyeR = 6 + face.worry * 1.6;
  const innerY = -13 - face.worry * 6;
  const outerY = -14 + face.worry * 3;
  const sweatY = -8 + ((frame * 0.6) % 14);
  return (
    <g>
      <circle cx={-11} cy={-3} r={eyeR} fill="#fff" />
      <circle cx={11} cy={-3} r={eyeR} fill="#fff" />
      <circle cx={-11} cy={-3 - face.worry * 1.5} r={3} fill="#111" />
      <circle cx={11} cy={-3 - face.worry * 1.5} r={3} fill="#111" />
      <line x1={-19} y1={outerY} x2={-5} y2={innerY} stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={19} y1={outerY} x2={5} y2={innerY} stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
      {face.mouth > 0.05 ? (
        <ellipse cx={0} cy={13} rx={6 + face.mouth * 2} ry={2 + face.mouth * 5} fill="#fff" />
      ) : (
        <path
          d={`M -9 13 Q 0 ${13 + face.smile * 9 - face.worry * 5} 9 13`}
          stroke="#fff"
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {face.sweat > 0.01 ? (
        <path
          d={`M 27 ${sweatY - 8} Q 33 ${sweatY + 2} 27 ${sweatY + 4} Q 21 ${sweatY + 2} 27 ${sweatY - 8} Z`}
          fill="#5DB7FF"
          opacity={face.sweat}
        />
      ) : null}
    </g>
  );
};

export const StickFigure: React.FC<{
  pose: Pose;
  x: number;
  y: number;
  scale: number;
  face: Face;
  frame: number;
}> = ({ pose, x, y, scale, face, frame }) => {
  const s = skeleton(pose);
  const line = { stroke: "#111", strokeWidth: 15, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <polyline points={pts(s.lFoot, s.lKnee, s.hip, s.rKnee, s.rFoot)} {...line} />
      <polyline points={pts(s.hip, s.neck)} {...line} />
      <polyline points={pts(s.lHand, s.lElbow, s.shoulder, s.rElbow, s.rHand)} {...line} />
      <polyline points={pts(s.shoulder, s.neck)} {...line} />
      <g transform={`translate(${s.head.x} ${s.head.y}) rotate(${s.headAngle})`}>
        <circle r={LEN.head} fill="#111" />
        <FaceFeatures face={face} frame={frame} />
      </g>
    </g>
  );
};

const angleOf = (a: Pt, b: Pt) => (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;

const Claws: React.FC<{ elbow: Pt; hand: Pt; m: number }> = ({ elbow, hand, m }) => {
  const a = angleOf(elbow, hand);
  return (
    <g>
      {[-32, 0, 32].map((d) => {
        const tip = limb(hand, a + d, 8 + 34 * m);
        return (
          <line key={d} x1={hand.x} y1={hand.y} x2={tip.x} y2={tip.y} stroke="#17161c" strokeWidth={8} strokeLinecap="round" />
        );
      })}
    </g>
  );
};

// The wall shadow. At m = 0 it is an ordinary soft shadow of the stickman;
// as m rises it swells, sprouts horns, claws, eyes and teeth.
export const ShadowMonster: React.FC<{
  pose: Pose;
  m: number;
  frame: number;
  x: number;
  y: number;
  scale: number;
}> = ({ pose, m, frame, x, y, scale }) => {
  const s = skeleton(lerpPose(pose, POSES.loom, Math.min(1, m * 1.15) * 0.85));
  const thick = 15 + 26 * m;
  const body = { stroke: "#17161c", strokeWidth: thick, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;
  const face = Math.min(1, Math.max(0, (m - 0.2) / 0.4));
  const roar = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.11));
  const jaw = (5 + 14 * roar) * face;
  const breathe = 1 + 0.025 * m * Math.sin(frame * 0.22);
  const spikes = Array.from({ length: 7 }, (_, i) => {
    const t = 0.15 + i * 0.12;
    const px = s.hip.x + (s.neck.x - s.hip.x) * t;
    const py = s.hip.y + (s.neck.y - s.hip.y) * t;
    const len = (14 + 20 * Math.sin(i * 1.7 + 1) ** 2) * m;
    const w = thick / 2;
    return `M ${px - w} ${py - 9} L ${px - w - len} ${py - 2} L ${px - w} ${py + 9} Z M ${px + w} ${py - 9} L ${px + w + len} ${py - 2} L ${px + w} ${py + 9} Z`;
  }).join(" ");
  const teeth = Array.from({ length: 6 }, (_, i) => {
    const tx = -18 + i * 7.2;
    return `M ${tx} 8 L ${tx + 3.6} ${8 + 6} L ${tx + 7.2} 8 Z M ${tx} ${8 + jaw} L ${tx + 3.6} ${8 + jaw - 6} L ${tx + 7.2} ${8 + jaw} Z`;
  }).join(" ");

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * breathe}) skewX(${-4 * m})`} opacity={0.24 + 0.72 * m}>
      <g filter="url(#softShadow)">
        <polyline points={pts(s.lFoot, s.lKnee, s.hip, s.rKnee, s.rFoot)} {...body} />
        <polyline points={pts(s.hip, s.neck)} {...body} />
        <polyline points={pts(s.lHand, s.lElbow, s.shoulder, s.rElbow, s.rHand)} {...body} />
        <path d={spikes} fill="#17161c" />
        <Claws elbow={s.lElbow} hand={s.lHand} m={m} />
        <Claws elbow={s.rElbow} hand={s.rHand} m={m} />
        <g transform={`translate(${s.head.x} ${s.head.y}) rotate(${s.headAngle})`}>
          <circle r={30 + 12 * m} fill="#17161c" />
          <g transform={`scale(${m})`}>
            <path d="M -24 -24 Q -56 -52 -38 -96 Q -28 -60 -6 -38 Z" fill="#17161c" />
            <path d="M 24 -24 Q 56 -52 38 -96 Q 28 -60 6 -38 Z" fill="#17161c" />
          </g>
        </g>
      </g>
      <g transform={`translate(${s.head.x} ${s.head.y}) rotate(${s.headAngle})`} opacity={face}>
        <g filter="url(#glow)">
          <ellipse cx={-14} cy={-6} rx={10} ry={4.5} fill="#FF4A3D" transform="rotate(22 -14 -6)" />
          <ellipse cx={14} cy={-6} rx={10} ry={4.5} fill="#FF4A3D" transform="rotate(-22 14 -6)" />
        </g>
        <rect x={-19} y={7} width={38} height={jaw + 2} rx={5} fill="#5A0B10" />
        <path d={teeth} fill="#F4EFE6" />
      </g>
    </g>
  );
};
