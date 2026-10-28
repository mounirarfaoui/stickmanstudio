import React from "react";
import { rand } from "./world";

// ================= Part 6: the strangers' truck, the night road, the gas station =================

// The pickup, side view facing +x. `x` is the tailgate, `y` the ground; 710 long.
// The bed floor sits at y + TRUCK.bed (riders stand/sit there); the cab window takes a driver.
export const TRUCK = {
  len: 710,
  bed: -150,
  bedFrom: 20,
  bedTo: 360,
  cap: 330,
  mirror: { x: 600, y: -262 },
};

export const Truck: React.FC<{
  id: string;
  x: number;
  y: number;
  frame: number;
  color?: string;
  // wheel rotation in degrees
  roll?: number;
  bounce?: number;
  headlights?: number;
  brake?: number;
  exhaust?: number;
  tailgate?: number;
  // the driver, drawn inside the side window in truck-local coordinates
  driver?: React.ReactNode;
  // eyes glancing in the side mirror: -1 (at the bed) .. 1 (at the road)
  mirrorEyes?: number;
  // riders and cargo in the bed, in world coordinates (drawn behind the near side panel)
  children?: React.ReactNode;
}> = ({
  id,
  x,
  y,
  frame,
  color = "#5b3a2a",
  roll = 0,
  bounce = 0,
  headlights = 1,
  brake = 0,
  exhaust = 0.5,
  tailgate = 0,
  driver,
  mirrorEyes = -3,
  children,
}) => {
  const dark = "#2c1b14";
  const wheel = (wx: number) => (
    <g key={wx} transform={`translate(${x + wx} ${y - 58}) rotate(${roll})`}>
      <circle r={60} fill="#0a0a0d" />
      <circle r={30} fill="#3b3e45" />
      {[0, 72, 144, 216, 288].map((a) => (
        <rect key={a} x={-4} y={-28} width={8} height={18} fill="#1d1f24" transform={`rotate(${a})`} />
      ))}
      <circle r={8} fill="#7a7f88" />
    </g>
  );
  return (
    <g>
      <ellipse cx={x + 360} cy={y + 4} rx={380} ry={18} fill="#000" opacity={0.5} />
      {/* exhaust puffs drifting back from the tailpipe */}
      {exhaust > 0
        ? Array.from({ length: 6 }, (_, i) => {
            const p = ((frame * 0.05 + i / 6) % 1);
            return (
              <circle
                key={i}
                cx={x - 20 - p * 260}
                cy={y - 70 - p * 90 + Math.sin(frame * 0.2 + i) * 6}
                r={14 + p * 46}
                fill="#b9b4ad"
                opacity={exhaust * 0.28 * (1 - p)}
              />
            );
          })
        : null}
      <g transform={`translate(0 ${-bounce})`}>
        {/* far wall of the bed, then whatever rides in it */}
        <rect x={x + TRUCK.bedFrom} y={y - 232} width={TRUCK.bedTo - TRUCK.bedFrom} height={82} fill={dark} />
        {children}
        {/* chassis and near side of the bed */}
        <rect x={x + 6} y={y - 170} width={700} height={92} fill={color} />
        <rect x={x + 10} y={y - 236} width={350} height={150} rx={6} fill={color} />
        <rect x={x + 10} y={y - 236} width={350} height={14} fill="#7a5038" />
        <rect x={x + 30} y={y - 196} width={310} height={6} fill={dark} opacity={0.5} />
        {/* fuel cap */}
        <circle cx={x + TRUCK.cap} cy={y - 168} r={11} fill={dark} />
        {/* tailgate drops open around its bottom edge */}
        <g transform={`rotate(${-tailgate * 90} ${x + 10} ${y - 86})`}>
          <rect x={x - 4} y={y - 236} width={18} height={150} rx={4} fill="#6a4432" />
        </g>
        {/* cab and hood */}
        <path
          d={`M ${x + 360} ${y - 86} L ${x + 360} ${y - 372} Q ${x + 362} ${y - 384} ${x + 380} ${y - 384} L ${x + 520} ${y - 384} Q ${x + 534} ${y - 384} ${x + 540} ${y - 372} L ${x + 596} ${y - 252} L ${x + 690} ${y - 240} Q ${x + 708} ${y - 236} ${x + 708} ${y - 218} L ${x + 708} ${y - 86} Z`}
          fill={color}
        />
        {/* side window with the driver inside */}
        <defs>
          <clipPath id={`${id}-win`}>
            <polygon points={`${x + 384},${y - 360} ${x + 520},${y - 360} ${x + 572},${y - 262} ${x + 384},${y - 262}`} />
          </clipPath>
        </defs>
        <polygon points={`${x + 384},${y - 360} ${x + 520},${y - 360} ${x + 572},${y - 262} ${x + 384},${y - 262}`} fill="#0d1017" />
        <g clipPath={`url(#${id}-win)`}>
          <g transform={`translate(${x} ${y})`}>{driver}</g>
          <polygon points={`${x + 400},${y - 360} ${x + 440},${y - 360} ${x + 400},${y - 290}`} fill="#9fb4d0" opacity={0.12} />
        </g>
        <rect x={x + 376} y={y - 262} width={210} height={10} fill={dark} />
        <rect x={x + 470} y={y - 236} width={30} height={8} rx={3} fill="#1d120d" />
        <line x1={x + 360} y1={y - 250} x2={x + 360} y2={y - 90} stroke={dark} strokeWidth={4} />
        {/* side mirror (the strangers watch the bed in it) */}
        <g transform={`translate(${x + TRUCK.mirror.x} ${y + TRUCK.mirror.y})`}>
          <rect x={-6} y={6} width={22} height={8} fill={dark} />
          <rect x={10} y={-26} width={40} height={40} rx={8} fill="#1d120d" />
          <rect x={14} y={-22} width={32} height={32} rx={6} fill="#20283a" />
          {mirrorEyes > -2 ? (
            <g>
              <rect x={14} y={-14} width={32} height={10} fill="#d9b48c" opacity={0.85} />
              {[22, 38].map((ex) => (
                <g key={ex}>
                  <ellipse cx={ex} cy={-9} rx={5} ry={3.2} fill="#fff" />
                  <circle cx={ex + mirrorEyes * 2.6} cy={-9} r={2} fill="#111" />
                </g>
              ))}
              <line x1={16} y1={-16} x2={28} y2={-17 + Math.abs(mirrorEyes)} stroke="#3a2416" strokeWidth={2} />
              <line x1={32} y1={-17 + Math.abs(mirrorEyes)} x2={44} y2={-16} stroke="#3a2416" strokeWidth={2} />
            </g>
          ) : null}
        </g>
        {/* grille, bumper, lights */}
        <rect x={x + 692} y={y - 200} width={22} height={70} rx={4} fill="#2a2a2e" />
        <rect x={x + 600} y={y - 100} width={120} height={22} rx={6} fill="#8a8d94" />
        <rect x={x - 8} y={y - 104} width={60} height={20} rx={6} fill="#8a8d94" />
        <rect x={x + 686} y={y - 214} width={22} height={26} rx={5} fill={headlights > 0.3 ? "#fff3c4" : "#6a6a60"} />
        <rect x={x + 4} y={y - 226} width={14} height={44} rx={3} fill={brake > 0.3 ? "#ff2a1e" : "#8a1a16"} />
        {wheel(150)}
        {wheel(590)}
        <path d={`M ${x + 80} ${y - 112} Q ${x + 150} ${y - 176} ${x + 220} ${y - 112}`} stroke={dark} strokeWidth={10} fill="none" />
        <path d={`M ${x + 520} ${y - 112} Q ${x + 590} ${y - 176} ${x + 660} ${y - 112}`} stroke={dark} strokeWidth={10} fill="none" />
      </g>
    </g>
  );
};

// Headlight beam and tail-light glow, drawn over the scene (after the truck)
export const TruckLights: React.FC<{ x: number; y: number; headlights: number; brake: number; len?: number }> = ({
  x,
  y,
  headlights,
  brake,
  len = 1300,
}) => (
  <g>
    {headlights > 0 ? (
      <g>
        <polygon
          points={`${x + 706},${y - 214} ${x + 706},${y - 188} ${x + 706 + len},${y + 40} ${x + 706 + len},${y - 380}`}
          fill="url(#beamGrad)"
          opacity={headlights}
        />
        <circle cx={x + 712} cy={y - 200} r={60} fill="#fff3c4" opacity={0.35 * headlights} filter="url(#soft)" />
        <ellipse cx={x + 706 + len * 0.45} cy={y + 10} rx={len * 0.4} ry={30} fill="#fff3c4" opacity={0.12 * headlights} />
      </g>
    ) : null}
    <circle cx={x + 10} cy={y - 204} r={40 + brake * 40} fill="#ff2a1e" opacity={0.25 + brake * 0.45} filter="url(#soft)" />
  </g>
);

export const RoadDefs: React.FC = () => (
  <defs>
    <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#fff3c4" stopOpacity={0.5} />
      <stop offset="1" stopColor="#fff3c4" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="roadFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#000" stopOpacity={0.85} />
      <stop offset="1" stopColor="#000" stopOpacity={0} />
    </linearGradient>
  </defs>
);

// A bare dead tree
const DeadTree: React.FC<{ x: number; y: number; h: number; seed: number; color: string }> = ({ x, y, h, seed, color }) => (
  <g stroke={color} strokeLinecap="round" fill="none">
    <line x1={x} y1={y} x2={x + (rand(seed) - 0.5) * 30} y2={y - h} strokeWidth={h * 0.06} />
    {[0.45, 0.62, 0.78].map((t, i) => {
      const side = i % 2 ? 1 : -1;
      const bx = x + (rand(seed) - 0.5) * 30 * t;
      return (
        <path
          key={i}
          d={`M ${bx} ${y - h * t} q ${side * h * 0.18} ${-h * 0.06} ${side * h * (0.22 + rand(seed + i) * 0.12)} ${-h * 0.2}`}
          strokeWidth={h * 0.03}
        />
      );
    })}
  </g>
);

// The night highway seen from the side. Everything scrolls by `travel` (world px the truck has covered)
// at its own parallax depth; the truck itself stays put and the caller draws it as a child.
export const ROAD = { ground: 1500 };
export const Road: React.FC<{ frame: number; travel: number; children?: React.ReactNode; front?: React.ReactNode }> = ({
  frame,
  travel,
  children,
  front,
}) => {
  const g = ROAD.ground;
  const wrap = (v: number, span: number) => ((v % span) + span) % span;
  return (
    <g>
      {/* far hills */}
      {Array.from({ length: 8 }, (_, i) => {
        const hx = -1400 + wrap(i * 620 - travel * 0.08, 4960);
        const h = 200 + rand(i + 40) * 160;
        return <ellipse key={i} cx={hx} cy={g - 200} rx={520} ry={h} fill="#0d1022" />;
      })}
      {/* the treeline */}
      {Array.from({ length: 22 }, (_, i) => {
        const tx = -1400 + wrap(i * 230 - travel * 0.35, 5060);
        return <DeadTree key={i} x={tx} y={g - 150} h={260 + rand(i + 60) * 220} seed={i + 61} color="#0a0b16" />;
      })}
      <rect x={-1600} y={g - 160} width={5600} height={160} fill="#0b0c14" />
      {/* telephone poles and their sagging wires */}
      {Array.from({ length: 6 }, (_, i) => {
        const px = -1400 + wrap(i * 900 - travel * 0.8, 5400);
        return (
          <g key={i}>
            <rect x={px} y={g - 760} width={18} height={640} fill="#07070c" />
            <rect x={px - 50} y={g - 740} width={118} height={12} fill="#07070c" />
            <path d={`M ${px + 60} ${g - 734} q 450 120 900 0`} stroke="#07070c" strokeWidth={3} fill="none" />
            <path d={`M ${px - 44} ${g - 734} q 450 120 900 0`} stroke="#07070c" strokeWidth={3} fill="none" />
          </g>
        );
      })}
      {/* asphalt and the dashed centre line */}
      <rect x={-1600} y={g} width={5600} height={900} fill="#15151d" />
      <rect x={-1600} y={g} width={5600} height={14} fill="#26262f" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={-1600 + wrap(i * 420 - travel, 5880)} y={g + 130} width={220} height={14} fill="#c9b878" opacity={0.6} />
      ))}
      {children}
      {/* roadside grass rushing past, out of focus */}
      {Array.from({ length: 12 }, (_, i) => {
        const gx = -1400 + wrap(i * 470 - travel * 1.6, 5640);
        return <ellipse key={i} cx={gx} cy={g + 330} rx={180} ry={46} fill="#07080c" filter="url(#soft)" opacity={0.9} />;
      })}
      {front}
      {/* wind streaks */}
      {Array.from({ length: 10 }, (_, i) => {
        const wx = 3000 - wrap(frame * 90 + i * 530, 4600);
        return <line key={i} x1={wx} y1={600 + rand(i + 90) * 900} x2={wx + 160} y2={600 + rand(i + 90) * 900} stroke="#cfd6ff" strokeWidth={3} opacity={0.12} />;
      })}
    </g>
  );
};

// ---------- the gas station ----------
export const GAS = {
  ground: 1500,
  canopy: { x: -500, w: 1700, y: 700 },
  store: { x: 1500, w: 1000, top: 860 },
  door: { x: 2100, w: 150, top: 1150 },
  window: { x: 1580, w: 440, top: 1080, bottom: 1400 },
  pump: 140,
};

export const GasStation: React.FC<{
  frame: number;
  // canopy tubes 0..1 (they flicker)
  tubes: number[];
  sign: number;
  door: number;
  // torchlight moving inside the store window, 0 = none
  inside: number;
  insideX: number;
  hose?: { x: number; y: number };
  children?: React.ReactNode;
}> = ({ frame, tubes, sign, door, inside, insideX, hose, children }) => {
  const { ground, canopy, store, door: d, window: w, pump } = GAS;
  return (
    <g>
      {/* the store at the back */}
      <rect x={store.x} y={store.top} width={store.w} height={ground - store.top} fill="#2b2530" />
      <rect x={store.x - 20} y={store.top - 30} width={store.w + 40} height={40} fill="#1c1820" />
      <rect x={store.x + 80} y={store.top + 50} width={760} height={120} rx={8} fill="#1a1520" stroke="#3a3040" strokeWidth={6} />
      <text x={store.x + 460} y={store.top + 140} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={88} letterSpacing={12} fill="#6a5a70">
        FOOD MART
      </text>
      <rect x={w.x} y={w.top} width={w.w} height={w.bottom - w.top} fill="#07080d" />
      {/* shelves inside, only seen in the torchlight */}
      <g opacity={0.25 + inside * 0.75}>
        {[0, 1, 2].map((r) => (
          <rect key={r} x={w.x + 20} y={w.top + 90 + r * 90} width={w.w - 40} height={10} fill="#3a3540" />
        ))}
      </g>
      {inside > 0 ? (
        <g>
          <circle cx={insideX} cy={w.top + 170} r={150} fill="#fff3c4" opacity={0.3 * inside} filter="url(#soft)" />
          <circle cx={insideX} cy={w.top + 170} r={40} fill="#fff3c4" opacity={0.5 * inside} filter="url(#soft)" />
        </g>
      ) : null}
      <rect x={w.x} y={w.top} width={w.w} height={w.bottom - w.top} fill="none" stroke="#1a161e" strokeWidth={16} />
      <line x1={w.x + w.w / 2} y1={w.top} x2={w.x + w.w / 2} y2={w.bottom} stroke="#1a161e" strokeWidth={10} />
      <rect x={d.x} y={d.top} width={d.w} height={ground - d.top} fill="#05060a" />
      <g transform={`translate(${d.x} 0) scale(${1 - door * 0.8} 1)`}>
        <rect x={0} y={d.top} width={d.w} height={ground - d.top} fill="#20242c" opacity={0.85} stroke="#3a3f48" strokeWidth={10} />
        <rect x={d.w - 30} y={d.top + 160} width={10} height={50} rx={4} fill="#8a8f99" />
      </g>
      <rect x={store.x + 860} y={d.top + 40} width={80} height={110} fill="#c8352f" opacity={0.7} />
      {/* tall price sign */}
      <rect x={-760} y={500} width={24} height={ground - 500} fill="#14121a" />
      <rect x={-900} y={380} width={300} height={260} rx={10} fill="#1b1922" stroke="#2f2b38" strokeWidth={8} />
      <text x={-750} y={490} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={100} fill={sign > 0.5 ? "#ffcf4a" : "#4a3c1a"}>
        GAS
      </text>
      <text x={-750} y={600} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={64} fill={sign > 0.5 ? "#ff6a3d" : "#3a1c14"}>
        4.99
      </text>
      {sign > 0.5 ? <circle cx={-750} cy={510} r={220} fill="#ffcf4a" opacity={0.1} filter="url(#soft)" /> : null}
      {/* canopy pillars (back) */}
      <rect x={canopy.x + 140} y={canopy.y} width={40} height={ground - canopy.y} fill="#1d1b24" />
      {/* the pump */}
      <g>
        <rect x={pump - 70} y={ground - 40} width={180} height={40} fill="#2a2830" />
        <rect x={pump - 50} y={ground - 300} width={140} height={260} rx={10} fill="#a8322c" />
        <rect x={pump - 34} y={ground - 280} width={108} height={70} rx={6} fill="#13151c" />
        <text x={pump + 20} y={ground - 232} textAnchor="middle" fontFamily="monospace" fontSize={30} fill="#ff8a4a">
          {hose ? ((frame * 0.37) % 99).toFixed(2).padStart(5, "0") : "00.00"}
        </text>
        <rect x={pump - 34} y={ground - 196} width={108} height={30} fill="#e9e1cf" />
        <rect x={pump + 90} y={ground - 190} width={18} height={60} rx={6} fill="#1a1a1e" />
        {hose ? (
          <path
            d={`M ${pump + 98} ${ground - 150} Q ${(pump + 98 + hose.x) / 2} ${ground + 30} ${hose.x} ${hose.y}`}
            stroke="#111" strokeWidth={9} fill="none"
          />
        ) : (
          <path d={`M ${pump + 98} ${ground - 150} q 30 60 0 110`} stroke="#111" strokeWidth={9} fill="none" />
        )}
      </g>
      {children}
      {/* canopy roof and its flickering tubes */}
      <rect x={canopy.x} y={canopy.y - 80} width={canopy.w} height={80} fill="#e9e4dc" />
      <rect x={canopy.x} y={canopy.y - 80} width={canopy.w} height={22} fill="#c8352f" />
      <rect x={canopy.x} y={canopy.y} width={canopy.w} height={14} fill="#8a8590" />
      {tubes.map((on, i) => {
        const tx = canopy.x + 160 + i * ((canopy.w - 320) / Math.max(1, tubes.length - 1));
        return (
          <g key={i}>
            <rect x={tx - 90} y={canopy.y + 14} width={180} height={14} rx={6} fill={on > 0.5 ? "#f2fbff" : "#4a4f58"} />
            {on > 0.5 ? <ellipse cx={tx} cy={canopy.y + 200} rx={260} ry={220} fill="#e8f6ff" opacity={0.08 * on} filter="url(#soft)" /> : null}
          </g>
        );
      })}
      {/* front pillar */}
      <rect x={canopy.x + canopy.w - 180} y={canopy.y + 14} width={46} height={ground - canopy.y - 14} fill="#26232e" />
      {/* forecourt and road */}
      <rect x={-1600} y={ground} width={5600} height={900} fill="#17161d" />
      <rect x={-1600} y={ground} width={5600} height={12} fill="#2a2832" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={-1400 + i * 900} y={ground + 260} width={260} height={12} fill="#c9b878" opacity={0.45} />
      ))}
      <ellipse cx={600} cy={ground + 40} rx={900} ry={40} fill="#e8f6ff" opacity={0.05 * tubes.reduce((a, b) => a + b, 0)} />
    </g>
  );
};

// Looking down the empty road behind the truck as it drives away: a perspective highway to the horizon.
// `dist` 0..1 takes the truck from close to a speck; Biscuit stands in the bed barking back.
export const RoadBehind: React.FC<{ frame: number; dist: number; bark: number; children?: React.ReactNode }> = ({
  frame,
  dist,
  bark,
  children,
}) => {
  const hz = 820;
  const vx = 540;
  // perspective: things at depth d (0 = at the camera, 1 = horizon) shrink toward the vanishing point
  const sc = Math.pow(1 - dist, 2.2) * 1.0 + 0.008;
  const ty = hz + (1500 - hz) * Math.pow(1 - dist, 2.2);
  return (
    <g>
      <rect x={-600} y={hz - 1600} width={2400} height={1600} fill="#080a18" />
      <circle cx={760} cy={300} r={60} fill="#f3ecd7" opacity={0.9} />
      <circle cx={760} cy={300} r={160} fill="#f3ecd7" opacity={0.08} filter="url(#soft)" />
      {Array.from({ length: 50 }, (_, i) => (
        <circle key={i} cx={-200 + rand(i + 1500) * 1500} cy={rand(i + 1600) * (hz - 60)} r={1.5 + rand(i + 1700) * 2} fill="#fff" opacity={0.3 + 0.6 * Math.abs(Math.sin(frame * 0.05 + i))} />
      ))}
      {/* hills and trees on the horizon */}
      <path d={`M -600 ${hz} Q -200 ${hz - 120} 200 ${hz - 40} Q 500 ${hz - 140} 900 ${hz - 50} Q 1300 ${hz - 110} 1800 ${hz} Z`} fill="#0d1022" />
      {Array.from({ length: 16 }, (_, i) => (
        <DeadTree key={i} x={-300 + i * 110} y={hz} h={60 + rand(i + 1800) * 70} seed={i + 1800} color="#070812" />
      ))}
      <rect x={-600} y={hz} width={2400} height={1400} fill="#0b0c14" />
      <polygon points={`${vx - 6},${hz} ${vx + 6},${hz} ${vx + 1100},2000 ${vx - 1100},2000`} fill="#16161e" />
      {/* centre dashes rushing toward the vanishing point */}
      {Array.from({ length: 10 }, (_, i) => {
        const d0 = i / 10;
        const y0 = hz + (2000 - hz) * Math.pow(d0, 2.4);
        const y1 = hz + (2000 - hz) * Math.pow(Math.min(1, d0 + 0.04), 2.4);
        const w0 = 2 + 30 * Math.pow(d0, 2.4);
        return <rect key={i} x={vx - w0 / 2} y={y0} width={w0} height={y1 - y0} fill="#c9b878" opacity={0.5} />;
      })}
      {/* the truck from behind */}
      <g transform={`translate(${vx + (1 - sc) * 30} ${ty}) scale(${sc})`}>
        <ellipse cx={0} cy={4} rx={300} ry={26} fill="#000" opacity={0.6} />
        <rect x={-260} y={-150} width={520} height={110} rx={10} fill="#3a251c" />
        <rect x={-200} y={-330} width={400} height={170} rx={20} fill="#3a251c" />
        <rect x={-160} y={-310} width={320} height={90} rx={10} fill="#0d1017" />
        {/* Biscuit in the bed, barking back at them */}
        <g transform={`translate(-150 -150) rotate(${-bark * 8})`}>
          <ellipse cx={0} cy={-40} rx={42} ry={36} fill="#9a7448" />
          <path d="M -34 -66 L -50 -96 L -18 -76 Z" fill="#6e5032" />
          <path d="M 34 -66 L 50 -96 L 18 -76 Z" fill="#6e5032" />
          <circle cx={-14} cy={-46} r={5} fill="#111" />
          <circle cx={14} cy={-46} r={5} fill="#111" />
          <ellipse cx={0} cy={-24} rx={12 + bark * 4} ry={6 + bark * 10} fill="#3a1f18" />
        </g>
        {/* the bags */}
        <rect x={20} y={-200} width={90} height={60} rx={14} fill="#3d5a6e" />
        <rect x={120} y={-190} width={80} height={50} rx={14} fill="#6e3d3d" />
        <rect x={-260} y={-60} width={520} height={30} rx={8} fill="#8a8d94" />
        {[-220, 190].map((lx) => (
          <g key={lx}>
            <rect x={lx} y={-140} width={34} height={44} rx={6} fill="#ff2a1e" />
            <circle cx={lx + 17} cy={-118} r={90} fill="#ff2a1e" opacity={0.3} filter="url(#soft)" />
          </g>
        ))}
        {[-200, 200].map((wx) => (
          <rect key={wx} x={wx - 40} y={-40} width={80} height={44} rx={10} fill="#060608" />
        ))}
      </g>
      {/* red glow the tail lights throw on the road */}
      <ellipse cx={vx} cy={ty + 30} rx={500 * sc + 20} ry={120 * sc + 4} fill="#ff2a1e" opacity={0.25} filter="url(#soft)" />
      {/* dust kicked up by the truck, drifting back toward them */}
      {Array.from({ length: 24 }, (_, i) => {
        const p = (frame * 0.012 + rand(i + 1900)) % 1;
        return (
          <circle
            key={i}
            cx={vx + (rand(i + 1910) - 0.5) * 300 * (0.2 + p * 3)}
            cy={hz + 40 + p * 900}
            r={6 + p * 30}
            fill="#a99"
            opacity={0.12 * (1 - p) * (1 - dist * 0.5)}
          />
        );
      })}
      {children}
    </g>
  );
};
