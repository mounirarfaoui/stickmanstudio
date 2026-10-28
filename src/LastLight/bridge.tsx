import React from "react";
import { GAITS, lerpPose, Pose, POSES, skeleton, Skeleton, walkPose } from "../shared/rig";
import { Car } from "./sets";
import { rand } from "./world";

// ================= Parts 7–8: the bridge north, and the tollbooth beyond it =================

// The bridge is a long steel truss seen from the side. World units: the deck top is at BRIDGE.deck,
// the bridge runs from BRIDGE.start to BRIDGE.end. Cars stand on the deck facing north (+x).
export const BRIDGE = { deck: 1500, start: 600, end: 10600, top: 740, horizon: 1380 };

// Top surface of a `Car` (from sets.tsx) at local offset u, relative to its ground line
const CAR_TOP: [number, number][] = [
  [10, -150],
  [60, -176],
  [140, -180],
  [200, -262],
  [240, -272],
  [380, -272],
  [420, -250],
  [466, -182],
  [530, -172],
  [556, -140],
];
export const carTop = (u: number) => {
  if (u <= CAR_TOP[0][0]) return CAR_TOP[0][1];
  for (let i = 1; i < CAR_TOP.length; i++) {
    const [u1, y1] = CAR_TOP[i];
    const [u0, y0] = CAR_TOP[i - 1];
    if (u <= u1) return y0 + ((y1 - y0) * (u - u0)) / (u1 - u0);
  }
  return CAR_TOP[CAR_TOP.length - 1][1];
};

// The sky over the river: blood-orange dusk fading to night (t 0..1). Drawn in its own parallax layer.
export const DuskSky: React.FC<{ t: number; frame: number; cx: number }> = ({ t, frame, cx }) => (
  <g transform={`translate(${cx} 0)`}>
    <rect x={-3000} y={-2600} width={6000} height={4400} fill="url(#bridgeSky)" />
    <rect x={-3000} y={-2600} width={6000} height={4400} fill="#070a1c" opacity={0.88 * t} />
    {/* the low sun sinking behind the far shore */}
    <circle cx={260} cy={BRIDGE.horizon - 120 + t * 260} r={170} fill="#ff6a2a" opacity={0.85 * (1 - t)} />
    <circle cx={260} cy={BRIDGE.horizon - 120 + t * 260} r={420} fill="#ff6a2a" opacity={0.18 * (1 - t)} filter="url(#soft)" />
    {Array.from({ length: 80 }, (_, i) => (
      <circle
        key={i}
        cx={-1400 + rand(i + 3300) * 2800}
        cy={-900 + rand(i + 3400) * 1900}
        r={1.5 + rand(i + 3500) * 2.2}
        fill="#fff"
        opacity={Math.max(0, t - 0.25) * (0.5 + 0.5 * Math.abs(Math.sin(frame * 0.05 + i)))}
      />
    ))}
    <circle cx={-380} cy={420} r={66} fill="#f3ecd7" opacity={Math.max(0, t - 0.2) * 1.1} />
    <circle cx={-380} cy={420} r={170} fill="#f3ecd7" opacity={0.1 * t} filter="url(#soft)" />
    {/* long drifting cloud bands */}
    {Array.from({ length: 7 }, (_, i) => {
      const x = ((rand(i + 3600) * 3000 + frame * (0.6 + (i % 3) * 0.4)) % 3400) - 1700;
      return (
        <ellipse
          key={i}
          cx={x}
          cy={-200 + rand(i + 3610) * 1300}
          rx={360 + rand(i + 3620) * 260}
          ry={34 + rand(i + 3630) * 30}
          fill={t > 0.5 ? "#1a1d33" : "#5a1a26"}
          opacity={0.55}
          filter="url(#soft)"
        />
      );
    })}
  </g>
);

// The far shore and the river far below. `cx` is the camera x; distant layers move slower.
const FarShore: React.FC<{ t: number; frame: number; cx: number }> = ({ t, frame, cx }) => {
  const h = BRIDGE.horizon;
  return (
    <g>
      <g transform={`translate(${cx * 0.85} 0)`}>
        {/* a burning city across the water */}
        {Array.from({ length: 26 }, (_, i) => {
          const bx = -2600 + i * 200 + rand(i + 3700) * 60;
          const bh = 60 + rand(i + 3710) * 220;
          const fire = rand(i + 3720) > 0.78;
          return (
            <g key={i}>
              <rect x={bx} y={h - bh} width={150 + rand(i + 3730) * 60} height={bh} fill={t > 0.5 ? "#0d0f1e" : "#2a0f18"} />
              {fire ? (
                <ellipse cx={bx + 80} cy={h - bh} rx={60 + Math.sin(frame * 0.3 + i) * 8} ry={36 + Math.sin(frame * 0.4 + i) * 6} fill="#ff7a2d" opacity={0.55} filter="url(#soft)" />
              ) : null}
              {fire ? <path d={`M ${bx + 60} ${h - bh} q -40 -200 30 -420`} stroke="#2a1a1c" strokeWidth={30} opacity={0.35} fill="none" filter="url(#soft)" /> : null}
            </g>
          );
        })}
        <path d={`M -3000 ${h} Q -1800 ${h - 90} -800 ${h - 30} Q 200 ${h - 120} 1200 ${h - 20} Q 2200 ${h - 100} 3200 ${h} Z`} fill={t > 0.5 ? "#0a0b18" : "#22101a"} />
      </g>
      {/* the river */}
      <rect x={-3000 + cx} y={h} width={6000} height={2400} fill="#100914" />
      <g transform={`translate(${cx * 0.6} 0)`}>
        {Array.from({ length: 40 }, (_, i) => {
          const ry = h + 20 + rand(i + 3800) * 900;
          const rx = -2600 + rand(i + 3810) * 5200 + Math.sin(frame * 0.05 + i) * 30;
          return <rect key={i} x={rx} y={ry} width={60 + rand(i + 3820) * 200} height={4} rx={2} fill={t > 0.6 ? "#c9d4ff" : "#ff8a4a"} opacity={0.12 + 0.12 * Math.abs(Math.sin(frame * 0.08 + i))} />;
        })}
      </g>
    </g>
  );
};

// The far truss, deck and piers, the dead lamp posts
const Truss: React.FC<{ frame: number; t: number }> = ({ frame, t }) => {
  const { deck, start, end, top } = BRIDGE;
  const col = t > 0.5 ? "#151320" : "#2a1418";
  const bay = 400;
  const n = Math.floor((end - start) / bay);
  return (
    <g>
      {/* piers down into the water */}
      {Array.from({ length: Math.floor((end - start) / 1600) + 1 }, (_, i) => (
        <rect key={i} x={start + 200 + i * 1600} y={deck + 140} width={150} height={1600} fill={col} />
      ))}
      {/* truss: top chord, verticals, diagonals */}
      <g stroke={col} strokeLinecap="square">
        <line x1={start} y1={top} x2={end} y2={top} strokeWidth={34} />
        {Array.from({ length: n + 1 }, (_, i) => {
          const x = start + i * bay;
          return (
            <g key={i}>
              <line x1={x} y1={top} x2={x} y2={deck} strokeWidth={22} />
              {i < n ? <line x1={x} y1={i % 2 ? top : deck} x2={x + bay} y2={i % 2 ? deck : top} strokeWidth={16} /> : null}
              {i < n ? <line x1={x} y1={top + 60} x2={x + bay} y2={top + 60} strokeWidth={8} /> : null}
            </g>
          );
        })}
        {/* end portals */}
        <line x1={start} y1={top} x2={start - 260} y2={deck} strokeWidth={34} />
        <line x1={end} y1={top} x2={end + 260} y2={deck} strokeWidth={34} />
      </g>
      {/* rivets catching the last light */}
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={start + i * bay + 200} cy={top} r={5} fill="#ff9a5a" opacity={0.35 * (1 - t)} />
      ))}
      {/* dead lamp posts on the far side; one still flickers */}
      {Array.from({ length: Math.floor((end - start) / 1300) }, (_, i) => {
        const lx = start + 500 + i * 1300;
        const on = i === 3 ? (Math.sin(frame * 0.9) * Math.sin(frame * 0.23) > 0.2 ? 1 : 0.1) : 0;
        return (
          <g key={i}>
            <rect x={lx} y={deck - 640} width={12} height={640} fill="#0d0b12" />
            <path d={`M ${lx + 6} ${deck - 636} q 30 -40 90 -30`} stroke="#0d0b12" strokeWidth={10} fill="none" />
            <rect x={lx + 80} y={deck - 676} width={46} height={16} rx={6} fill="#0d0b12" />
            {on > 0 ? (
              <g opacity={on}>
                <circle cx={lx + 103} cy={deck - 660} r={10} fill="#ffe7b0" />
                <ellipse cx={lx + 103} cy={deck - 380} rx={260} ry={420} fill="url(#lampGlow)" />
              </g>
            ) : null}
          </g>
        );
      })}
      {/* the deck slab and the girder under it */}
      <rect x={start - 2600} y={deck} width={end - start + 5200} height={60} fill="#1d1519" />
      <rect x={start} y={deck + 60} width={end - start} height={80} fill="#120d12" />
      {Array.from({ length: Math.floor((end - start) / 120) }, (_, i) => (
        <rect key={i} x={start + i * 120} y={deck + 70} width={10} height={60} fill="#1d1519" />
      ))}
      {/* the approach roads at either end sit on solid ground */}
      <rect x={start - 2600} y={deck + 60} width={2600} height={2000} fill="#0e0b10" />
      <rect x={end} y={deck + 60} width={3200} height={2000} fill="#0e0b10" />
    </g>
  );
};

// The near railing, drawn over everything on the deck. `broken` [x0, x1] leaves a mangled gap.
const Railing: React.FC<{ broken?: [number, number] }> = ({ broken }) => {
  const { deck, start, end } = BRIDGE;
  const col = "#20161a";
  const inGap = (x: number) => broken && x > broken[0] && x < broken[1];
  const segs: [number, number][] = broken ? [[start - 200, broken[0]], [broken[1], end + 200]] : [[start - 200, end + 200]];
  return (
    <g>
      {segs.map(([a, b]) => (
        <g key={a}>
          <rect x={a} y={deck - 100} width={b - a} height={14} fill={col} />
          <rect x={a} y={deck - 52} width={b - a} height={10} fill={col} />
        </g>
      ))}
      {Array.from({ length: Math.floor((end - start + 400) / 110) }, (_, i) => {
        const x = start - 200 + i * 110;
        return inGap(x) ? null : <rect key={i} x={x} y={deck - 100} width={12} height={100} fill={col} />;
      })}
      {broken ? (
        <g stroke={col} strokeWidth={14} fill="none" strokeLinecap="round">
          {/* the rail torn and bent outward where the truck hit it */}
          <path d={`M ${broken[0]} ${deck - 93} q 80 30 140 120`} />
          <path d={`M ${broken[1]} ${deck - 93} q -60 50 -90 150`} />
          <path d={`M ${broken[0]} ${deck - 47} q 40 40 60 90`} strokeWidth={10} />
        </g>
      ) : null}
    </g>
  );
};

export const Bridge: React.FC<{
  frame: number;
  // 0 = dusk, 1 = night
  t: number;
  // camera focus x (drives the parallax of the sky, shore and river)
  cx: number;
  broken?: [number, number];
  children?: React.ReactNode;
  front?: React.ReactNode;
}> = ({ frame, t, cx, broken, children, front }) => (
  <g>
    <DuskSky t={t} frame={frame} cx={cx * 0.97} />
    <FarShore t={t} frame={frame} cx={cx} />
    <Truss frame={frame} t={t} />
    {children}
    <Railing broken={broken} />
    {front}
  </g>
);

// The far lane: a dark row of abandoned cars behind the one Kai and Mia cross on
export const FarLane: React.FC<{ from: number; to: number; skip?: [number, number] }> = ({ from, to, skip }) => {
  const cols = ["#2a2228", "#22262c", "#2c2420", "#262028"];
  const cars: number[] = [];
  for (let x = from; x < to; x += 600 + Math.round(rand(x) * 160)) if (!skip || x + 520 < skip[0] || x > skip[1]) cars.push(x);
  return (
    <g transform={`translate(0 ${-34})`}>
      {cars.map((x, i) => (
        <g key={x} transform={`translate(${x} ${BRIDGE.deck}) scale(0.9) translate(${-x} ${-BRIDGE.deck})`}>
          <Car x={x} y={BRIDGE.deck} color={cols[i % cols.length]} />
        </g>
      ))}
    </g>
  );
};

// A near-lane car with the dusk catching its roof, a smashed window and a few dents
export const WreckCar: React.FC<{ x: number; color: string; seed: number; dent?: number }> = ({ x, color, seed, dent = 0 }) => {
  const y = BRIDGE.deck;
  return (
    <g>
      <Car x={x} y={y} color={color} />
      {/* rim light along the roof */}
      <path d={`M ${x + 200} ${y - 266} L ${x + 240} ${y - 270} L ${x + 380} ${y - 270} L ${x + 420} ${y - 248}`} stroke="#ff9a5a" strokeWidth={5} fill="none" opacity={0.45} />
      {/* a smashed window */}
      {rand(seed) > 0.4 ? (
        <g stroke="#c9d4e0" strokeWidth={2} opacity={0.5} fill="none">
          <path d={`M ${x + 340} ${y - 220} l -20 -26 M ${x + 340} ${y - 220} l 30 -18 M ${x + 340} ${y - 220} l 8 30 M ${x + 340} ${y - 220} l -30 14`} />
        </g>
      ) : null}
      {/* the roof dents where someone lands */}
      {dent > 0 ? <path d={`M ${x + 270} ${y - 272} q 40 ${dent * 14} 80 0`} fill="#0a0a0d" opacity={0.6} /> : null}
    </g>
  );
};

// A school bus, slewed across the lanes and tipped up on the wreck under its back end.
// `x` is its rear bumper; its roof is the platform Kai has to reach. `tilt` in degrees (nose down).
export const BUS = { len: 1240, roof: -440, tilt: 5 };
export const busRoofY = (x0: number, x: number) => {
  // world y of the roof's top edge at world x (the body is rotated by `tilt` about its raised rear-bottom corner)
  const a = (BUS.tilt * Math.PI) / 180;
  return BRIDGE.deck - 120 + (x - x0) * Math.sin(a) + (BUS.roof + 120) * Math.cos(a);
};
export const Bus: React.FC<{ x: number; frame: number; children?: React.ReactNode }> = ({ x, frame, children }) => {
  const y = BRIDGE.deck;
  const L = BUS.len;
  const H = -BUS.roof;
  return (
    <g>
      {/* the crushed car the back end sits on */}
      <g transform={`translate(${x + 300} ${y}) scale(0.9 0.55) translate(${-(x + 300)} ${-y})`}>
        <Car x={x + 300} y={y} color="#2a2228" />
      </g>
      <g transform={`rotate(${BUS.tilt} ${x} ${y - 120})`}>
        <g transform={`translate(${x} ${y - 120})`}>
          <rect x={0} y={-H + 120} width={L} height={H - 30} rx={22} fill="#b8862a" />
          <rect x={0} y={-H + 120} width={L} height={26} rx={12} fill="#d6a23e" />
          {/* windows, with the dead pressed against some of them */}
          {Array.from({ length: 9 }, (_, i) => {
            const wx = 90 + i * 118;
            const occupied = rand(i + 4000) > 0.45;
            return (
              <g key={i}>
                <rect x={wx} y={-H + 170} width={92} height={110} rx={8} fill="#0b0c10" />
                {occupied ? (
                  <g>
                    <circle cx={wx + 46 + Math.sin(frame * 0.2 + i) * 6} cy={-H + 230} r={26} fill="#3f473b" />
                    <circle cx={wx + 38 + Math.sin(frame * 0.2 + i) * 6} cy={-H + 226} r={5} fill="#B6FF5C" filter="url(#zombieGlow)" />
                    <circle cx={wx + 56 + Math.sin(frame * 0.2 + i) * 6} cy={-H + 228} r={4} fill="#B6FF5C" filter="url(#zombieGlow)" />
                    {rand(i + 4010) > 0.5 ? <ellipse cx={wx + 20} cy={-H + 200 + Math.sin(frame * 0.5 + i) * 4} rx={12} ry={16} fill="#56604f" /> : null}
                  </g>
                ) : null}
                <polygon points={`${wx + 8},${-H + 176} ${wx + 30},${-H + 176} ${wx + 8},${-H + 220}`} fill="#ff9a5a" opacity={0.18} />
              </g>
            );
          })}
          <rect x={0} y={-H + 300} width={L} height={14} fill="#1a1410" />
          <text x={L / 2} y={-H + 380} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={64} letterSpacing={8} fill="#1a1410" opacity={0.85}>
            SCHOOL BUS
          </text>
          <rect x={L - 30} y={-H + 200} width={30} height={60} rx={6} fill="#5a1a14" />
          {[200, L - 230].map((wx) => (
            <g key={wx}>
              <circle cx={wx} cy={60} r={62} fill="#0a0a0d" />
              <circle cx={wx} cy={60} r={26} fill="#3b3e45" />
            </g>
          ))}
          {/* rim light on the roof edge */}
          <rect x={10} y={-H + 120} width={L - 20} height={6} fill="#ffb07a" opacity={0.5} />
        </g>
      </g>
      {children}
    </g>
  );
};

// Highway sign at the bridge approach
export const HighwaySign: React.FC<{ x: number; frame: number; top?: number }> = ({ x, frame, top = BRIDGE.deck - 1140 }) => {
  const y = top + 1140;
  const sway = Math.sin(frame * 0.12) * 1.2;
  return (
    <g>
      <rect x={x - 8} y={y - 980} width={20} height={BRIDGE.deck - y + 980} fill="#141218" />
      <rect x={x + 560} y={y - 980} width={20} height={BRIDGE.deck - y + 980} fill="#141218" />
      <g transform={`rotate(${sway} ${x + 290} ${y - 980})`}>
        <rect x={x - 40} y={y - 1140} width={660} height={300} rx={18} fill="#1d5a3a" stroke="#e8e8e8" strokeWidth={8} />
        <text x={x + 290} y={y - 1060} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={64} fill="#f2f2f2">
          NORTH ↑
        </text>
        <text x={x + 290} y={y - 970} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={72} fill="#f2f2f2">
          GULL POINT 50
        </text>
        <text x={x + 290} y={y - 885} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize={40} fill="#cfe8d8">
          BRIDGE AHEAD
        </text>
        {/* bullet holes */}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={x + 60 + i * 210 + rand(i + 4100) * 60} cy={y - 1100 + rand(i + 4110) * 180} r={7} fill="#0a0a0a" />
        ))}
      </g>
    </g>
  );
};

// A grey-green dead arm reaching up from below; `close` 0..1 curls the fingers into a grip.
// Drawn with the wrist at (x, y) and the arm hanging down out of frame; `angle` tilts it (degrees).
export const GraspHand: React.FC<{ x: number; y: number; scale?: number; close: number; angle?: number; frame: number; arm?: number }> = ({ x, y, scale = 1, close, angle = 0, frame, arm = 600 }) => {
  const skin = "#56604f";
  const dark = "#3a4236";
  const twitch = Math.sin(frame * 1.3) * 3 * (1 - close);
  const finger = (fx: number, len: number, spread: number, i: number) => {
    const a1 = spread + close * (70 + i * 4);
    const r1 = (a1 * Math.PI) / 180;
    const mx = fx + Math.sin(r1) * len * 0.55;
    const my = -30 - Math.cos(r1) * len * 0.55;
    const r2 = ((a1 + close * 70) * Math.PI) / 180;
    return (
      <polyline
        key={i}
        points={`${fx},-30 ${mx},${my} ${mx + Math.sin(r2) * len * 0.45},${my - Math.cos(r2) * len * 0.45}`}
        stroke={skin}
        strokeWidth={15}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    );
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle + twitch}) scale(${scale})`}>
      <rect x={-22} y={0} width={44} height={arm} rx={20} fill={skin} />
      <rect x={-22} y={120} width={44} height={50} fill={dark} opacity={0.6} />
      <ellipse cx={0} cy={-14} rx={36} ry={34} fill={skin} />
      {finger(-26, 64, -18, 0)}
      {finger(-9, 74, -6, 1)}
      {finger(9, 72, 6, 2)}
      {finger(25, 60, 16, 3)}
      <polyline points={`30,-6 ${56 - close * 30},-30 ${60 - close * 50},${-56 + close * 10}`} stroke={skin} strokeWidth={15} strokeLinecap="round" fill="none" />
      {/* torn nails */}
      <ellipse cx={-6} cy={6} rx={10} ry={6} fill={dark} opacity={0.6} />
    </g>
  );
};

// Shards of glass scattered on the deck
export const Shards: React.FC<{ x: number; w: number; y: number; t: number }> = ({ x, w, y, t }) => (
  <g>
    {Array.from({ length: 18 }, (_, i) => {
      const sx = x + rand(i + 4200) * w;
      const s = 6 + rand(i + 4210) * 12;
      return (
        <polygon
          key={i}
          points={`${sx},${y} ${sx + s},${y - s * 0.4} ${sx + s * 0.4},${y - s}`}
          fill={t > 0.5 ? "#9fb4d0" : "#ffb07a"}
          opacity={0.45 + 0.4 * rand(i + 4220)}
        />
      );
    })}
  </g>
);

// The cut leash: a red strap with a clip, and a frayed, sliced end
export const Leash: React.FC<{ x: number; y: number; angle?: number; scale?: number; sway?: number }> = ({ x, y, angle = 0, scale = 1, sway = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
    <path d={`M 0 0 q ${20 + sway} 60 ${-6 + sway * 2} 130 q ${-14 - sway} 40 ${4 + sway} 80`} stroke="#c8352f" strokeWidth={12} fill="none" strokeLinecap="butt" />
    {/* the loop handle at the top */}
    <ellipse cx={0} cy={-26} rx={18} ry={28} stroke="#c8352f" strokeWidth={10} fill="none" />
    {/* frayed cut end */}
    <g transform={`translate(${-2 + sway * 3} 210)`} stroke="#e86a5a" strokeWidth={3}>
      <line x1={-5} y1={0} x2={-9} y2={14} />
      <line x1={0} y1={0} x2={1} y2={16} />
      <line x1={5} y1={0} x2={10} y2={12} />
    </g>
  </g>
);

// Wade's hat, lost on the road
export const LostHat: React.FC<{ x: number; y: number; angle?: number }> = ({ x, y, angle = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <ellipse cx={0} cy={-6} rx={56} ry={9} fill="#6b4a2c" />
    <path d="M -28 -8 Q -26 -46 0 -44 Q 26 -46 28 -8 Z" fill="#6b4a2c" />
    <rect x={-28} y={-16} width={56} height={8} fill="#3a2414" />
  </g>
);

// ================= Part 8: the toll plaza past the end of the bridge =================
export const TOLL = { ground: 1500, booth: { x: 1200, w: 420, top: 1000 }, canopy: { x: 600, w: 1800, y: 760 } };

// Outside: the plaza at night (or dawn, t: 0 night .. 1 dawn)
export const TollPlaza: React.FC<{ frame: number; dawn: number; door: number; glow: number; children?: React.ReactNode; front?: React.ReactNode }> = ({
  frame,
  dawn,
  door,
  glow,
  children,
  front,
}) => {
  const { ground, booth, canopy } = TOLL;
  return (
    <g>
      <rect x={-3000} y={-2000} width={8000} height={ground + 2000} fill="url(#dawnSky)" opacity={dawn} />
      <rect x={-3000} y={-2000} width={8000} height={ground + 2000} fill="#070a1c" opacity={1 - dawn} />
      {Array.from({ length: 60 }, (_, i) => (
        <circle key={i} cx={-1200 + rand(i + 4300) * 4400} cy={-200 + rand(i + 4310) * 1200} r={1.5 + rand(i + 4320) * 2} fill="#fff" opacity={(1 - dawn) * (0.4 + 0.6 * Math.abs(Math.sin(frame * 0.05 + i)))} />
      ))}
      {/* the bridge behind, a dark truss silhouette on the left */}
      <g stroke={dawn > 0.5 ? "#3a2a3a" : "#14121e"} strokeWidth={18}>
        <line x1={-2400} y1={760} x2={-500} y2={760} />
        <line x1={-500} y1={760} x2={-200} y2={ground} />
        {Array.from({ length: 6 }, (_, i) => (
          <line key={i} x1={-2400 + i * 380} y1={760} x2={-2400 + i * 380 + (i % 2 ? 380 : 0)} y2={ground} />
        ))}
      </g>
      {/* low hills */}
      <path d={`M -3000 ${ground - 80} Q -1000 ${ground - 260} 600 ${ground - 120} Q 2200 ${ground - 300} 5000 ${ground - 90} L 5000 ${ground} L -3000 ${ground} Z`} fill={dawn > 0.5 ? "#2a2034" : "#0b0c16"} />
      {/* canopy pillars */}
      {[canopy.x + 40, canopy.x + canopy.w - 80].map((px) => (
        <rect key={px} x={px} y={canopy.y} width={40} height={ground - canopy.y} fill="#1d1b24" />
      ))}
      {/* the booth */}
      <rect x={booth.x} y={booth.top} width={booth.w} height={ground - booth.top} fill="#3a3a44" />
      <rect x={booth.x - 20} y={booth.top - 30} width={booth.w + 40} height={34} fill="#26262e" />
      <rect x={booth.x + 40} y={booth.top + 60} width={200} height={170} fill="#0a0b10" stroke="#1a1a20" strokeWidth={10} />
      {glow > 0 ? <rect x={booth.x + 45} y={booth.top + 65} width={190} height={160} fill="#ffb24a" opacity={0.55 * glow} /> : null}
      {glow > 0 ? <circle cx={booth.x + 140} cy={booth.top + 150} r={180} fill="#ffb24a" opacity={0.18 * glow} filter="url(#soft)" /> : null}
      {/* door: swings open toward the camera */}
      <rect x={booth.x + 290} y={booth.top + 40} width={100} height={ground - booth.top - 40} fill="#050508" />
      <g transform={`translate(${booth.x + 290} 0) scale(${1 - door * 0.75} 1)`}>
        <rect x={0} y={booth.top + 40} width={100} height={ground - booth.top - 40} fill="#4a4a56" stroke="#2a2a32" strokeWidth={6} />
        <rect x={14} y={booth.top + 70} width={72} height={120} fill="#0a0b10" />
      </g>
      {/* toll barrier arm, snapped */}
      <rect x={booth.x + booth.w} y={ground - 140} width={30} height={140} fill="#2a2a32" />
      <g transform={`rotate(-38 ${booth.x + booth.w + 15} ${ground - 130})`}>
        <rect x={booth.x + booth.w + 15} y={ground - 140} width={420} height={18} fill="#d8d0c0" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={booth.x + booth.w + 40 + i * 100} y={ground - 140} width={50} height={18} fill="#c8352f" />
        ))}
      </g>
      {/* canopy roof */}
      <rect x={canopy.x} y={canopy.y - 70} width={canopy.w} height={70} fill="#2c2a34" />
      <rect x={canopy.x} y={canopy.y - 70} width={canopy.w} height={18} fill="#c8a03a" opacity={0.7} />
      <text x={canopy.x + canopy.w / 2} y={canopy.y - 14} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={46} letterSpacing={20} fill="#0e0d12">
        TOLL · NORTH
      </text>
      {/* the road */}
      <rect x={-3000} y={ground} width={8000} height={900} fill={dawn > 0.5 ? "#2a2630" : "#15141c"} />
      <rect x={-3000} y={ground} width={8000} height={12} fill="#2a2832" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={-2600 + i * 900} y={ground + 220} width={260} height={12} fill="#c9b878" opacity={0.45} />
      ))}
      {children}
      {front}
    </g>
  );
};

// Inside the booth: a cramped room lit only by what the scene brings (lighter, dawn window)
export const BOOTH = { floor: 1560, wall: 420, window: { x: 160, y: 760, w: 420, h: 330 }, counter: { x: 560, w: 520, top: 1200 } };
export const BoothInside: React.FC<{ frame: number; dawn: number; children?: React.ReactNode }> = ({ frame, dawn, children }) => {
  const { floor, wall, window: w, counter } = BOOTH;
  return (
    <g>
      <rect x={-800} y={-800} width={2700} height={3600} fill="#0c0d14" />
      <rect x={-200} y={wall} width={1500} height={floor - wall} fill="#3a3c48" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={-200 + i * 130} y={wall} width={6} height={floor - wall} fill="#33353f" />
      ))}
      {/* the window: night outside, then dawn */}
      <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="#070a1c" />
      <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="url(#dawnSky)" opacity={dawn} />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={w.x + 20 + rand(i + 4400) * (w.w - 40)} cy={w.y + 20 + rand(i + 4410) * (w.h * 0.6)} r={2} fill="#fff" opacity={(1 - dawn) * (0.4 + 0.6 * Math.abs(Math.sin(frame * 0.06 + i)))} />
      ))}
      <path d={`M ${w.x} ${w.y + w.h - 60} Q ${w.x + 200} ${w.y + w.h - 120} ${w.x + w.w} ${w.y + w.h - 70} L ${w.x + w.w} ${w.y + w.h} L ${w.x} ${w.y + w.h} Z`} fill={dawn > 0.5 ? "#3a2a40" : "#0a0b14"} />
      <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="none" stroke="#1d1e26" strokeWidth={18} />
      <line x1={w.x + w.w / 2} y1={w.y} x2={w.x + w.w / 2} y2={w.y + w.h} stroke="#1d1e26" strokeWidth={10} />
      {/* a crack across the glass */}
      <path d={`M ${w.x + 60} ${w.y + 40} l 60 70 l -20 60 l 50 50`} stroke="#c9d4e0" strokeWidth={2} fill="none" opacity={0.4} />
      {/* counter with the cash drawer and a dead monitor */}
      <rect x={counter.x} y={counter.top} width={counter.w} height={floor - counter.top} fill="#2a2a34" />
      <rect x={counter.x - 10} y={counter.top - 16} width={counter.w + 20} height={20} fill="#4a4a56" />
      <rect x={counter.x + 300} y={counter.top - 170} width={170} height={150} rx={8} fill="#1a1a20" />
      <rect x={counter.x + 314} y={counter.top - 156} width={142} height={110} fill="#0a0c10" />
      <rect x={counter.x + 40} y={counter.top + 40} width={200} height={50} fill="#1d1d24" />
      <rect x={-200} y={floor} width={1500} height={600} fill="#1a1a22" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={-200 + i * 200} y={floor} width={100} height={40} fill="#16161d" />
      ))}
      {children}
      {/* dawn light falling through the window onto the floor */}
      {dawn > 0 ? <polygon points={`${w.x},${w.y} ${w.x + w.w},${w.y} ${w.x + w.w + 380},${floor + 60} ${w.x + 200},${floor + 60}`} fill="#ffcf8a" opacity={0.14 * dawn} /> : null}
    </g>
  );
};

// A brass flip lighter with a living flame
export const Lighter: React.FC<{ x: number; y: number; on: number; frame: number; scale?: number }> = ({ x, y, on, frame, scale = 1 }) => {
  const f = 1 + Math.sin(frame * 1.7) * 0.12 + Math.sin(frame * 3.1) * 0.06;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-12} y={0} width={24} height={34} rx={4} fill="#c9a24a" />
      <rect x={-12} y={-12} width={24} height={12} rx={2} fill="#a8822e" />
      {on > 0 ? (
        <g opacity={on}>
          <ellipse cx={Math.sin(frame * 0.9) * 2} cy={-30 * f} rx={8} ry={20 * f} fill="#ffb24a" />
          <ellipse cx={Math.sin(frame * 0.9) * 2} cy={-24 * f} rx={4} ry={10 * f} fill="#fff3c4" />
          <circle cx={0} cy={-26} r={60} fill="#ffb24a" opacity={0.3} filter="url(#soft)" />
        </g>
      ) : null}
    </g>
  );
};

// Mia's backpack
export const Backpack: React.FC<{ x: number; y: number; open?: number }> = ({ x, y, open = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-50} y={-110} width={100} height={110} rx={24} fill="#3d5a6e" />
    <rect x={-40} y={-60} width={80} height={44} rx={10} fill="#33505f" />
    <path d={`M -36 -104 Q 0 ${-140 - open * 30} 36 -104`} stroke="#2a3f4e" strokeWidth={8} fill="none" />
    <rect x={-8} y={-50} width={16} height={8} rx={3} fill="#c9a24a" />
  </g>
);

export const BridgeDefs: React.FC = () => (
  <defs>
    <linearGradient id="bridgeSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2a0d1c" />
      <stop offset="0.5" stopColor="#8f2431" />
      <stop offset="0.85" stopColor="#ff7a3d" />
      <stop offset="1" stopColor="#ffb06a" />
    </linearGradient>
    <linearGradient id="dawnSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2a3a6a" />
      <stop offset="0.55" stopColor="#c9708a" />
      <stop offset="1" stopColor="#ffcf8a" />
    </linearGradient>
  </defs>
);

// Ash drifting across the frame, in screen space (adds life to every shot)
export const Ash: React.FC<{ frame: number; color?: string; n?: number }> = ({ frame, color = "#ffb07a", n = 36 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const sp = 1.5 + rand(i + 4500) * 3;
      const x = ((rand(i + 4510) * 1300 + frame * sp) % 1300) - 110;
      const y = ((rand(i + 4520) * 2100 + frame * (0.8 + rand(i + 4530))) % 2100) - 90 + Math.sin(frame * 0.05 + i) * 30;
      return <circle key={i} cx={x} cy={y} r={2 + rand(i + 4540) * 4} fill={color} opacity={0.25 + 0.35 * rand(i + 4550)} />;
    })}
  </g>
);

// ================= Character helpers shared by Parts 7–8 =================
// (copied from Part 6 so the shared modules stay untouched)
export const face = (worry: number, mouth = 0, sweat = 0, smile = 0) => ({ worry, smile, mouth, sweat });

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

// A point of the figure's skeleton in world coordinates
export const worldOf = (pose: Pose, p: keyof Skeleton, x: number, y: number, scale: number, flip: boolean) => {
  const q = skeleton(pose)[p] as { x: number; y: number };
  return { x: x + (flip ? -q.x : q.x) * scale, y: y + q.y * scale };
};

// Poses for both episodes (side view facing +x)
export const P78 = {
  stand: POSES.stand,
  crouch: { lean: 26, tilt: 4, duck: 0.5, chest: 1, lUA: 40, lFA: 80, rUA: 50, rFA: 90, lTh: 72, lSh: -38, rTh: 84, rSh: -28 },
  climbUp: { ...POSES.stand, lean: 8, rTh: 88, rSh: 4, rUA: 40, rFA: 120, lUA: -20, lFA: 10 },
  leap: { lean: 18, tilt: -8, duck: 0.2, chest: 1, lUA: -70, lFA: -40, rUA: 130, rFA: 150, lTh: 70, lSh: 20, rTh: -40, rSh: -80 },
  land: { lean: 34, tilt: 8, duck: 0.6, chest: 0.95, lUA: 60, lFA: 30, rUA: 70, rFA: 40, lTh: 92, lSh: -48, rTh: 100, rSh: -40 },
  balance: { ...POSES.stand, lean: 4, tilt: 10, duck: 0.3, lUA: -84, lFA: -96, rUA: 86, rFA: 98, lTh: -14, lSh: -8, rTh: 16, rSh: 6 },
  hang: { lean: 0, tilt: -14, duck: 0.4, chest: 1, lUA: 176, lFA: 178, rUA: 172, rFA: 176, lTh: -6, lSh: -10, rTh: 8, rSh: -4 },
  brace: { lean: 8, tilt: -20, duck: 0.4, chest: 1, lUA: 160, lFA: 170, rUA: 150, rFA: 160, lTh: 70, lSh: 10, rTh: 90, rSh: 30 },
  reachDown: { lean: 52, tilt: 20, duck: 0.4, chest: 1, lUA: 20, lFA: 14, rUA: 34, rFA: 24, lTh: 96, lSh: -50, rTh: 112, rSh: -40 },
  pull: { lean: -18, tilt: -6, duck: 0.4, chest: 1, lUA: 120, lFA: 150, rUA: 128, rFA: 160, lTh: 40, lSh: -30, rTh: -20, rSh: -10 },
  look: { ...POSES.stand, lean: 12, tilt: 14, duck: 0.2, lUA: 20, lFA: 40, rUA: 30, rFA: 60 },
  lift: { ...POSES.stand, lean: -4, tilt: -10, duck: 0.2, lUA: 150, lFA: 165, rUA: 14, rFA: 26 },
  holdUp: { ...POSES.stand, lean: 6, tilt: 18, duck: 0.4, chest: 0.97, lUA: 60, lFA: 140, rUA: 14, rFA: 26 },
  slump: { ...POSES.stand, lean: 16, tilt: 26, duck: 0.6, chest: 0.96, lUA: 20, lFA: 10, rUA: 34, rFA: 70, lTh: -12, lSh: -4, rTh: 14, rSh: 6 },
  comfort: { ...POSES.stand, lean: 8, tilt: 10, duck: 0.2, lUA: -10, lFA: 0, rUA: 84, rFA: 70 },
  batReady: { ...POSES.stand, lean: 4, tilt: -4, duck: 0.2, lUA: -105, lFA: 55, rUA: -112, rFA: 62 },
  batDown: { ...POSES.stand, lUA: 12, lFA: 24, rUA: 14, rFA: 26 },
  backUp: { ...POSES.stand, lean: -10, tilt: -6, duck: 0.3, lUA: 30, lFA: 70, rUA: 40, rFA: 80, lTh: -20, lSh: -10, rTh: 18, rSh: 4 },
  reachUp: { ...POSES.stand, lean: -4, tilt: -10, lUA: -172, lFA: -176, rUA: 172, rFA: 176 },
  sit: { lean: -16, tilt: 10, duck: 0.6, chest: 0.97, lUA: 52, lFA: 96, rUA: 64, rFA: 106, lTh: 112, lSh: 14, rTh: 124, rSh: 26 },
} satisfies Record<string, Pose>;
export type P78Pose = keyof typeof P78;

// Walk or run cycle blended in by speed (px per story frame)
export const moving = (base: Pose, x: number, speed: number, flip: boolean) =>
  lerpPose(base, walkPose((flip ? -x : x) / (speed > 7 ? 300 : 190), speed > 7 ? GAITS.run : GAITS.walk, base), Math.min(1, Math.max(0, speed / 3)));
export const speedOf = (s: number, f: number[], v: number[], track: (s: number, f: number[], v: number[]) => number) => Math.abs(track(s + 1, f, v) - track(s - 1, f, v)) / 2;
