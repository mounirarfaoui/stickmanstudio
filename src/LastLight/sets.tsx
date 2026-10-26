import React from "react";
import { rand } from "./world";

// Sets beyond Kai's living room: the bathroom, the building's fire escape, and the alley.
// Each set has its own world coordinates (1080 wide unless noted); scenes give them their own camera.

// ================= Bathroom =================
export const BATH = {
  floor: 1560,
  ceiling: 380,
  tub: { x: 110, w: 540, rim: 1300 },
  window: { x: 250, y: 690, w: 250, h: 210 },
  door: { x: 870, w: 175, top: 1070 },
  sink: { x: 700, w: 150, top: 1250 },
};

export const Bathroom: React.FC<{ frame: number; sash: number; light: number; children?: React.ReactNode }> = ({ frame, sash, light, children }) => {
  const { floor, ceiling, tub, window: w, sink } = BATH;
  return (
    <g>
      <rect x={-600} y={-800} width={2400} height={3600} fill="#0b0d12" />
      <rect x={0} y={ceiling} width={1080} height={floor - ceiling} fill="#7f969b" />
      {Array.from({ length: 19 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={ceiling + i * 62} x2={1080} y2={ceiling + i * 62} stroke="#6d8287" strokeWidth={3} />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <line key={`v${i}`} x1={i * 62} y1={ceiling} x2={i * 62} y2={floor} stroke="#6d8287" strokeWidth={3} />
      ))}
      <rect x={0} y={ceiling - 40} width={1080} height={40} fill="#262c36" />
      {/* the small high window, frosted, red night behind it; the lower sash slides up */}
      <rect x={w.x - 16} y={w.y - 16} width={w.w + 32} height={w.h + 32} fill="#1b1f27" />
      <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="#c2453a" />
      <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="#ffb08a" opacity={0.25} />
      <rect x={w.x} y={w.y} width={w.w} height={w.h / 2} fill="#d9d2cc" opacity={0.55} />
      <g transform={`translate(0 ${-sash * (w.h / 2 - 6)})`}>
        <rect x={w.x} y={w.y + w.h / 2} width={w.w} height={w.h / 2} fill="#d9d2cc" opacity={0.6 * (1 - sash * 0.2)} />
        <rect x={w.x} y={w.y + w.h / 2 - 6} width={w.w} height={12} fill="#1b1f27" />
      </g>
      <rect x={w.x - 30} y={w.y + w.h + 10} width={w.w + 60} height={16} fill="#1b1f27" />
      {/* tub */}
      <rect x={tub.x} y={tub.rim} width={tub.w} height={floor - tub.rim} rx={28} fill="#d8d4cc" />
      <rect x={tub.x - 10} y={tub.rim - 14} width={tub.w + 20} height={26} rx={12} fill="#ece8e0" />
      <rect x={tub.x + 30} y={tub.rim + 60} width={tub.w - 60} height={8} fill="#bdb8ae" />
      <rect x={tub.x + 40} y={tub.rim - 70} width={14} height={60} fill="#9aa0a8" />
      <rect x={tub.x + 40} y={tub.rim - 70} width={50} height={12} fill="#9aa0a8" />
      <rect x={tub.x - 10} y={ceiling + 60} width={8} height={tub.rim - ceiling - 60} fill="#3a3f48" opacity={0.6} />
      {/* sink + mirror */}
      <rect x={sink.x + 10} y={sink.top - 330} width={sink.w - 20} height={220} fill="#2b3a44" stroke="#c9ccd1" strokeWidth={8} />
      <polygon points={`${sink.x + 30},${sink.top - 320} ${sink.x + 70},${sink.top - 320} ${sink.x + 30},${sink.top - 200}`} fill="#fff" opacity={0.12} />
      <rect x={sink.x} y={sink.top} width={sink.w} height={40} rx={10} fill="#ece8e0" />
      <rect x={sink.x + sink.w / 2 - 16} y={sink.top + 40} width={32} height={floor - sink.top - 40} fill="#d8d4cc" />
      {/* floor tiles */}
      <rect x={-600} y={floor} width={2400} height={800} fill="#2a2f38" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={-600 + i * 200} y={floor} width={100} height={60} fill="#232831" />
      ))}
      {children}
      {/* bare bulb */}
      <line x1={540} y1={ceiling} x2={540} y2={ceiling + 70} stroke="#111" strokeWidth={4} />
      <circle cx={540} cy={ceiling + 86} r={18} fill="#FFE7B0" opacity={0.4 + 0.6 * light} />
      <ellipse cx={540} cy={ceiling + 300} rx={700} ry={700} fill="url(#lampGlow)" opacity={0.5 * light} />
      <rect x={-600} y={-800} width={2400} height={3600} fill="#000" opacity={(1 - light) * 0.45 + 0.08 * Math.max(0, Math.sin(frame * 0.7))} />
    </g>
  );
};

// The bathroom door: splinters with each bang, then bursts inward. `open` 0..1 swings it toward the hinge (right).
export const BathDoor: React.FC<{ splinter: number; open: number; shake: number; frame: number; children?: React.ReactNode }> = ({ splinter, open, shake, frame, children }) => {
  const { x, w, top } = BATH.door;
  const h = BATH.floor - top;
  const cracks = [
    "M 40 140 L 70 190 L 60 240 L 95 300",
    "M 70 190 L 120 210 L 150 260",
    "M 60 240 L 30 300 L 45 360",
    "M 95 300 L 130 330 L 125 400",
  ];
  return (
    <g>
      <rect x={x - 14} y={top - 14} width={w + 28} height={h + 14} fill="#141820" />
      <rect x={x} y={top} width={w} height={h} fill="#06070a" />
      {children}
      <g transform={`translate(${x + w + shake * 6} ${top}) scale(${1 - open * 0.82} 1) translate(${-w} 0)`}>
        <rect x={0} y={0} width={w} height={h} fill="#e3ddd2" />
        <rect x={18} y={24} width={w - 36} height={h * 0.4} fill="none" stroke="#c9c2b5" strokeWidth={7} />
        <rect x={18} y={h * 0.5} width={w - 36} height={h * 0.42} fill="none" stroke="#c9c2b5" strokeWidth={7} />
        <circle cx={24} cy={h * 0.52} r={10} fill="#a98d55" />
        {cracks.map((d, i) => (splinter > i ? <path key={i} d={d} stroke="#4a3d2c" strokeWidth={5} fill="none" /> : null))}
        {splinter > 3.5 ? <path d={`M 50 150 L 110 160 L 140 250 L 80 270 Z`} fill="#06070a" opacity={0.85 + 0.15 * Math.sin(frame)} /> : null}
      </g>
    </g>
  );
};

// ================= Building exterior with a fire escape =================
export const ESC = {
  wallRight: 830,
  window: { x: 300, y: 610, w: 170, h: 190 },
  landings: [880, 1490, 2100],
  left: 130,
  right: 800,
  ground: 2700,
  ladder: { x: 740, top: 2100, len: 230 },
};

const Railing: React.FC<{ y: number }> = ({ y }) => (
  <g stroke="#15161b" strokeLinecap="round">
    <line x1={ESC.left} y1={y} x2={ESC.right} y2={y} strokeWidth={14} />
    <line x1={ESC.left} y1={y - 80} x2={ESC.right} y2={y - 80} strokeWidth={8} />
    {Array.from({ length: 18 }, (_, i) => (
      <line key={i} x1={ESC.left + i * 39} y1={y - 80} x2={ESC.left + i * 39} y2={y} strokeWidth={4} />
    ))}
  </g>
);

const Stairs: React.FC<{ x1: number; y1: number; x2: number; y2: number }> = ({ x1, y1, x2, y2 }) => {
  const steps = 14;
  return (
    <g stroke="#15161b" strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={10} />
      <line x1={x1} y1={y1 - 70} x2={x2} y2={y2 - 70} strokeWidth={6} />
      {Array.from({ length: steps }, (_, i) => {
        const t = (i + 0.5) / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        return <line key={i} x1={x - 14} y1={y} x2={x + 14} y2={y} strokeWidth={6} />;
      })}
    </g>
  );
};

// Stair runs Kai follows: [x1, y1, x2, y2]
export const STAIR_RUNS = [
  [760, ESC.landings[0], 190, ESC.landings[1]],
  [190, ESC.landings[1], 760, ESC.landings[2]],
] as const;

export const FireEscape: React.FC<{ frame: number; ladderJiggle: number; sash: number; children?: React.ReactNode; front?: React.ReactNode }> = ({ frame, ladderJiggle, sash, children, front }) => {
  const { wallRight, window: w, landings, ground, ladder } = ESC;
  const rows = Math.ceil(ground / 26);
  return (
    <g>
      {/* night sky beside the building, a far skyline */}
      <rect x={-600} y={-800} width={2400} height={ground + 800} fill="url(#sky)" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={wallRight + 10 + i * 50} y={1400 + rand(i + 3) * 500} width={44} height={2000} fill="#2a1218" />
      ))}
      <rect x={-600} y={-800} width={wallRight + 600} height={ground + 800} fill="#5a2f2a" />
      {Array.from({ length: rows }, (_, r) => (
        <g key={r}>
          <line x1={-600} y1={r * 26} x2={wallRight} y2={r * 26} stroke="#47231f" strokeWidth={3} />
          {Array.from({ length: 12 }, (_, c) => (
            <line key={c} x1={-560 + c * 120 + (r % 2) * 60} y1={r * 26} x2={-560 + c * 120 + (r % 2) * 60} y2={r * 26 + 26} stroke="#47231f" strokeWidth={3} />
          ))}
        </g>
      ))}
      <rect x={wallRight - 20} y={-800} width={20} height={ground + 800} fill="#3b1c18" />
      {/* other windows */}
      {[
        [560, 640],
        [300, 1250],
        [560, 1250],
        [300, 1860],
        [560, 1860],
      ].map(([wx, wy], i) => (
        <g key={i}>
          <rect x={wx - 10} y={wy - 10} width={w.w + 20} height={w.h + 20} fill="#2a1512" />
          <rect x={wx} y={wy} width={w.w} height={w.h} fill={rand(i + 11) > 0.6 ? "#3b2a1c" : "#0d0b0e"} />
        </g>
      ))}
      {/* the bathroom window Kai comes out of */}
      <rect x={w.x - 10} y={w.y - 10} width={w.w + 20} height={w.h + 20} fill="#2a1512" />
      <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="#06070a" />
      <ellipse cx={w.x + w.w / 2} cy={w.y + w.h / 2} rx={80} ry={60} fill="#FFE7B0" opacity={0.15 + 0.05 * Math.sin(frame * 0.7)} />
      <rect x={w.x} y={w.y - sash * (w.h / 2)} width={w.w} height={w.h / 2} fill="#d9d2cc" opacity={0.45} />
      {children}
      {/* fire escape */}
      {landings.map((y) => (
        <g key={y}>
          <rect x={ESC.left} y={y} width={ESC.right - ESC.left} height={14} fill="#15161b" />
          <Railing y={y} />
          <line x1={ESC.left + 20} y1={y + 14} x2={ESC.left - 10} y2={y + 90} stroke="#15161b" strokeWidth={8} />
          <line x1={ESC.right - 20} y1={y + 14} x2={ESC.right + 10} y2={y + 90} stroke="#15161b" strokeWidth={8} />
        </g>
      ))}
      {STAIR_RUNS.map((r, i) => (
        <Stairs key={i} x1={r[0]} y1={r[1]} x2={r[2]} y2={r[3]} />
      ))}
      {/* the drop ladder, jammed in its bracket */}
      <g transform={`translate(${Math.sin(frame * 2.3) * 3 * ladderJiggle} ${-Math.abs(Math.sin(frame * 1.7)) * 6 * ladderJiggle})`}>
        <line x1={ladder.x} y1={ladder.top - 30} x2={ladder.x} y2={ladder.top + ladder.len} stroke="#15161b" strokeWidth={7} />
        <line x1={ladder.x + 46} y1={ladder.top - 30} x2={ladder.x + 46} y2={ladder.top + ladder.len} stroke="#15161b" strokeWidth={7} />
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1={ladder.x} y1={ladder.top + i * 36} x2={ladder.x + 46} y2={ladder.top + i * 36} stroke="#15161b" strokeWidth={5} />
        ))}
      </g>
      <rect x={ladder.x - 10} y={ladder.top + 30} width={66} height={14} fill="#7a2a20" />
      {/* the alley floor below */}
      <rect x={-600} y={ground} width={2400} height={900} fill="#16121a" />
      <rect x={110} y={ground - 150} width={260} height={150} fill="#1f3a2c" />
      <rect x={100} y={ground - 168} width={280} height={24} fill="#173024" />
      {front}
    </g>
  );
};

// ================= The alley =================
export const ALLEY = { ground: 1500, gap: { x: 1680, w: 260 } };

export const Car: React.FC<{ x: number; y: number; color: string; door?: number; dark?: boolean; children?: React.ReactNode }> = ({ x, y, color, door = 0, children }) => {
  // side view, facing right, 560 long; front door spans x+250..x+400 and hinges at its front edge
  const body = `M ${x + 10} ${y - 60} L ${x + 10} ${y - 150} Q ${x + 14} ${y - 172} ${x + 60} ${y - 176} L ${x + 140} ${y - 180} L ${x + 200} ${y - 262} Q ${x + 214} ${y - 272} ${x + 240} ${y - 272} L ${x + 380} ${y - 272} Q ${x + 404} ${y - 270} ${x + 420} ${y - 250} L ${x + 466} ${y - 182} L ${x + 530} ${y - 172} Q ${x + 556} ${y - 166} ${x + 556} ${y - 140} L ${x + 556} ${y - 60} Z`;
  const dW = 150;
  return (
    <g>
      <ellipse cx={x + 280} cy={y + 4} rx={300} ry={16} fill="#000" opacity={0.45} />
      <path d={body} fill={color} />
      <polygon points={`${x + 212},${y - 252} ${x + 296},${y - 252} ${x + 296},${y - 186} ${x + 160},${y - 186}`} fill="#1a1d24" />
      <polygon points={`${x + 312},${y - 252} ${x + 380},${y - 252} ${x + 446},${y - 186} ${x + 312},${y - 186}`} fill="#1a1d24" />
      <polygon points={`${x + 222},${y - 248} ${x + 250},${y - 248} ${x + 206},${y - 190} ${x + 186},${y - 190}`} fill="#ff7a3d" opacity={0.25} />
      {/* opening door: the gap shows the black interior, the panel turns toward the camera */}
      {door > 0 ? <rect x={x + 252} y={y - 252} width={dW} height={192} fill="#020203" /> : null}
      {children}
      <g transform={`translate(${x + 252 + dW} ${y - 252 + door * 8}) scale(${1 - door * 0.72} ${1 + door * 0.06}) translate(${-dW} 0)`}>
        <path d={`M 0 0 L ${dW - 6} 0 L ${dW - 6} 192 L 0 192 Z`} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={4} />
        {door > 0 ? <rect x={0} y={0} width={dW - 6} height={192} fill={color} /> : null}
        {door > 0 ? <rect x={6} y={6} width={dW - 18} height={60} fill="#1a1d24" /> : null}
        <rect x={dW - 40} y={86} width={24} height={7} rx={3} fill="#0d0f12" />
      </g>
      {[110, 450].map((wx) => (
        <g key={wx}>
          <circle cx={x + wx} cy={y - 46} r={48} fill="#0b0c0f" />
          <circle cx={x + wx} cy={y - 46} r={20} fill="#3b3e45" />
        </g>
      ))}
      <rect x={x + 536} y={y - 150} width={18} height={14} fill="#ffd9a0" opacity={0.15} />
    </g>
  );
};

export const Alley: React.FC<{ frame: number; lamp: number; children?: React.ReactNode }> = ({ frame, lamp, children }) => {
  const { ground, gap } = ALLEY;
  return (
    <g>
      <rect x={-1000} y={-1000} width={4600} height={ground + 1000} fill="#3b1e1c" />
      {Array.from({ length: Math.ceil((ground + 1000) / 26) }, (_, r) => (
        <line key={r} x1={-1000} y1={-1000 + r * 26} x2={3600} y2={-1000 + r * 26} stroke="#311816" strokeWidth={3} />
      ))}
      {/* gap between the buildings: the street beyond, under the red sky */}
      <rect x={gap.x} y={-1000} width={gap.w} height={ground + 1000} fill="url(#sky)" />
      <rect x={gap.x} y={1300} width={gap.w} height={ground - 1300} fill="#1b0f14" />
      <rect x={gap.x - 16} y={-1000} width={16} height={ground + 1000} fill="#2a1311" />
      <rect x={gap.x + gap.w} y={-1000} width={16} height={ground + 1000} fill="#2a1311" />
      {/* back doors and dark windows */}
      {[200, 760, 1260, 2150, 2700].map((wx, i) => (
        <g key={i}>
          <rect x={wx} y={700} width={150} height={170} fill={i === 2 ? "#3a2a1a" : "#0d0b0e"} stroke="#24100e" strokeWidth={12} />
          <rect x={wx + 10} y={1120} width={130} height={ground - 1120} fill="#1d0f0d" />
        </g>
      ))}
      {/* fire-escape silhouettes above */}
      <rect x={-200} y={420} width={1300} height={12} fill="#120c0f" />
      <rect x={2050} y={380} width={900} height={12} fill="#120c0f" />
      {children}
      <rect x={-1000} y={ground} width={4600} height={1200} fill="#141017" />
      {[400, 1150, 2300].map((px, i) => (
        <ellipse key={i} cx={px} cy={ground + 90} rx={160} ry={18} fill="#ff6a3d" opacity={0.12} />
      ))}
      {/* the flickering lamp */}
      <rect x={1520} y={600} width={10} height={ground - 600} fill="#0e0b0e" />
      <rect x={1490} y={590} width={70} height={18} fill="#0e0b0e" />
      <ellipse cx={1530} cy={1000} rx={500} ry={700} fill="url(#lampGlow)" opacity={0.7 * lamp} />
      <circle cx={1530} cy={612} r={10} fill="#FFE7B0" opacity={lamp} />
    </g>
  );
};

// Biscuit: a scruffy medium dog, side view facing +x. `bark` 0..1 opens the mouth and lifts the head.
export const Dog: React.FC<{ x: number; y: number; scale?: number; bark: number; walk?: number; flip?: boolean }> = ({ x, y, scale = 1, bark, walk = 0, flip = false }) => {
  const leg = (i: number) => Math.sin(walk * Math.PI * 2 + (i % 2 ? Math.PI : 0)) * 14 * (walk ? 1 : 0);
  const col = "#9a7448";
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {[-46, -30, 30, 46].map((lx, i) => (
        <line key={i} x1={lx} y1={-52} x2={lx + leg(i)} y2={0} stroke={col} strokeWidth={11} strokeLinecap="round" />
      ))}
      <ellipse cx={0} cy={-62} rx={62} ry={28} fill={col} />
      <path d={`M -58 -70 Q -96 ${-110 + Math.sin(walk * 9 + bark * 8) * 10} -86 -116`} stroke={col} strokeWidth={10} fill="none" strokeLinecap="round" />
      <g transform={`translate(52 -78) rotate(${-bark * 18})`}>
        <ellipse cx={16} cy={-14} rx={26} ry={22} fill={col} />
        <path d="M 2 -30 L -8 -6 L 12 -16 Z" fill="#6e5032" />
        <path d={`M 30 -16 L 54 ${-12} L 54 ${-4 + bark * 6} L 32 ${-2 + bark * 10} Z`} fill={col} />
        {bark > 0.1 ? <path d={`M 34 -6 L 54 ${-4 + bark * 6} L 34 ${2 + bark * 8} Z`} fill="#3a1f18" /> : null}
        <circle cx={22} cy={-20} r={3.5} fill="#111" />
        <circle cx={55} cy={-12} r={4} fill="#111" />
      </g>
    </g>
  );
};

// ================= Part 4: the fence, the street, the rooftop =================
// A chain-link fence closing the alley's far end (side view, drawn as a panel with depth).
export const FENCE = { x: -260, w: 90, top: 1060 };
export const Fence: React.FC<{ shake: number; frame: number }> = ({ shake, frame }) => {
  const { x, w, top } = FENCE;
  const g = ALLEY.ground;
  const dx = Math.sin(frame * 2.7) * shake * 6;
  return (
    <g transform={`translate(${dx} 0)`}>
      <rect x={x} y={top} width={w} height={g - top} fill="#1a1416" opacity={0.25} />
      {Array.from({ length: 16 }, (_, i) => (
        <g key={i} stroke="#8a8f99" strokeWidth={2.5} opacity={0.75}>
          <line x1={x} y1={top + i * 28} x2={x + w} y2={top + i * 28 + 60} />
          <line x1={x + w} y1={top + i * 28} x2={x} y2={top + i * 28 + 60} />
        </g>
      ))}
      <rect x={x - 6} y={top - 10} width={12} height={g - top + 10} fill="#5d626b" />
      <rect x={x + w - 6} y={top - 10} width={12} height={g - top + 10} fill="#5d626b" />
      <rect x={x - 10} y={top - 14} width={w + 20} height={10} fill="#5d626b" />
      {/* the hole Biscuit squeezes through */}
      <path d={`M ${x + 10} ${g} Q ${x + 45} ${g - 90} ${x + 80} ${g} Z`} fill="#0e0a0d" />
    </g>
  );
};

// The street: building fronts, and one building whose roof Kai and Mia reach by its drop ladder.
export const STREET = { ground: 1500, roof: 620, ladderX: 1410, buildingX: 1240, buildingW: 900 };
export const Street: React.FC<{ frame: number; ladderBottom: number; children?: React.ReactNode }> = ({ frame, ladderBottom, children }) => {
  const { ground, roof, ladderX, buildingX, buildingW } = STREET;
  return (
    <g>
      <rect x={-1600} y={-1200} width={5600} height={ground + 1200} fill="url(#sky)" />
      {Array.from({ length: 14 }, (_, i) => {
        const bx = -1500 + i * 230;
        const h = 500 + rand(i + 70) * 420;
        return (
          <g key={i}>
            <rect x={bx} y={ground - h} width={210} height={h} fill={i % 2 ? "#2b1719" : "#33191b"} />
            {Array.from({ length: 6 }, (_, r) => (
              <rect key={r} x={bx + 30 + (r % 2) * 90} y={ground - h + 60 + Math.floor(r / 2) * 140} width={50} height={70} fill={rand(i * 7 + r) > 0.75 ? "#5a3a20" : "#140c0e"} />
            ))}
            <rect x={bx + 20} y={ground - 160} width={170} height={160} fill="#1a0f11" />
          </g>
        );
      })}
      {/* the climbing building */}
      <rect x={buildingX} y={roof} width={buildingW} height={ground - roof} fill="#4a2a26" />
      {Array.from({ length: Math.ceil((ground - roof) / 26) }, (_, r) => (
        <line key={r} x1={buildingX} y1={roof + r * 26} x2={buildingX + buildingW} y2={roof + r * 26} stroke="#3c211e" strokeWidth={3} />
      ))}
      <rect x={buildingX - 10} y={roof - 40} width={buildingW + 20} height={44} fill="#2f1a17" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}-${c}`} x={buildingX + 260 + c * 160} y={roof + 90 + r * 230} width={90} height={130} fill="#120a0b" stroke="#2f1a17" strokeWidth={10} />
        )),
      )}
      {/* drop ladder: the bottom end slides up when they pull it */}
      <g stroke="#15161b" strokeLinecap="round">
        <line x1={ladderX} y1={roof - 30} x2={ladderX} y2={ladderBottom} strokeWidth={8} />
        <line x1={ladderX + 54} y1={roof - 30} x2={ladderX + 54} y2={ladderBottom} strokeWidth={8} />
        {Array.from({ length: Math.max(0, Math.floor((ladderBottom - roof) / 40)) }, (_, i) => (
          <line key={i} x1={ladderX} y1={roof + 10 + i * 40} x2={ladderX + 54} y2={roof + 10 + i * 40} strokeWidth={6} />
        ))}
      </g>
      <rect x={-1600} y={ground} width={5600} height={900} fill="#16101a" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={-1400 + i * 600} y={ground + 120} width={200} height={10} fill="#3a2a2c" />
      ))}
      {children}
      <ellipse cx={600 + Math.sin(frame * 0.05) * 30} cy={ground - 300} rx={900} ry={500} fill="url(#duskGlow)" opacity={0.5} />
    </g>
  );
};

// Night sky that darkens through the hours: 0 = blood-orange dusk, 1 = deep night with stars and a moon.
export const NightSky: React.FC<{ t: number; frame: number; moonY: number; drift?: number }> = ({ t, frame, moonY, drift = frame * 0.3 }) => (
  <g>
    <rect x={-1600} y={-1600} width={4400} height={3600} fill="url(#sky)" />
    <rect x={-1600} y={-1600} width={4400} height={3600} fill="#070a1c" opacity={0.92 * t} />
    {Array.from({ length: 70 }, (_, i) => (
      <circle key={i} cx={-400 + rand(i + 300) * 1900} cy={-300 + rand(i + 400) * 1100} r={1.5 + rand(i + 500) * 2} fill="#fff" opacity={t * (0.4 + 0.6 * Math.abs(Math.sin(frame * 0.05 + i)))} />
    ))}
    <circle cx={820} cy={moonY} r={70} fill="#f3ecd7" opacity={0.3 + 0.7 * t} />
    <circle cx={850} cy={moonY - 18} r={62} fill="#070a1c" opacity={0.25 * t} />
    <circle cx={820} cy={moonY} r={150} fill="#f3ecd7" opacity={0.08 * t} filter="url(#soft)" />
    {/* clouds; `drift` runs them fast during a time-lapse */}
    {Array.from({ length: 6 }, (_, i) => {
      const x = ((rand(i + 800) * 2400 + drift * (1 + (i % 3) * 0.6)) % 2600) - 800;
      return <ellipse key={i} cx={x} cy={40 + rand(i + 810) * 600} rx={260 + rand(i + 820) * 200} ry={50 + rand(i + 830) * 40} fill="#1a1d33" opacity={0.25 + 0.5 * t} filter="url(#soft)" />;
    })}
  </g>
);

// Rooftop view across the street canyon: the dead flow along the street between our ledge and the far buildings.
export const ROOF = { ledge: 1360, street: [1170, 1330] as [number, number] };
export const RooftopView: React.FC<{ frame: number; night: number; children?: React.ReactNode }> = ({ frame, night, children }) => {
  const { ledge, street } = ROOF;
  return (
    <g>
      {/* far buildings, some burning */}
      {Array.from({ length: 12 }, (_, i) => {
        const bx = -800 + i * 240;
        const h = 380 + rand(i + 900) * 520;
        const fire = rand(i + 950) > 0.72;
        return (
          <g key={i}>
            <rect x={bx} y={street[0] - h} width={226} height={h} fill={night > 0.5 ? "#141420" : "#2a1418"} />
            {Array.from({ length: 8 }, (_, r) => (
              <rect key={r} x={bx + 24 + (r % 3) * 66} y={street[0] - h + 40 + Math.floor(r / 3) * 110} width={36} height={56} fill={rand(i * 13 + r) > 0.82 ? "#e7b25a" : "#0b0b12"} opacity={0.9} />
            ))}
            {fire ? <ellipse cx={bx + 113} cy={street[0] - h} rx={70 + Math.sin(frame * 0.3 + i) * 10} ry={40 + Math.sin(frame * 0.4 + i) * 8} fill="#ff7a2d" opacity={0.55} filter="url(#soft)" /> : null}
          </g>
        );
      })}
      {/* the street far below */}
      <rect x={-1600} y={street[0]} width={4400} height={street[1] - street[0]} fill="#120c12" />
      {children}
      {/* our rooftop: ledge and roof surface */}
      <rect x={-1600} y={ledge} width={4400} height={40} fill="#3a2f33" />
      <rect x={-1600} y={ledge + 40} width={4400} height={900} fill="#221a1f" />
      <rect x={-1600} y={ledge + 40} width={4400} height={14} fill="#15101a" />
      <rect x={120} y={ledge + 140} width={120} height={90} fill="#2c2328" />
      <rect x={160} y={ledge + 80} width={40} height={60} fill="#2c2328" />
    </g>
  );
};

// The river of the dead: rows of tiny silhouettes with glowing eyes, flowing along the street.
// `flow` drives the walking (defaults to the frame; run it faster for a time-lapse)
export const DeadRiver: React.FC<{ frame: number; flow?: number; density?: number }> = ({ frame, flow = frame, density = 1 }) => {
  const [y0, y1] = ROOF.street;
  const rows = 4;
  return (
    <g>
      {Array.from({ length: rows }, (_, r) => {
        const y = y0 + 30 + r * ((y1 - y0 - 30) / rows);
        const sc = 0.13 + r * 0.035;
        const speed = 0.7 + r * 0.25;
        const n = Math.round((26 + r * 6) * density);
        return Array.from({ length: n }, (_, i) => {
          const span = 2600;
          const x = -900 + (((i / n) * span + flow * speed + rand(i + r * 50) * 60) % span);
          const bob = Math.abs(Math.sin(frame * 0.2 + i)) * 4;
          return (
            <g key={`${r}-${i}`} transform={`translate(${x} ${y - bob}) scale(${sc})`}>
              <line x1={0} y1={0} x2={0} y2={-200} stroke="#0d090c" strokeWidth={46} strokeLinecap="round" />
              <circle cx={10} cy={-230} r={34} fill="#0d090c" />
              <circle cx={4} cy={-236} r={9} fill="#B6FF5C" opacity={0.85} />
              <circle cx={24} cy={-234} r={8} fill="#B6FF5C" opacity={0.85} />
              <line x1={0} y1={-170} x2={70} y2={-150 + Math.sin(frame * 0.3 + i) * 10} stroke="#0d090c" strokeWidth={22} strokeLinecap="round" />
            </g>
          );
        });
      })}
    </g>
  );
};

export const Helicopter: React.FC<{ x: number; y: number; frame: number; beam: number; beamX: number; beamY: number }> = ({ x, y, frame, beam, beamX, beamY }) => (
  <g>
    {beam > 0 ? <polygon points={`${x - 10},${y + 30} ${x + 10},${y + 30} ${beamX + 140},${beamY} ${beamX - 140},${beamY}`} fill="#f6f1d8" opacity={0.16 * beam} /> : null}
    {beam > 0 ? <ellipse cx={beamX} cy={beamY} rx={150} ry={34} fill="#f6f1d8" opacity={0.28 * beam} /> : null}
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={0} rx={60} ry={30} fill="#0c0c12" />
      <rect x={40} y={-10} width={130} height={14} fill="#0c0c12" />
      <rect x={160} y={-34} width={12} height={40} fill="#0c0c12" />
      <line x1={-20} y1={34} x2={40} y2={34} stroke="#0c0c12" strokeWidth={6} />
      <ellipse cx={0} cy={-36} rx={150} ry={6} fill="#0c0c12" opacity={0.35 + 0.3 * Math.abs(Math.sin(frame * 1.7))} />
      <circle cx={-48} cy={4} r={5} fill="#ff3b30" opacity={Math.floor(frame / 10) % 2 ? 1 : 0.15} />
    </g>
  </g>
);

// Mia's walkie-talkie; `live` makes it crackle (blinking screen and LED, static rings)
export const Walkie: React.FC<{ x: number; y: number; live: number; frame: number; angle?: number }> = ({ x, y, live, frame, angle = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x={-14} y={-30} width={28} height={50} rx={6} fill="#22252c" stroke="#4a4f5a" strokeWidth={3} />
    <rect x={6} y={-58} width={6} height={30} rx={3} fill="#22252c" />
    <rect x={-9} y={-20} width={18} height={14} rx={2} fill={live > 0 ? "#7fe3ff" : "#11141a"} opacity={live > 0 ? 0.5 + 0.5 * Math.abs(Math.sin(frame * 0.9)) : 1} />
    <circle cx={-6} cy={8} r={3} fill={live > 0 && Math.floor(frame / 4) % 2 ? "#ff3b30" : "#3a1414"} />
    {live > 0
      ? [0, 1, 2].map((k) => {
          const p = (frame * 0.08 + k / 3) % 1;
          return <path key={k} d={`M ${18 + p * 40} ${-30 - p * 20} q ${8 + p * 10} ${16 + p * 10} 0 ${32 + p * 20}`} stroke="#7fe3ff" strokeWidth={3} fill="none" opacity={live * (1 - p)} />;
        })
      : null}
  </g>
);
