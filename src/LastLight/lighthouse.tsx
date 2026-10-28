import React from "react";
import { Face, Pose, skeleton, Skeleton, StickFigure } from "../shared/rig";
import { NightSky } from "./sets";
import { rand } from "./world";

// Sets for LAST LIGHT Parts 9–10: the coast road, Gull Point lighthouse (tower, gate, the keeper's compound),
// the spiral stair, the lamp room with its generator, hatch and great lamp, and the rocks under the beam.
// All procedural SVG. Needs world.tsx <Defs /> (sky gradient, #soft, #zombieGlow) plus <LHDefs /> in the page.

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = clamp01(t);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};

export const LHDefs: React.FC = () => (
  <defs>
    <linearGradient id="lhSeaDusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#7a2c36" />
      <stop offset="0.25" stopColor="#3a1626" />
      <stop offset="1" stopColor="#12080f" />
    </linearGradient>
    <linearGradient id="lhSeaNight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#13203a" />
      <stop offset="0.3" stopColor="#081022" />
      <stop offset="1" stopColor="#02040a" />
    </linearGradient>
    <radialGradient id="lhGlare">
      <stop offset="0" stopColor="#fffbe6" stopOpacity={1} />
      <stop offset="0.25" stopColor="#fff2b8" stopOpacity={0.6} />
      <stop offset="1" stopColor="#ffe9a0" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="lhWarm">
      <stop offset="0" stopColor="#ffc879" stopOpacity={0.7} />
      <stop offset="1" stopColor="#ffc879" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="lhGreen">
      <stop offset="0" stopColor="#9CFF57" stopOpacity={0.55} />
      <stop offset="1" stopColor="#9CFF57" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="lhBeam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#fffbe6" stopOpacity={0.85} />
      <stop offset="0.35" stopColor="#fff2b8" stopOpacity={0.45} />
      <stop offset="1" stopColor="#ffe9a0" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="lhWall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#0c1020" />
      <stop offset="0.5" stopColor="#232a40" />
      <stop offset="1" stopColor="#0c1020" />
    </linearGradient>
    <linearGradient id="lhMirror" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#3b4a5e" />
      <stop offset="0.5" stopColor="#1b2434" />
      <stop offset="1" stopColor="#2c3a4c" />
    </linearGradient>
    <pattern id="lhMesh" width={34} height={34} patternUnits="userSpaceOnUse">
      <path d="M 0 0 L 34 34 M 34 0 L 0 34" stroke="#7d8288" strokeWidth={3} />
    </pattern>
    <pattern id="lhBrick" width={160} height={80} patternUnits="userSpaceOnUse">
      <path d="M 0 0 L 160 0 M 0 40 L 160 40 M 40 0 L 40 40 M 120 40 L 120 80" stroke="#05070e" strokeWidth={4} opacity={0.55} />
    </pattern>
    <filter id="lhBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={10} />
    </filter>
  </defs>
);

// ================= Characters =================
// Kai, turning: `grey` drains the black toward the dead's grey-green, `green` lights his right eye (both with `both`).
// The bandage sits on his left shin.
export const KAI_GREY = "#5a6352";
export const kaiColor = (grey: number) => mix("#111111", KAI_GREY, grey * 0.85);
export const Kai: React.FC<{
  pose: Pose;
  x: number;
  y: number;
  scale?: number;
  frame: number;
  flip?: boolean;
  face: Face;
  grey: number;
  green: number;
  both?: boolean;
  zombie?: boolean;
  prop?: (s: Skeleton) => React.ReactNode;
}> = ({ pose, x, y, scale = 1, frame, flip = false, face, grey, green, both = false, zombie = false, prop }) => {
  const sk = skeleton(pose);
  const color = kaiColor(grey);
  const bx = sk.lKnee.x + (sk.lFoot.x - sk.lKnee.x) * 0.4;
  const by = sk.lKnee.y + (sk.lFoot.y - sk.lKnee.y) * 0.4;
  const ang = (Math.atan2(sk.lFoot.y - sk.lKnee.y, sk.lFoot.x - sk.lKnee.x) * 180) / Math.PI;
  return (
    <g>
      <StickFigure
        pose={pose}
        x={x}
        y={y}
        scale={scale}
        frame={frame}
        flip={flip}
        color={color}
        face={face}
        zombie={zombie ? { glow: 1 } : undefined}
        prop={(s) => (
          <g>
            <g transform={`translate(${bx} ${by}) rotate(${ang})`}>
              <rect x={-17} y={-13} width={34} height={26} rx={6} fill="#d9d2bf" />
              <line x1={-8} y1={-13} x2={-12} y2={13} stroke="#a89f88" strokeWidth={3} />
              <line x1={6} y1={-13} x2={2} y2={13} stroke="#a89f88" strokeWidth={3} />
              <circle cx={2} cy={2} r={6} fill="#7a1d1d" opacity={0.85} />
            </g>
            {prop?.(s)}
          </g>
        )}
      />
      {green > 0.02 && !zombie ? (
        <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
          <g transform={`translate(${sk.head.x} ${sk.head.y}) rotate(${sk.headAngle})`} filter="url(#zombieGlow)" opacity={green}>
            <circle cx={11} cy={-3} r={7} fill="#B6FF5C" />
            {both ? <circle cx={-11} cy={-3} r={7} fill="#B6FF5C" /> : null}
          </g>
        </g>
      ) : null}
    </g>
  );
};

// Mia's bat (angle in rig convention: 0 = pointing down)
export const Bat: React.FC<{ sk: Skeleton; angle: number }> = ({ sk, angle }) => {
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

// Raised hackles along Biscuit's back (same transform as <Dog>)
export const Hackles: React.FC<{ x: number; y: number; scale?: number; flip?: boolean; up: number; frame: number }> = ({ x, y, scale = 1, flip = false, up, frame }) => {
  if (up <= 0) return null;
  const pts: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const px = -50 + i * 8.5;
    const py = -86 - (i % 2 ? (10 + Math.sin(frame * 1.7 + i) * 3) * up : 0);
    pts.push(`${px},${py}`);
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <polyline points={pts.join(" ")} stroke="#6e5032" strokeWidth={7} fill="none" strokeLinejoin="miter" />
    </g>
  );
};

// ================= The lighthouse =================
// Local coords: base at (0,0), lamp at (0,-905). `rot` turns the beam around the tower (degrees);
// sin(rot) > 0 means it swings toward the viewer (glare), < 0 behind the tower.
export const LAMP_Y = -905;
export const Beam: React.FC<{ x: number; y: number; rot: number; len: number; power: number; width?: number }> = ({ x, y, rot, len, power, width = 90 }) => {
  if (power <= 0) return null;
  const a = (rot * Math.PI) / 180;
  const d = Math.cos(a);
  const toward = Math.sin(a);
  const ad = Math.max(0.03, Math.abs(d));
  const spread = width + 240 * (1 - ad);
  const glare = Math.max(0, toward) ** 5;
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={power}>
      <g transform={`translate(${x} ${y}) scale(${d < 0 ? -ad : ad} 1)`}>
        <polygon points={`0,-16 ${len},${-spread} ${len},${spread} 0,16`} fill="url(#lhBeam)" />
        <polygon points={`0,-8 ${len * 0.8},${-spread * 0.35} ${len * 0.8},${spread * 0.35} 0,8`} fill="url(#lhBeam)" opacity={0.8} />
      </g>
      <circle cx={x} cy={y} r={60 + 700 * glare} fill="url(#lhGlare)" opacity={0.7 + 0.3 * glare} />
    </g>
  );
};

const towerHW = (y: number) => 110 - 40 * (-y / 820);
export const Lighthouse: React.FC<{ x: number; y: number; s: number; lamp: number; rot?: number; night: number; beamLen?: number; frame: number }> = ({
  x,
  y,
  s,
  lamp,
  rot = 0,
  night,
  beamLen = 3000,
  frame,
}) => {
  const toward = Math.sin((rot * Math.PI) / 180);
  const beam = lamp > 0 ? <Beam x={0} y={LAMP_Y} rot={rot} len={beamLen / s} power={lamp} /> : null;
  const white = mix("#eadfcf", "#4b5368", night);
  const red = mix("#a7282d", "#3a1e2a", night);
  const band = (y0: number, y1: number) => `${-towerHW(y0)},${y0} ${towerHW(y0)},${y0} ${towerHW(y1)},${y1} ${-towerHW(y1)},${y1}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {toward < 0 ? beam : null}
      <polygon points={band(0, -820)} fill={white} />
      {[
        [-120, -250],
        [-430, -560],
        [-700, -815],
      ].map(([a, b]) => (
        <polygon key={a} points={band(a, b)} fill={red} />
      ))}
      {/* shade on the sea side */}
      <polygon points={`0,0 ${towerHW(0)},0 ${towerHW(-820)},-820 0,-820`} fill="#05060c" opacity={0.35} />
      <rect x={-26} y={-110} width={52} height={110} rx={8} fill="#140c10" />
      {[-340, -640].map((wy) => (
        <rect key={wy} x={-12} y={wy} width={24} height={44} rx={4} fill={lamp > 0 ? "#ffd27a" : "#151822"} />
      ))}
      {/* gallery and railing */}
      <rect x={-112} y={-848} width={224} height={26} fill="#22242c" />
      {[-100, -66, -33, 0, 33, 66, 100].map((px) => (
        <line key={px} x1={px} y1={-848} x2={px} y2={-886} stroke="#22242c" strokeWidth={5} />
      ))}
      <line x1={-108} y1={-886} x2={108} y2={-886} stroke="#22242c" strokeWidth={6} />
      {/* lantern */}
      <rect x={-62} y={-968} width={124} height={120} fill={lamp > 0 ? mix("#2a2f3c", "#fff3c4", lamp) : "#161b26"} />
      {[-31, 0, 31].map((px) => (
        <line key={px} x1={px} y1={-968} x2={px} y2={-848} stroke="#22242c" strokeWidth={6} />
      ))}
      <circle cx={0} cy={LAMP_Y} r={22} fill={lamp > 0 ? "#fffef2" : "#2d3240"} />
      <path d="M -74 -966 Q 0 -1060 74 -966 Z" fill="#22242c" />
      <line x1={0} y1={-1040} x2={0} y2={-1090} stroke="#22242c" strokeWidth={8} />
      <circle cx={0} cy={-1094} r={10} fill="#22242c" />
      {lamp > 0 ? <circle cx={0} cy={LAMP_Y} r={240} fill="url(#lhGlare)" opacity={lamp * (0.55 + 0.1 * Math.sin(frame * 0.4))} /> : null}
      {toward >= 0 ? beam : null}
    </g>
  );
};

// ================= The coast road =================
export const COAST = { horizon: 1080, lh: { x: 2080, y: 1000, s: 0.5 } };
export const roadY = (x: number) => 1500 - 130 * Math.exp(-(((x - 900) / 650) ** 2));
export const roadSlope = (x: number) => (Math.atan2(roadY(x + 10) - roadY(x - 10), 20) * 180) / Math.PI;

const Sea: React.FC<{ frame: number; night: number; horizon: number; sunX?: number }> = ({ frame, night, horizon, sunX = 1350 }) => (
  <g>
    <rect x={-1600} y={horizon} width={5200} height={1700} fill="url(#lhSeaDusk)" />
    <rect x={-1600} y={horizon} width={5200} height={1700} fill="url(#lhSeaNight)" opacity={night} />
    {Array.from({ length: 90 }, (_, i) => {
      const depth = rand(i + 2000) ** 1.6;
      const y = horizon + 8 + depth * 620;
      const near = Math.abs(rand(i + 2100) - 0.5) < 0.12;
      const x = near ? sunX - 160 + rand(i + 2200) * 320 + Math.sin(frame * 0.07 + i) * 20 : ((rand(i + 2300) * 4200 + frame * (1.2 + depth * 2)) % 4200) - 1400;
      const len = 14 + depth * 70;
      const col = night > 0.5 ? "#7f97c8" : near ? "#ffc27a" : "#c25a4c";
      return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke={col} strokeWidth={2 + depth * 4} opacity={(0.25 + 0.55 * Math.abs(Math.sin(frame * 0.09 + i * 1.7))) * (near ? 1 : 0.6)} />;
    })}
  </g>
);

export const Coast: React.FC<{
  frame: number;
  night: number;
  lamp?: number;
  rot?: number;
  moonY?: number;
  sun?: number;
  road?: boolean;
  children?: React.ReactNode;
  front?: React.ReactNode;
}> = ({ frame, night, lamp = 0, rot = 0, moonY = 300, sun = 1, road = true, children, front }) => {
  const { horizon, lh } = COAST;
  const land = mix("#2c1318", "#070a14", night);
  const head = mix("#3a1a1e", "#0a0e1a", night);
  const pts: string[] = [];
  for (let x = -1600; x <= 3800; x += 50) pts.push(`${x},${roadY(x).toFixed(1)}`);
  return (
    <g>
      <NightSky t={night} frame={frame} moonY={moonY} />
      {night < 0.9 ? (
        <g opacity={(1 - night) * sun}>
          <circle cx={1350} cy={horizon - 40} r={420} fill="#ff7a3d" opacity={0.3} filter="url(#soft)" />
          <circle cx={1350} cy={horizon - 40} r={120} fill="#ffb066" />
        </g>
      ) : null}
      <Sea frame={frame} night={night} horizon={horizon} />
      {/* the far coast to the north, black against the sea */}
      <path d={`M -1600 ${horizon + 2} L -1600 ${horizon - 40} Q -1100 ${horizon - 90} -700 ${horizon - 30} Q -300 ${horizon - 70} 200 ${horizon - 12} L 700 ${horizon + 2} Z`} fill={mix("#3a1620", "#05070f", night)} />
      {/* the headland */}
      <path d={`M 1560 ${horizon + 140} Q 1640 ${horizon + 40} 1760 ${horizon - 60} Q 1820 ${horizon - 84} 1900 ${horizon - 82} L 3800 ${horizon - 90} L 3800 ${horizon + 160} Z`} fill={head} />
      {Array.from({ length: 14 }, (_, i) => {
        const fx = 1560 + i * 160 + rand(i + 60) * 40;
        const fy = horizon + 140 + rand(i + 61) * 14;
        return <path key={i} d={`M ${fx - 50} ${fy} Q ${fx} ${fy - 14 - Math.abs(Math.sin(frame * 0.12 + i)) * 12} ${fx + 50} ${fy}`} stroke="#d8e2f0" strokeWidth={4} fill="none" opacity={0.25 + 0.3 * Math.abs(Math.sin(frame * 0.1 + i))} />;
      })}
      {/* the keeper's compound and its fence */}
      <rect x={2170} y={horizon - 150} width={190} height={66} fill={mix("#4a2a2a", "#10131e", night)} />
      <polygon points={`${2160},${horizon - 150} ${2370},${horizon - 150} ${2340},${horizon - 176} ${2190},${horizon - 176}`} fill={mix("#2a1418", "#0a0c14", night)} />
      <line x1={1900} y1={horizon - 108} x2={2600} y2={horizon - 112} stroke={mix("#6a4a44", "#1a1e2a", night)} strokeWidth={4} strokeDasharray="4 14" />
      <Lighthouse x={lh.x} y={lh.y} s={lh.s} lamp={lamp} rot={rot} night={night} frame={frame} />
      {road ? (
        <g>
          <polygon points={`-1600,2800 ${pts.join(" ")} 3800,2800`} fill={land} />
          <polyline points={pts.join(" ")} stroke={mix("#4a2c2a", "#1a1d28", night)} strokeWidth={26} fill="none" />
          <polyline points={pts.join(" ")} stroke={mix("#c9a26a", "#5d6478", night)} strokeWidth={4} strokeDasharray="40 50" fill="none" transform="translate(0 6)" opacity={0.7} />
          {/* guard rail posts */}
          {Array.from({ length: 36 }, (_, i) => {
            const px = -1500 + i * 150;
            return <rect key={i} x={px} y={roadY(px) - 52} width={10} height={44} fill={mix("#5a3a32", "#161924", night)} />;
          })}
          {/* grass blown by the sea wind */}
          {Array.from({ length: 120 }, (_, i) => {
            const gx = -1500 + i * 44 + rand(i + 3000) * 30;
            const gy = roadY(gx) + 20 + rand(i + 3100) * 40;
            const lean = Math.sin(frame * 0.16 + gx * 0.004) * 14 + 16;
            const h = 30 + rand(i + 3200) * 40;
            return <line key={i} x1={gx} y1={gy} x2={gx + Math.sin((lean * Math.PI) / 180) * h} y2={gy - Math.cos((lean * Math.PI) / 180) * h} stroke={mix("#5a2a24", "#141a22", night)} strokeWidth={5} strokeLinecap="round" />;
          })}
        </g>
      ) : null}
      {children}
      {front}
    </g>
  );
};

// ================= The gate =================
export const GATE = { ground: 1480, hinge: 1000, w: 330, h: 380 };
export const GateSet: React.FC<{ frame: number; night: number; swing: number; children?: React.ReactNode; behind?: React.ReactNode }> = ({ frame, night, swing, children, behind }) => {
  const { ground: g, hinge, w, h } = GATE;
  const a = (swing * Math.PI) / 180;
  const ex = hinge + w * Math.cos(a);
  const ey = w * Math.sin(a) * 0.3;
  const posts = [-760, -500, -240, 20, 280, 540, 800, hinge, hinge + w, 1590, 1850, 2110, 2370, 2630];
  return (
    <g>
      <NightSky t={night} frame={frame} moonY={260} />
      <circle cx={300} cy={1150} r={360} fill="#ff7a3d" opacity={0.25 * (1 - night)} filter="url(#soft)" />
      <Sea frame={frame} night={night} horizon={1180} sunX={300} />
      <Lighthouse x={1700} y={g - 30} s={1.25} lamp={0} night={night * 0.8} frame={frame} />
      {/* the keeper's house */}
      <rect x={60} y={1040} width={760} height={g - 1040} fill={mix("#4a2c2c", "#151826", night)} />
      <polygon points={`30,1040 850,1040 800,990 80,990`} fill={mix("#2a1418", "#0a0c14", night)} />
      {[160, 420, 640].map((wx, i) => (
        <g key={wx}>
          <rect x={wx} y={1120} width={110} height={120} fill="#0b0d14" />
          <path d={`M ${wx + 20} ${1120} L ${wx + 60} ${1180} L ${wx + 34} ${1240}`} stroke="#3a3f4c" strokeWidth={3} fill="none" opacity={i === 1 ? 1 : 0} />
          <line x1={wx + 55} y1={1120} x2={wx + 55} y2={1240} stroke={mix("#4a2c2c", "#151826", night)} strokeWidth={6} />
        </g>
      ))}
      <rect x={300} y={1290} width={110} height={g - 1290} fill="#07080c" />
      <polygon points={`300,1290 362,1302 362,${g + 8} 300,${g}`} fill={mix("#5a3a32", "#1c1f2a", night)} />
      <rect x={-1600} y={g - 10} width={5200} height={900} fill={mix("#2c1a17", "#0b0d14", night)} />
      {behind}
      {/* chain-link fence with barbed wire, a gap where the gate hangs */}
      {posts.slice(0, -1).map((px, i) =>
        px === hinge ? null : (
          <rect key={i} x={px} y={g - h} width={posts[i + 1] - px} height={h} fill="url(#lhMesh)" opacity={0.75} />
        ),
      )}
      {posts.map((px) => (
        <rect key={px} x={px - 7} y={g - h - 40} width={14} height={h + 40} fill="#454a52" />
      ))}
      <line x1={-800} y1={g - h} x2={hinge} y2={g - h} stroke="#555a62" strokeWidth={8} />
      <line x1={hinge + w} y1={g - h} x2={2700} y2={g - h} stroke="#555a62" strokeWidth={8} />
      <path d={Array.from({ length: 90 }, (_, i) => `${i ? "L" : "M"} ${-800 + i * 40} ${g - h - 26 + (i % 2 ? -10 : 10)}`).join(" ")} stroke="#3a3e46" strokeWidth={3} fill="none" />
      {/* the sign */}
      <g transform={`translate(330 ${g - 300}) rotate(${-4 + Math.sin(frame * 0.09) * 1.5})`}>
        <rect x={0} y={0} width={360} height={150} fill="#d8cfb8" />
        <text x={180} y={64} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={46} fill="#9a1e1e">
          GULL POINT
        </text>
        <text x={180} y={124} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={42} fill="#9a1e1e">
          SAFE ZONE
        </text>
        <rect x={0} y={0} width={360} height={150} fill="#000" opacity={0.25 + 0.5 * night} />
      </g>
      {/* the gate swings in the wind */}
      <polygon points={`${hinge},${g - h} ${ex},${g - h + ey - 10} ${ex},${g + ey} ${hinge},${g}`} fill="url(#lhMesh)" />
      <polyline points={`${hinge},${g - h} ${ex},${g - h + ey - 10} ${ex},${g + ey} ${hinge},${g} Z`} stroke="#6a6f78" strokeWidth={9} fill="none" />
      <line x1={hinge} y1={g} x2={ex} y2={g - h + ey - 10} stroke="#6a6f78" strokeWidth={7} />
      {/* the cut chain hanging off it */}
      <path d={`M ${ex} ${g - h / 2 + ey} q ${10 + Math.sin(frame * 0.2) * 8} 40 ${Math.sin(frame * 0.15) * 14} 90`} stroke="#9a9488" strokeWidth={7} fill="none" strokeDasharray="10 5" />
      {children}
    </g>
  );
};

// ================= The keeper's compound, inside =================
export const ROOM = {
  floor: 1520,
  window: { x: 1600, y: 840, w: 400, h: 360 },
  desk: { x: 420, w: 420, top: 1290 },
  recorder: { x: 640, y: 1290 },
  calendar: { x: 150, y: 760 },
  mirror: { x: 930, y: 780, w: 190, h: 260 },
  cot: { x: 1180 },
};

// The dusty recorder on the desk: reels turn, the LED blinks, the needle twitches. Drawn with its base at (x, y).
export const Recorder: React.FC<{ x: number; y: number; frame: number; on: number; angle?: number; dust?: number }> = ({ x, y, frame, on, angle = 0, dust = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x={-120} y={-110} width={240} height={110} rx={10} fill="#3a3530" />
    <rect x={-120} y={-110} width={240} height={14} rx={6} fill="#5a534a" />
    {[-60, 60].map((rx, i) => (
      <g key={rx} transform={`translate(${rx} -58) rotate(${on * frame * (i ? 7 : 9)})`}>
        <circle r={36} fill="#1c1a18" />
        <circle r={30} fill="#2b2622" />
        {[0, 120, 240].map((d) => (
          <rect key={d} x={-4} y={-28} width={8} height={18} fill="#8a8070" transform={`rotate(${d})`} />
        ))}
        <circle r={8} fill="#8a8070" />
      </g>
    ))}
    <rect x={-22} y={-38} width={44} height={22} rx={3} fill="#c8b98e" />
    <line x1={0} y1={-18} x2={Math.sin(frame * 0.9) * Math.sin(frame * 0.37) * 14 * on} y2={-34} stroke="#1a1a1a" strokeWidth={2.5} />
    <circle cx={98} cy={-20} r={7} fill={on && Math.floor(frame / 6) % 2 ? "#ff3b30" : "#4a1414"} />
    {on ? <circle cx={98} cy={-20} r={22} fill="#ff3b30" opacity={Math.floor(frame / 6) % 2 ? 0.35 : 0} filter="url(#soft)" /> : null}
    {/* dust */}
    <rect x={-120} y={-112} width={240} height={10} rx={5} fill="#b9b2a2" opacity={0.6 * dust} />
    {Array.from({ length: 10 }, (_, i) => (
      <circle key={i} cx={-110 + i * 24} cy={-60 + (i % 3) * 18} r={3} fill="#b9b2a2" opacity={0.35 * dust} />
    ))}
  </g>
);

const Cot: React.FC<{ x: number; y: number; angle: number; blanket?: string }> = ({ x, y, angle, blanket = "#3d4d63" }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x={0} y={-130} width={380} height={22} rx={6} fill="#5a5e66" />
    <rect x={10} y={-150} width={360} height={24} rx={10} fill="#8a8678" />
    <path d="M 80 -150 Q 160 -186 250 -152 Q 300 -140 340 -160 L 340 -126 L 80 -126 Z" fill={blanket} />
    {[16, 364].map((lx) => (
      <line key={lx} x1={lx} y1={-110} x2={lx} y2={0} stroke="#5a5e66" strokeWidth={10} />
    ))}
  </g>
);

export const Calendar: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={0} y={0} width={210} height={250} fill="#d8cfb8" />
    <rect x={0} y={0} width={210} height={52} fill="#9a1e1e" />
    <text x={105} y={38} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={30} fill="#fff">
      MARCH
    </text>
    {Array.from({ length: 35 }, (_, i) => {
      const cx = 12 + (i % 7) * 27;
      const cy = 64 + Math.floor(i / 7) * 36;
      return (
        <g key={i}>
          <rect x={cx} y={cy} width={24} height={32} fill="none" stroke="#9a9078" strokeWidth={1.5} />
          {i < 17 ? <path d={`M ${cx + 3} ${cy + 4} L ${cx + 21} ${cy + 28} M ${cx + 21} ${cy + 4} L ${cx + 3} ${cy + 28}`} stroke="#b0221e" strokeWidth={3} /> : null}
        </g>
      );
    })}
    <rect x={0} y={0} width={210} height={250} fill="#000" opacity={0.15} />
  </g>
);

export const Compound: React.FC<{ frame: number; outside: React.ReactNode; children?: React.ReactNode; on?: number; recorderOnDesk?: boolean; mirrorGreen?: number }> = ({
  frame,
  outside,
  children,
  on = 1,
  recorderOnDesk = true,
}) => {
  const { floor, window: W, desk, recorder, calendar, mirror } = ROOM;
  return (
    <g>
      <rect x={-1200} y={-600} width={4600} height={floor + 600} fill="#1e2844" />
      <rect x={-1200} y={floor - 200} width={4600} height={200} fill="#0f1524" />
      <line x1={-1200} y1={floor - 200} x2={3400} y2={floor - 200} stroke="#1d2640" strokeWidth={8} />
      {/* peeling paper, stains */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={-600 + i * 380 + rand(i + 70) * 100} y={600 + rand(i + 71) * 300} width={30 + rand(i + 72) * 60} height={120 + rand(i + 73) * 200} fill="#0c1120" opacity={0.6} />
      ))}
      {/* the window */}
      <clipPath id="lhWin">
        <rect x={W.x} y={W.y} width={W.w} height={W.h} />
      </clipPath>
      <g clipPath="url(#lhWin)">{outside}</g>
      <rect x={W.x} y={W.y} width={W.w} height={W.h} fill="none" stroke="#2c2620" strokeWidth={22} />
      <line x1={W.x + W.w / 2} y1={W.y} x2={W.x + W.w / 2} y2={W.y + W.h} stroke="#2c2620" strokeWidth={12} />
      <line x1={W.x} y1={W.y + W.h / 2} x2={W.x + W.w} y2={W.y + W.h / 2} stroke="#2c2620" strokeWidth={12} />
      <rect x={W.x - 30} y={W.y + W.h} width={W.w + 60} height={22} fill="#2c2620" />
      {/* dusk light falling through it */}
      <polygon points={`${W.x},${W.y + W.h} ${W.x + W.w},${W.y + W.h} ${W.x + W.w - 200},${floor} ${W.x - 420},${floor}`} fill="#ff9a5a" opacity={0.08} />
      {/* the calendar, the mirror */}
      <Calendar x={calendar.x} y={calendar.y} />
      <g>
        <rect x={mirror.x - 12} y={mirror.y - 12} width={mirror.w + 24} height={mirror.h + 24} rx={8} fill="#3a2c22" />
        <rect x={mirror.x} y={mirror.y} width={mirror.w} height={mirror.h} fill="url(#lhMirror)" />
        <path d={`M ${mirror.x + 110} ${mirror.y + 90} L ${mirror.x + 30} ${mirror.y + 20} M ${mirror.x + 110} ${mirror.y + 90} L ${mirror.x + 180} ${mirror.y + 40} M ${mirror.x + 110} ${mirror.y + 90} L ${mirror.x + 60} ${mirror.y + 250} M ${mirror.x + 110} ${mirror.y + 90} L ${mirror.x + 190} ${mirror.y + 190}`} stroke="#c9d6e6" strokeWidth={3} opacity={0.7} />
        <rect x={mirror.x - 20} y={mirror.y + mirror.h + 12} width={mirror.w + 40} height={14} fill="#3a2c22" />
      </g>
      {/* the desk */}
      <rect x={desk.x} y={desk.top} width={desk.w} height={24} fill="#4a3628" />
      <rect x={desk.x + 16} y={desk.top + 24} width={20} height={floor - desk.top - 24} fill="#3a2a20" />
      <rect x={desk.x + desk.w - 36} y={desk.top + 24} width={20} height={floor - desk.top - 24} fill="#3a2a20" />
      <rect x={desk.x + desk.w - 170} y={desk.top + 24} width={134} height={110} fill="#3a2a20" />
      {/* papers on the desk and an antenna lead */}
      <rect x={desk.x + 280} y={desk.top - 8} width={90} height={8} fill="#cfc6ae" transform={`rotate(-4 ${desk.x + 300} ${desk.top})`} />
      <path d={`M ${recorder.x + 110} ${recorder.y - 60} Q ${recorder.x + 220} ${recorder.y - 300} ${recorder.x + 260} ${recorder.y - 520}`} stroke="#22252c" strokeWidth={4} fill="none" />
      {recorderOnDesk ? <Recorder x={recorder.x} y={recorder.y} frame={frame} on={on} /> : null}
      {/* cots: one upright, two thrown over */}
      <Cot x={ROOM.cot.x} y={floor} angle={0} />
      <Cot x={1640} y={floor - 20} angle={-90} blanket="#4a3a3a" />
      <Cot x={-520} y={floor - 130} angle={180} blanket="#3a4a3a" />
      <rect x={-1200} y={floor} width={4600} height={900} fill="#0a0e19" />
      {Array.from({ length: 10 }, (_, i) => (
        <line key={i} x1={-1200} y1={floor + 30 + i * i * 10} x2={3400} y2={floor + 30 + i * i * 10} stroke="#121828" strokeWidth={4} />
      ))}
      {/* a blanket on the floor */}
      <path d={`M 1000 ${floor + 4} Q 1080 ${floor - 30} 1180 ${floor} L 1240 ${floor + 30} L 980 ${floor + 30} Z`} fill="#3d4d63" />
      {children}
    </g>
  );
};

// The cracked mirror, close: Kai's face, the eye that flickers green. `look` turns him away (0..1).
export const MirrorClose: React.FC<{ frame: number; grey: number; green: number; look: number; shake?: number }> = ({ frame, grey, green, look, shake = 0 }) => {
  const head = kaiColor(grey);
  const hx = 540 - look * 160 + Math.sin(frame * 0.7) * shake;
  const hy = 980 + Math.sin(frame * 0.13) * 6;
  const eyeX = look * -14;
  const face = (dx: number, dy: number) => (
    <g transform={`translate(${hx + dx} ${hy + dy}) rotate(${-look * 14})`}>
      <rect x={-70} y={180} width={140} height={600} fill={head} />
      <circle r={250} fill={head} />
      {/* fevered sheen */}
      <ellipse cx={-90} cy={-110} rx={70} ry={40} fill="#fff" opacity={0.06} />
      {[-90, 90].map((ex, i) => (
        <g key={ex}>
          <circle cx={ex} cy={-20} r={52} fill={i ? mix("#ffffff", "#e8f0d0", green) : "#f2efe6"} />
          <circle cx={ex + eyeX * 3} cy={-14} r={20} fill="#111" />
          {i ? <circle cx={ex + eyeX * 3} cy={-14} r={48} fill="#B6FF5C" opacity={green} filter="url(#zombieGlow)" /> : null}
          {/* red veins */}
          <path d={`M ${ex - 46} -10 l 18 -4 l 6 6 M ${ex + 44} -30 l -16 4`} stroke="#c0392b" strokeWidth={3} opacity={0.6} />
        </g>
      ))}
      <path d="M -140 -110 L -40 -84 M 140 -110 L 40 -84" stroke="#fff" strokeWidth={14} strokeLinecap="round" />
      <path d="M -60 120 Q 0 96 60 120" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" />
      {/* grey veins creeping up the neck */}
      <path d="M -40 300 q 20 -60 -10 -120 q -20 -40 10 -80 M 30 320 q -20 -70 20 -140" stroke="#7d8a6a" strokeWidth={8} fill="none" opacity={0.4 + grey * 0.5} />
      {/* sweat */}
      {[0, 1, 2].map((k) => {
        const p = ((frame * 0.8 + k * 40) % 120) / 120;
        return <ellipse key={k} cx={170 - k * 40} cy={-200 + p * 260} rx={9} ry={14} fill="#5DB7FF" opacity={0.7 * (1 - p)} />;
      })}
    </g>
  );
  return (
    <g>
      <rect x={-400} y={-400} width={1900} height={2800} fill="#1a2236" />
      <rect x={90} y={300} width={900} height={1320} rx={20} fill="#3a2c22" />
      <clipPath id="lhGlass">
        <rect x={130} y={340} width={820} height={1240} />
      </clipPath>
      <clipPath id="lhShard">
        <polygon points="560,760 950,420 950,1300" />
      </clipPath>
      <g clipPath="url(#lhGlass)">
        <rect x={130} y={340} width={820} height={1240} fill="url(#lhMirror)" />
        {face(0, 0)}
        {/* one shard sits askew */}
        <g clipPath="url(#lhShard)">
          <rect x={130} y={340} width={820} height={1240} fill="url(#lhMirror)" />
          {face(26, -18)}
        </g>
        {/* the green flash lights the glass */}
        <rect x={130} y={340} width={820} height={1240} fill="#9CFF57" opacity={green * 0.12} />
        <path d="M 560 760 L 180 400 M 560 760 L 950 420 M 560 760 L 950 1300 M 560 760 L 300 1580 M 560 760 L 130 1100 M 560 760 L 700 340" stroke="#d8e4f2" strokeWidth={5} opacity={0.8} />
        <path d="M 400 600 L 330 660 M 720 640 L 800 700 M 470 1000 L 400 1080" stroke="#d8e4f2" strokeWidth={3} opacity={0.6} />
        <rect x={130} y={340} width={820} height={1240} fill="#fff" opacity={0.04} />
      </g>
    </g>
  );
};

// The view from the window: the coast road filling with the dead, pouring down toward the gate.
export const HordeRoad: React.FC<{ frame: number; flow: number; fill: number; night: number }> = ({ frame, flow, fill, night }) => {
  // the road comes over the hill at the top left and down to the gate at the bottom right
  const P = (t: number) => ({ x: -300 + t * 1700, y: 700 + t * t * 900 });
  const n = 160;
  return (
    <g>
      <NightSky t={night} frame={frame} moonY={200} />
      <rect x={-1600} y={760} width={5000} height={2400} fill={mix("#3a1c20", "#141828", night)} />
      <path d={`M -400 690 Q 300 640 600 860 Q 1000 1160 1500 1700 L 1900 1700 Q 1300 1100 900 820 Q 500 600 -400 610 Z`} fill={mix("#8a5a48", "#3c4560", night)} />
      {Array.from({ length: n }, (_, i) => {
        const t0 = (i / n + flow * 0.0016 * (0.8 + rand(i + 900) * 0.4)) % 1;
        if (t0 > fill) return null;
        const p = P(t0);
        const sc = 0.12 + t0 * 0.5;
        const lane = (rand(i + 910) - 0.5) * (90 + t0 * 380);
        const bob = Math.abs(Math.sin(frame * 0.3 + i)) * 6 * sc;
        return (
          <g key={i} transform={`translate(${p.x + lane} ${p.y - bob}) scale(${sc})`}>
            <line x1={0} y1={0} x2={0} y2={-200} stroke="#141012" strokeWidth={44} strokeLinecap="round" />
            <circle cx={12} cy={-232} r={34} fill="#141012" />
            <circle cx={6} cy={-238} r={9} fill="#B6FF5C" />
            <circle cx={26} cy={-236} r={8} fill="#B6FF5C" />
            <line x1={0} y1={-170} x2={80} y2={-140 + Math.sin(frame * 0.3 + i) * 12} stroke="#141012" strokeWidth={22} strokeLinecap="round" />
          </g>
        );
      })}
      {/* our fence, close */}
      <rect x={-1600} y={1500} width={5000} height={400} fill="url(#lhMesh)" opacity={0.6} />
    </g>
  );
};

// ================= Part 10: the spiral stair =================
// Switchback flights inside the tower: even flights climb to the right in front of the newel post,
// odd ones climb back to the left behind it.
export const TOWER = { l: 170, r: 1910, cx: 1040, rise: 330, base: 3300, x0: 300, x1: 1780 };
export const stairAt = (u: number) => {
  const { x0, x1, rise, base } = TOWER;
  const k = Math.floor(u);
  const f = u - k;
  const even = k % 2 === 0;
  return { x: even ? x0 + (x1 - x0) * f : x1 - (x1 - x0) * f, y: base - u * rise, flip: !even, front: even, k };
};

const Flight: React.FC<{ k: number; back: boolean }> = ({ k, back }) => {
  const { x0, x1, rise, base } = TOWER;
  const n = 14;
  const even = k % 2 === 0;
  const xa = even ? x0 : x1;
  const xb = even ? x1 : x0;
  const ya = base - k * rise;
  const dx = (xb - xa) / n;
  const pts: string[] = [`${xa},${ya}`];
  for (let i = 0; i < n; i++) {
    const y = ya - ((i + 1) * rise) / n;
    pts.push(`${xa + dx * i},${y}`, `${xa + dx * (i + 1)},${y}`);
  }
  pts.push(`${xb},${ya - rise + 60}`, `${xa},${ya + 60}`);
  return (
    <g>
      <polygon points={pts.join(" ")} fill={back ? "#1a1c26" : "#3a3a46"} />
      <line x1={xa} y1={ya - 4} x2={xb} y2={ya - rise - 4} stroke={back ? "#262938" : "#5c5c6c"} strokeWidth={6} />
      {/* handrail */}
      <line x1={xa} y1={ya - 150} x2={xb} y2={ya - rise - 150} stroke={back ? "#1c1e28" : "#4a3a2c"} strokeWidth={8} />
      {Array.from({ length: 6 }, (_, i) => {
        const t = (i + 0.5) / 6;
        const px = xa + (xb - xa) * t;
        const py = ya - rise * t;
        return <line key={i} x1={px} y1={py - 150} x2={px} y2={py - 10} stroke={back ? "#1c1e28" : "#4a3a2c"} strokeWidth={5} />;
      })}
    </g>
  );
};

export const Stairwell: React.FC<{
  frame: number;
  door: number;
  flights?: number;
  back?: React.ReactNode;
  front?: React.ReactNode;
  floor?: React.ReactNode;
}> = ({ frame, door, flights = 9, back, front, floor }) => {
  const { l, r, cx, rise, base } = TOWER;
  const top = base - flights * rise - 600;
  return (
    <g>
      <rect x={-1200} y={top - 2000} width={4400} height={base - top + 3000} fill="#05060b" />
      <rect x={l} y={top} width={r - l} height={base - top + 400} fill="url(#lhWall)" />
      <rect x={l} y={top} width={r - l} height={base - top + 400} fill="url(#lhBrick)" />
      {/* slit windows with moonlight */}
      {Array.from({ length: flights }, (_, k) => {
        const wx = k % 2 ? 1500 : 560;
        const wy = base - k * rise - 250;
        return (
          <g key={k}>
            <rect x={wx} y={wy} width={34} height={150} rx={14} fill="#5d7bb3" />
            <polygon points={`${wx},${wy} ${wx + 34},${wy} ${wx + 260},${wy + 520} ${wx - 200},${wy + 520}`} fill="#7f9fd8" opacity={0.07} />
          </g>
        );
      })}
      {/* the door at the bottom */}
      <g>
        <rect x={1420} y={base - 290} width={240} height={290} fill="#030406" />
        {door > 0 ? <rect x={1420} y={base - 290} width={240} height={290} fill="#0d1a10" /> : null}
        <g transform={`translate(1420 ${base - 290}) rotate(${-door * 70}) `}>
          <rect x={0} y={0} width={240 * (1 - door * 0.55)} height={290} fill="#3a2618" />
          {[60, 150, 230].map((by) => (
            <rect key={by} x={0} y={by} width={240 * (1 - door * 0.55)} height={14} fill="#22160e" />
          ))}
        </g>
      </g>
      <rect x={l} y={base} width={r - l} height={400} fill="#12131a" />
      {Array.from({ length: flights }, (_, k) => (k % 2 ? <Flight key={k} k={k} back /> : null))}
      {back}
      <rect x={cx - 40} y={top} width={80} height={base - top} fill="#2a2b36" />
      <rect x={cx - 40} y={top} width={22} height={base - top} fill="#3c3d4a" />
      {floor}
      {Array.from({ length: flights }, (_, k) => (k % 2 ? null : <Flight key={k} k={k} back={false} />))}
      {front}
      {/* the tower's outer walls */}
      <rect x={-1200} y={top - 2000} width={l + 1200} height={base - top + 3000} fill="#05060b" />
      <rect x={r} y={top - 2000} width={1300} height={base - top + 3000} fill="#05060b" />
    </g>
  );
};

// Looking straight down the stairwell: the spiral, and the eyes climbing it.
export const WellDown: React.FC<{ frame: number; climb: number; dead: number }> = ({ frame, climb, dead }) => (
  <g>
    <rect x={-400} y={-400} width={1900} height={2800} fill="#020308" />
    {Array.from({ length: 70 }, (_, i) => {
      const a = i * 0.45 + frame * 0.004;
      const r0 = 40 + i * 9.5;
      const r1 = r0 + 70;
      const shade = Math.round(18 + i * 0.9);
      return (
        <line
          key={i}
          x1={540 + Math.cos(a) * r0}
          y1={960 + Math.sin(a) * r0}
          x2={540 + Math.cos(a) * r1}
          y2={960 + Math.sin(a) * r1}
          stroke={`rgb(${shade},${shade},${shade + 14})`}
          strokeWidth={6 + i * 0.5}
        />
      );
    })}
    <circle cx={540} cy={960} r={760} fill="none" stroke="#2a2b36" strokeWidth={60} />
    <circle cx={540} cy={960} r={60} fill="#000" />
    {/* the dead climbing toward us: eyes spiral outward and grow */}
    {Array.from({ length: 34 }, (_, i) => {
      const p = (climb * (0.5 + rand(i + 40) * 0.5) + rand(i + 41)) % 1;
      if (i / 34 > dead) return null;
      const a = i * 2.39 + p * 2.4;
      const r = 70 + p * 560;
      const s = 0.4 + p * 1.4;
      const x = 540 + Math.cos(a) * r;
      const y = 960 + Math.sin(a) * r;
      return (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={0.4 + p * 0.6}>
          <circle r={30} fill="#141812" />
          <g filter="url(#zombieGlow)">
            <circle cx={-10} cy={-2} r={6} fill="#B6FF5C" />
            <circle cx={10} cy={0} r={5} fill="#B6FF5C" />
          </g>
        </g>
      );
    })}
  </g>
);

// ================= Part 10: the lamp room =================
export const LR = { floor: 1500, slab: 70, hatch: { x: 1560, w: 260 }, gen: { x: 150, w: 300 }, lens: { x: 1040, top: 760, bot: 1330, w: 380 }, lever: { x: 1330, y: 1390 }, landing: 2060 };

export const Generator: React.FC<{ frame: number; run: number; sputter: number; hand?: { x: number; y: number } }> = ({ frame, run, sputter, hand }) => {
  const { x, w } = LR.gen;
  const g = LR.floor;
  const shake = run > 0 ? Math.sin(frame * 2.3) * 2.5 : sputter > 0 ? Math.sin(frame * 3.1) * 4 * sputter : 0;
  const port = { x: x + w, y: g - 110 };
  return (
    <g>
      <g transform={`translate(${shake} ${-Math.abs(shake) * 0.5})`}>
        <rect x={x} y={g - 190} width={w} height={160} rx={10} fill="#8a2a1e" />
        <rect x={x + 30} y={g - 250} width={200} height={66} rx={14} fill="#a8382a" />
        <rect x={x + 110} y={g - 268} width={40} height={20} rx={4} fill="#2a2a2a" />
        <rect x={x + 40} y={g - 170} width={150} height={110} rx={8} fill="#2a2a2e" />
        {Array.from({ length: 6 }, (_, i) => (
          <line key={i} x1={x + 54} y1={g - 156 + i * 18} x2={x + 176} y2={g - 156 + i * 18} stroke="#4a4a52" strokeWidth={5} />
        ))}
        <circle cx={x + w - 40} cy={g - 110} r={24} fill="#3a3a40" />
        <circle cx={x + w - 40} cy={g - 110} r={10} fill="#1a1a1e" />
        <rect x={x - 30} y={g - 160} width={40} height={18} fill="#3a3a40" />
        {[x + 30, x + w - 30].map((wx) => (
          <circle key={wx} cx={wx} cy={g - 24} r={24} fill="#1a1a1e" />
        ))}
      </g>
      {/* exhaust */}
      {run > 0 || sputter > 0
        ? Array.from({ length: 6 }, (_, i) => {
            const p = ((frame * (run > 0 ? 0.05 : 0.03) + i / 6) % 1);
            return <circle key={i} cx={x - 40 - p * 120} cy={g - 160 - p * 220} r={14 + p * 50} fill="#8a8f9a" opacity={(run > 0 ? 0.3 : 0.5 * sputter) * (1 - p)} />;
          })
        : null}
      {/* the pull cord */}
      {hand ? <line x1={port.x - 40} y1={port.y} x2={hand.x} y2={hand.y} stroke="#d8d0b8" strokeWidth={4} /> : null}
      {hand ? <rect x={hand.x - 16} y={hand.y - 7} width={32} height={14} rx={6} fill="#111" /> : null}
    </g>
  );
};

export const Lens: React.FC<{ frame: number; lamp: number; rot: number }> = ({ frame, lamp, rot }) => {
  const { x, top, bot, w } = LR.lens;
  const h = bot - top;
  const band = Math.cos((rot * Math.PI) / 180);
  return (
    <g>
      {lamp > 0 ? <circle cx={x} cy={(top + bot) / 2} r={1100} fill="url(#lhGlare)" opacity={0.75 * lamp} /> : null}
      <rect x={x - w / 2} y={top} width={w} height={h} rx={w / 2.4} fill={lamp > 0 ? mix("#55606e", "#fff6d6", lamp) : "#3e4756"} opacity={0.95} />
      {Array.from({ length: 11 }, (_, i) => {
        const y = top + 30 + i * (h - 60) / 10;
        return <line key={i} x1={x - w / 2 + 12} y1={y} x2={x + w / 2 - 12} y2={y} stroke={lamp > 0 ? "#fff" : "#8a97aa"} strokeWidth={6} opacity={0.55} />;
      })}
      {[-0.32, 0, 0.32].map((k) => (
        <line key={k} x1={x + k * w} y1={top + 20} x2={x + k * w} y2={bot - 20} stroke={lamp > 0 ? "#fff" : "#6a7688"} strokeWidth={4} opacity={0.5} />
      ))}
      {/* the bulb, and the beam's bright face rolling across the lens as it turns */}
      <circle cx={x} cy={(top + bot) / 2} r={46} fill={lamp > 0 ? "#fffef4" : "#555d6a"} />
      {lamp > 0 ? <rect x={x - w / 2} y={top} width={w} height={h} rx={w / 2.4} fill="#fff" opacity={lamp * Math.max(0, band) ** 4 * 0.8} /> : null}
      <rect x={x - 150} y={bot} width={300} height={LR.floor - bot} fill="#2a2b32" />
      <rect x={x - 200} y={LR.floor - 50} width={400} height={50} fill="#1e1f26" />
      <rect x={x - 150} y={bot} width={300} height={22} fill="#40414c" />
      {lamp > 0 ? <circle cx={x} cy={(top + bot) / 2} r={60 + Math.sin(frame * 0.6) * 6} fill="#fff" opacity={0.9 * lamp} filter="url(#lhBlur)" /> : null}
    </g>
  );
};

export const Lever: React.FC<{ pull: number }> = ({ pull }) => {
  const { x, y } = LR.lever;
  const a = -55 + pull * 110;
  return (
    <g>
      <rect x={x - 40} y={y - 30} width={80} height={60} rx={8} fill="#3a3b44" />
      <g transform={`translate(${x} ${y}) rotate(${a})`}>
        <rect x={-9} y={-170} width={18} height={170} rx={8} fill="#8a8c96" />
        <circle cx={0} cy={-176} r={22} fill="#c0392b" />
      </g>
      <circle cx={x} cy={y} r={14} fill="#1e1f26" />
    </g>
  );
};
export const leverHand = (pull: number) => {
  const { x, y } = LR.lever;
  const a = ((-55 + pull * 110) * Math.PI) / 180;
  return { x: x + Math.sin(a) * 176, y: y - Math.cos(a) * 176 };
};

// The lamp room. `outside` is drawn through the glass; `below` is the cutaway under the floor (stair top).
export const LampRoom: React.FC<{
  frame: number;
  work: number;
  lamp: number;
  rot: number;
  hatch: number;
  bolt: number;
  tally?: number;
  outside: React.ReactNode;
  below?: React.ReactNode;
  children?: React.ReactNode;
  front?: React.ReactNode;
}> = ({ frame, work, lamp, rot, hatch, bolt, tally = 0, outside, below, children, front }) => {
  const g = LR.floor;
  const { x: hx, w: hw } = LR.hatch;
  const lid = -100 * (1 - hatch);
  const boltX = (1 - bolt) * -46;
  return (
    <g>
      {/* glass walls */}
      <clipPath id="lhGlassWall">
        <rect x={-300} y={380} width={2700} height={800} />
      </clipPath>
      <g clipPath="url(#lhGlassWall)">{outside}</g>
      <rect x={-300} y={380} width={2700} height={800} fill="#9fc0ff" opacity={0.04} />
      {Array.from({ length: 13 }, (_, i) => (
        <line key={i} x1={-260 + i * 220} y1={380} x2={-260 + i * 220} y2={1180} stroke="#14161e" strokeWidth={22} />
      ))}
      <line x1={-300} y1={780} x2={2400} y2={780} stroke="#14161e" strokeWidth={14} />
      {/* reflections on the glass */}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={-200 + i * 440} y1={420} x2={-80 + i * 440} y2={740} stroke="#fff" strokeWidth={10} opacity={0.05 + lamp * 0.08} />
      ))}
      {/* the dome */}
      <rect x={-1200} y={-1600} width={4600} height={1980} fill="#0d0f16" />
      <path d="M -300 380 Q 1040 120 2400 380" stroke="#1c1f2a" strokeWidth={30} fill="none" />
      {Array.from({ length: 24 }, (_, i) => (
        <circle key={i} cx={-260 + i * 120} cy={360} r={6} fill="#2a2d3a" />
      ))}
      {/* the iron wall under the glass */}
      <rect x={-1200} y={1180} width={4600} height={g - 1180} fill="#24181c" />
      <rect x={-1200} y={1180} width={4600} height={18} fill="#3a262a" />
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={-260 + i * 100} cy={1214} r={5} fill="#3a2a2e" />
      ))}
      {/* chalk tally: one mark for every night */}
      {Array.from({ length: Math.floor(tally) }, (_, i) => {
        const grp = Math.floor(i / 5);
        const k = i % 5;
        const tx = 1880 + (grp % 4) * 90 + k * 14;
        const ty = 1260 + Math.floor(grp / 4) * 80;
        return k === 4 ? (
          <line key={i} x1={tx - 66} y1={ty + 48} x2={tx - 2} y2={ty + 6} stroke="#e8e4d8" strokeWidth={5} opacity={0.85} />
        ) : (
          <line key={i} x1={tx} y1={ty} x2={tx + 2} y2={ty + 56} stroke="#e8e4d8" strokeWidth={5} opacity={0.85} />
        );
      })}
      {/* caged work lamps */}
      {[460, 1680].map((lx, i) => {
        const on = work * (i ? 1 : 0.9);
        return (
          <g key={lx}>
            {on > 0 ? <circle cx={lx} cy={1240} r={420} fill="url(#lhWarm)" opacity={on} /> : null}
            <circle cx={lx} cy={1240} r={20} fill={on > 0.3 ? "#ffe2a0" : "#3a3a3a"} />
            <path d={`M ${lx - 24} 1240 Q ${lx} 1200 ${lx + 24} 1240 Q ${lx} 1280 ${lx - 24} 1240`} stroke="#555" strokeWidth={4} fill="none" />
          </g>
        );
      })}
      <Lens frame={frame} lamp={lamp} rot={rot} />
      {children}
      {/* the floor, with the hatch */}
      <rect x={-1200} y={g} width={hx + 1200} height={LR.slab} fill="#2e2a2c" />
      <rect x={hx + hw} y={g} width={3000} height={LR.slab} fill="#2e2a2c" />
      <line x1={-1200} y1={g + 2} x2={3400} y2={g + 2} stroke="#4a4446" strokeWidth={5} />
      {/* the cutaway below the floor: the top of the stair */}
      <clipPath id="lhBelow">
        <rect x={-1200} y={g + LR.slab} width={4600} height={1600} />
      </clipPath>
      <g clipPath="url(#lhBelow)">
        <rect x={-1200} y={g + LR.slab} width={4600} height={1600} fill="url(#lhWall)" />
        <rect x={-1200} y={g + LR.slab} width={4600} height={1600} fill="url(#lhBrick)" />
        <rect x={hx} y={g + LR.slab} width={hw} height={30} fill="#7f9fd8" opacity={hatch < 1 ? 0.12 : 0} />
        {/* the landing and the flight going down */}
        <rect x={1400} y={LR.landing} width={700} height={60} fill="#3a3a46" />
        <polygon points={`1400,${LR.landing} 200,${LR.landing + 460} 200,${LR.landing + 540} 1400,${LR.landing + 60}`} fill="#3a3a46" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={1400 - i * 100} y1={LR.landing + (i * 460) / 12} x2={1400 - (i + 1) * 100} y2={LR.landing + (i * 460) / 12} stroke="#5c5c6c" strokeWidth={6} />
        ))}
        {/* ladder */}
        {[hx + 70, hx + 190].map((lx) => (
          <line key={lx} x1={lx} y1={g + LR.slab} x2={lx} y2={LR.landing} stroke="#5a4a3a" strokeWidth={12} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1={hx + 70} y1={g + 120 + i * 66} x2={hx + 190} y2={g + 120 + i * 66} stroke="#5a4a3a" strokeWidth={10} />
        ))}
        {below}
      </g>
      {/* the lid, hinged at the left edge of the hatch */}
      <g transform={`translate(${hx} ${g}) rotate(${lid})`}>
        <rect x={0} y={-24} width={hw} height={24} fill="#5a3e28" />
        {[60, 140, 210].map((px) => (
          <line key={px} x1={px} y1={-24} x2={px} y2={0} stroke="#3a2618" strokeWidth={4} />
        ))}
        <rect x={hw - 100} y={-36} width={60} height={14} rx={3} fill="#8a8c96" />
        <rect x={hw - 92 - boltX} y={-34} width={70} height={10} rx={3} fill="#b5b8c2" />
        <circle cx={hw - 60 - boltX} cy={-40} r={7} fill="#b5b8c2" />
      </g>
      <rect x={hx + hw + 10} y={g - 40} width={24} height={40} fill="#6a6c76" />
      {front}
    </g>
  );
};

// What the lamp room sees through its glass: the night coast, with the beam sweeping across it.
export const GlassView: React.FC<{ frame: number; lamp: number; rot: number; moonY?: number }> = ({ frame, lamp, rot, moonY = 520 }) => {
  const a = (rot * Math.PI) / 180;
  const bx = 1040 + Math.cos(a) * 1500;
  return (
    <g>
      <NightSky t={1} frame={frame} moonY={moonY} />
      <Sea frame={frame} night={1} horizon={1000} />
      <path d="M -300 1002 L -300 960 Q 200 930 600 975 Q 900 990 1300 1002 Z" fill="#04060c" />
      {lamp > 0 && Math.sin(a) < 0.2 ? (
        <polygon points={`1040,900 ${bx - 260},${980} ${bx + 260},${1040}`} fill="#fff2b8" opacity={0.25 * lamp} style={{ mixBlendMode: "screen" }} />
      ) : null}
    </g>
  );
};

// The handwritten note on the back of the road map
export const NOTE_LINES = ["Mia,", "If you're reading this,", "I didn't make it.", "Keep the light on.", "Someone will see it.", "- Kai"];
export const Note: React.FC<{ frame: number; reveal: number; tears: number[]; shake: number }> = ({ frame, reveal, tears, shake }) => {
  const sx = Math.sin(frame * 0.9) * shake;
  const sy = Math.cos(frame * 0.7) * shake;
  return (
    <g>
      <rect x={-400} y={-400} width={1900} height={2800} fill="#0c0d14" />
      <g transform={`translate(${sx} ${sy}) rotate(-3 540 960)`}>
        <rect x={90} y={360} width={900} height={1200} fill="#e6dcc2" />
        {/* the map printed on the other side shows through */}
        <g opacity={0.12} transform="translate(1080 0) scale(-1 1)">
          <path d="M 1000 360 L 860 360 C 820 500 900 600 840 700 S 880 900 800 1020 S 900 1300 840 1560 L 1000 1560 Z" fill="#4a6a8a" />
          <path d="M 90 1300 L 990 1180 M 200 360 L 380 1560 M 90 760 Q 500 820 820 700" stroke="#8a4a2a" strokeWidth={10} fill="none" />
        </g>
        {[1, 2].map((i) => (
          <rect key={i} x={90 + i * 300} y={360} width={4} height={1200} fill="#c9bea4" />
        ))}
        {[1, 2].map((i) => (
          <rect key={i} x={90} y={360 + i * 400} width={900} height={4} fill="#c9bea4" />
        ))}
        <clipPath id="lhInk">
          <rect x={0} y={0} width={1080} height={420 + reveal * 1140} />
        </clipPath>
        <g clipPath="url(#lhInk)">
          {NOTE_LINES.map((t, i) => (
            <text
              key={i}
              x={i === 5 ? 880 : 150}
              y={520 + i * 165 + (i === 5 ? 40 : 0)}
              textAnchor={i === 5 ? "end" : "start"}
              fontFamily='"Ink Free", "Segoe Print", "Comic Sans MS", cursive'
              fontSize={i === 0 || i === 5 ? 74 : 66}
              fontWeight={700}
              fill="#1d2a4a"
              transform={`rotate(${(rand(i + 5) - 0.5) * 3} 540 ${520 + i * 165})`}
            >
              {t}
            </text>
          ))}
        </g>
        {/* tears blot the ink */}
        {tears.map((t, i) =>
          t > 0 ? (
            <g key={i}>
              <circle cx={300 + rand(i + 600) * 500} cy={700 + rand(i + 610) * 700} r={14 + 22 * Math.min(1, t * 3)} fill="#b9ae92" opacity={0.6} />
              <circle cx={300 + rand(i + 600) * 500} cy={700 + rand(i + 610) * 700} r={8 + 14 * Math.min(1, t * 3)} fill="#a89e84" opacity={0.5} />
            </g>
          ) : null,
        )}
        {/* her thumbs holding it */}
        <ellipse cx={110} cy={1180} rx={60} ry={110} fill="#111" />
        <ellipse cx={970} cy={1120} rx={60} ry={110} fill="#111" />
      </g>
    </g>
  );
};

// A falling tear (for the note): returns 0 before it lands, then grows 0..1
export const tearAt = (s: number, at: number) => (s < at ? 0 : Math.min(1, (s - at) / 20));

// ================= Part 10: the rocks under the beam =================
// The dead stand on the rocks at the foot of the tower. `beamX` is where the sweeping beam crosses them.
export const ROCKS = { y: 1340, kai: { x: 830, y: 1380 } };
export const Rocks: React.FC<{ frame: number; beamX: number; beam: number; children?: (lit: boolean) => React.ReactNode }> = ({ frame, beamX, beam, children }) => {
  const rocks = `M -400 1500 L -200 1360 L 0 1400 L 140 1320 L 300 1390 L 460 1330 L 640 1400 L 780 1370 L 900 1300 L 1060 1380 L 1200 1340 L 1500 1420 L 1500 2400 L -400 2400 Z`;
  const beamPoly = `${1260},-900 ${beamX - 240},2400 ${beamX + 240},2400`;
  return (
    <g>
      <NightSky t={1} frame={frame} moonY={330} />
      <Sea frame={frame} night={1} horizon={1050} />
      {/* foam on the rocks */}
      {Array.from({ length: 10 }, (_, i) => {
        const p = ((frame * 0.02 + i / 10) % 1);
        return <ellipse key={i} cx={-300 + i * 180} cy={1330 + (i % 3) * 30} rx={80 + p * 60} ry={14} fill="#c8d6ec" opacity={0.25 * (1 - p)} />;
      })}
      {/* the base of the tower, top right */}
      <polygon points="1060,-900 1500,-900 1500,1360 1120,1360" fill="#141a28" />
      <polygon points="1060,-900 1120,1360 1160,1360 1100,-900" fill="#1e2638" />
      <defs>
        <clipPath id="lhLit">
          <polygon points={beamPoly} />
        </clipPath>
      </defs>
      <path d={rocks} fill="#0b0e17" />
      {children?.(false)}
      {beam > 0 ? (
        <g opacity={beam}>
          <polygon points={beamPoly} fill="#fff2b8" opacity={0.14} style={{ mixBlendMode: "screen" }} />
          <g clipPath="url(#lhLit)">
            <path d={rocks} fill="#3a3f52" />
            {children?.(true)}
          </g>
        </g>
      ) : null}
    </g>
  );
};
