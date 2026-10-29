import React from "react";
import { rand } from "../LastLight/world";

// Sets shared by every FLOOR 0 episode: the elevator car (a dollhouse cutaway, floor at y = 0),
// the shaft it rides in, and the corridor seen through its doors.

export const CAR = { w: 840, h: 1000, door: { w: 380, h: 700 } };

export const Defs0: React.FC = () => (
  <defs>
    <linearGradient id="steel0" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#2b3038" />
      <stop offset="0.5" stopColor="#3b414b" />
      <stop offset="1" stopColor="#2b3038" />
    </linearGradient>
    <linearGradient id="doorSteel0" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#5b636f" />
      <stop offset="0.45" stopColor="#7d8693" />
      <stop offset="1" stopColor="#555c67" />
    </linearGradient>
    <linearGradient id="brass0" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#d8b06a" />
      <stop offset="1" stopColor="#8f6a34" />
    </linearGradient>
    <radialGradient id="bulbGlow0">
      <stop offset="0" stopColor="#FFD79A" stopOpacity={0.7} />
      <stop offset="1" stopColor="#FFD79A" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="tubeGlow0">
      <stop offset="0" stopColor="#d8fff0" stopOpacity={0.55} />
      <stop offset="1" stopColor="#d8fff0" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="redGlow0">
      <stop offset="0" stopColor="#FF3B30" stopOpacity={0.8} />
      <stop offset="1" stopColor="#FF3B30" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="goldGlow0">
      <stop offset="0" stopColor="#FFD34D" stopOpacity={0.9} />
      <stop offset="1" stopColor="#FFD34D" stopOpacity={0} />
    </radialGradient>
    <filter id="glow0" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation={4} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <clipPath id="doorClip0">
      <rect x={-CAR.door.w / 2} y={-CAR.door.h} width={CAR.door.w} height={CAR.door.h} />
    </clipPath>
    <radialGradient id="vignette0" cx="50%" cy="50%" r="72%">
      <stop offset="0.5" stopColor="#000" stopOpacity={0} />
      <stop offset="1" stopColor="#000" stopOpacity={0.7} />
    </radialGradient>
  </defs>
);

// LED floor read-out
export const Led: React.FC<{ x: number; y: number; text: string; size: number; on?: number }> = ({ x, y, text, size, on = 1 }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily='"Consolas", "Courier New", monospace' fontWeight={700} fontSize={size} fill="#ff3b30" opacity={0.25 + 0.75 * on} filter="url(#glow0)">
    {text}
  </text>
);

// Scratched tally marks, `groups` bundles of five laid out in rows
export const Tallies: React.FC<{ x: number; y: number; cols: number; rows: number; dx: number; dy: number; size: number; skip?: (c: number, r: number) => boolean }> = ({ x, y, cols, rows, dx, dy, size, skip }) => (
  <g stroke="#b9c0c9" strokeLinecap="round" opacity={0.75}>
    {Array.from({ length: cols * rows }, (_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      if (skip?.(c, r)) return null;
      const gx = x + c * dx + (rand(i) - 0.5) * dx * 0.2;
      const gy = y + r * dy + (rand(i + 99) - 0.5) * dy * 0.15;
      const w = size / 220;
      return (
        <g key={i} strokeWidth={Math.max(1.5, size * 0.05)}>
          {[0, 1, 2, 3].map((k) => (
            <line key={k} x1={gx + k * size * 0.22 + (rand(i * 5 + k) - 0.5) * 4 * w} y1={gy} x2={gx + k * size * 0.22 + (rand(i * 7 + k) - 0.5) * 8 * w} y2={gy + size} />
          ))}
          <line x1={gx - size * 0.1} y1={gy + size * 0.75} x2={gx + size * 0.8} y2={gy + size * 0.2} />
        </g>
      );
    })}
  </g>
);

// The elevator car in its own coordinates: x in [-420, 420], ceiling at y = -1000, floor at y = 0.
// `beyond` is drawn inside the door opening (same coordinates, door bottom centre at 0,0).
export const Car: React.FC<{
  frame: number;
  open: number;
  floor: string;
  bulbs: number[];
  swing: number;
  speaker: number;
  lit?: number;
  exterior?: boolean;
  beyond?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ frame, open, floor, bulbs, swing, speaker, lit = -1, exterior = false, beyond, children }) => {
  const { w, h, door } = CAR;
  const light = Math.min(1, (bulbs[0] + bulbs[1] + bulbs[2]) / 3);
  const dw = door.w / 2;
  return (
    <g>
      {exterior ? (
        <g>
          {[-36, 0, 36].map((cx) => (
            <line key={cx} x1={cx} y1={-h - 90} x2={cx + Math.sin(frame * 0.7 + cx) * 10} y2={-h - 3000} stroke="#2a2c31" strokeWidth={10} />
          ))}
          <rect x={-w / 2 - 70} y={-h - 110} width={w + 140} height={h + 230} rx={10} fill="#101115" />
          <rect x={-60} y={-h - 140} width={120} height={50} fill="#1b1d22" />
          {[-1, 1].map((sd) => (
            <rect key={sd} x={sd * (w / 2 + 70) - (sd > 0 ? 0 : 30)} y={-h + 40} width={30} height={160} fill="#3a3c42" />
          ))}
        </g>
      ) : null}
      {/* back wall with brushed steel panels */}
      <rect x={-w / 2} y={-h} width={w} height={h} fill="url(#steel0)" />
      {Array.from({ length: 22 }, (_, i) => (
        <line key={i} x1={-w / 2 + 20 + i * 38} y1={-h} x2={-w / 2 + 20 + i * 38} y2={0} stroke="#fff" strokeOpacity={0.025 + (i % 3) * 0.01} strokeWidth={2} />
      ))}
      <rect x={-w / 2 + 24} y={-h + 60} width={180} height={h - 120} fill="none" stroke="#1f2329" strokeWidth={4} />
      <rect x={w / 2 - 204} y={-h + 60} width={180} height={h - 120} fill="none" stroke="#1f2329" strokeWidth={4} />
      {/* whatever is behind the doors */}
      <g clipPath="url(#doorClip0)">
        <rect x={-dw} y={-door.h} width={door.w} height={door.h} fill="#07080a" />
        {open > 0 ? beyond : null}
        <rect x={-dw - open * dw} y={-door.h} width={dw} height={door.h} fill="url(#doorSteel0)" />
        <rect x={open * dw} y={-door.h} width={dw} height={door.h} fill="url(#doorSteel0)" />
        <line x1={-dw - open * dw + dw - 2} y1={-door.h} x2={-dw - open * dw + dw - 2} y2={0} stroke="#2a2e35" strokeWidth={4} />
        <line x1={open * dw + 2} y1={-door.h} x2={open * dw + 2} y2={0} stroke="#2a2e35" strokeWidth={4} />
      </g>
      <rect x={-dw - 12} y={-door.h - 12} width={door.w + 24} height={door.h + 12} fill="none" stroke="#8a919b" strokeWidth={20} />
      {/* floor read-out */}
      <rect x={-100} y={-door.h - 112} width={200} height={70} rx={10} fill="#060607" stroke="#555b64" strokeWidth={4} />
      <Led x={10} y={-door.h - 60} text={floor} size={50} />
      <path d={`M -78 ${-door.h - 90} l 18 0 l -9 14 Z`} fill="#ff3b30" filter="url(#glow0)" />
      {/* button panel: a hundred buttons, and an empty socket where the ground floor should be */}
      <rect x={250} y={-650} width={124} height={330} rx={8} fill="#1c1f24" stroke="#5a6069" strokeWidth={4} />
      {Array.from({ length: 100 }, (_, i) => {
        const c = i % 10;
        const r = Math.floor(i / 10);
        const on = i + 1 === lit;
        return <circle key={i} cx={262 + c * 11.2} cy={-370 - r * 26} r={4} fill={on ? "#ffb347" : "#8d949e"} filter={on ? "url(#glow0)" : undefined} />;
      })}
      <rect x={300} y={-352} width={22} height={18} fill="#050505" stroke="#3a3e45" strokeWidth={2} />
      {/* the notice and the tally marks of whoever was here before */}
      <rect x={250} y={-300} width={124} height={56} rx={4} fill="url(#brass0)" />
      {[0, 1, 2].map((k) => (
        <rect key={k} x={262} y={-290 + k * 15} width={100 - k * 20} height={6} fill="#5a4220" opacity={0.8} />
      ))}
      <Tallies x={-392} y={-640} cols={6} rows={11} dx={27} dy={30} size={20} />
      {/* handrails */}
      <rect x={-w / 2} y={-380} width={w / 2 - dw - 30} height={12} rx={6} fill="#9aa1aa" />
      <rect x={dw + 30} y={-380} width={w / 2 - dw - 30} height={12} rx={6} fill="#9aa1aa" />
      {/* intercom */}
      <circle cx={-310} cy={-905} r={36} fill="#16181c" stroke="#5a6069" strokeWidth={4} />
      {[-12, 0, 12].flatMap((ox) => [-12, 0, 12].map((oy) => <circle key={`${ox}${oy}`} cx={-310 + ox} cy={-905 + oy} r={3.5} fill="#000" />))}
      {children}
      {/* the car's own light: dark where the bulbs are out (the door opening keeps the light behind it) */}
      <path
        d={`M ${-w / 2} ${-h} H ${w / 2} V 0 H ${-w / 2} Z M ${-dw} ${-door.h} V 0 H ${dw} V ${-door.h} Z`}
        fillRule="evenodd"
        fill="#000"
        opacity={(1 - light) * 0.82}
      />
      {speaker > 0 ? <circle cx={-310} cy={-905} r={110} fill="url(#redGlow0)" opacity={speaker} /> : null}
      {speaker > 0 ? <circle cx={-310} cy={-905} r={20} fill="#ff5a4f" opacity={speaker * 0.8} filter="url(#glow0)" /> : null}
      {/* light from the doorway falling into the car */}
      {open > 0 ? <polygon points={`${-dw * open},0 ${dw * open},0 ${dw * open + 120},60 ${-dw * open - 120},60`} fill="#cfeee0" opacity={0.18 * open} /> : null}
      {/* ceiling, three bulbs */}
      <rect x={-w / 2 - 50} y={-h - 60} width={w + 100} height={60} fill="#121317" />
      {bulbs.map((b, i) => {
        const bx = -250 + i * 250;
        const a = swing * (i === 1 ? 1 : 0.8) * Math.sin(frame * 0.25 + i);
        return (
          <g key={i} transform={`translate(${bx} ${-h}) rotate(${a})`}>
            <line x1={0} y1={0} x2={0} y2={70} stroke="#222" strokeWidth={4} />
            <circle cx={0} cy={140} r={240} fill="url(#bulbGlow0)" opacity={b * 0.75} />
            <circle cx={0} cy={86} r={20} fill={b > 0.3 ? "#fff3c4" : "#3a3a3a"} opacity={0.4 + 0.6 * Math.max(b, 0.3)} filter={b > 0.3 ? "url(#glow0)" : undefined} />
          </g>
        );
      })}
      {/* floor strip and side walls */}
      <polygon points={`${-w / 2},0 ${w / 2},0 ${w / 2 + 50},60 ${-w / 2 - 50},60`} fill="#17181c" />
      <line x1={-w / 2} y1={2} x2={w / 2} y2={2} stroke="#5a6069" strokeWidth={4} />
      <polygon points={`${-w / 2 - 50},${-h - 60} ${-w / 2},${-h} ${-w / 2},0 ${-w / 2 - 50},60`} fill="#1d2026" />
      <polygon points={`${w / 2 + 50},${-h - 60} ${w / 2},${-h} ${w / 2},0 ${w / 2 + 50},60`} fill="#1d2026" />
    </g>
  );
};

// The shaft around a falling car centred at x = cx. `drop` is how far the car has fallen (px).
export const Shaft: React.FC<{ frame: number; drop: number; cx: number; top: number; bottom: number; speed: number }> = ({ frame, drop, cx, top, bottom, speed }) => {
  const span = 520;
  const first = Math.floor((top + drop) / span) - 1;
  const n = Math.ceil((bottom - top) / span) + 3;
  return (
    <g>
      <rect x={cx - 2000} y={top} width={4000} height={bottom - top} fill="#0a0b0e" />
      {/* the shaft wall: beams and painted floor numbers stream upward as the car drops */}
      {Array.from({ length: n }, (_, i) => {
        const k = first + i;
        const y = k * span - drop;
        const num = 88 - k;
        return (
          <g key={k}>
            <rect x={cx - 2000} y={y} width={4000} height={26} fill="#1a1c21" />
            {num > 0 ? (
              <text x={cx - 560} y={y + 150} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={90} fill="#c9a227" opacity={0.55}>
                {num}
              </text>
            ) : null}
          </g>
        );
      })}
      <rect x={cx - 640} y={top} width={34} height={bottom - top} fill="#2b2e35" />
      <rect x={cx + 606} y={top} width={34} height={bottom - top} fill="#2b2e35" />
      {/* speed streaks */}
      {speed > 0
        ? Array.from({ length: 24 }, (_, i) => {
            const x = cx + (rand(i + 300) - 0.5) * 1500;
            const y = top + ((rand(i + 310) * (bottom - top) - frame * speed * 1.6) % (bottom - top) + (bottom - top)) % (bottom - top);
            return <rect key={i} x={x} y={y} width={3} height={160 + rand(i) * 200} fill="#9aa3b5" opacity={0.15 * Math.min(1, speed / 40)} />;
          })
        : null}
    </g>
  );
};

// Brake sparks shooting up from the car's guide shoes
export const Sparks: React.FC<{ frame: number; x: number; y: number; amount: number }> = ({ frame, x, y, amount }) =>
  amount <= 0 ? null : (
    <g>
      {Array.from({ length: 26 }, (_, i) => {
        const life = ((frame * 0.11 + rand(i + 50)) % 1);
        const side = i % 2 ? 1 : -1;
        const sx = x + side * (490 + life * (60 + rand(i) * 140));
        const sy = y - life * (300 + rand(i + 7) * 400) + life * life * 200;
        return <circle key={i} cx={sx} cy={sy} r={5 - life * 3} fill={i % 3 ? "#ffcf6b" : "#fff3c4"} opacity={(1 - life) * amount} filter="url(#glow0)" />;
      })}
    </g>
  );

// ---------- the corridor seen through the doors ----------
// Coordinates of the door opening: bottom centre at (0, 0), eye level at VP.
export const HALL = { vp: -330, w: 250, ceil: -760, end: 11 };
export const proj = (X: number, Y: number, z: number) => ({ x: X / z, y: HALL.vp + (Y - HALL.vp) / z });
export const TUBES = [1.7, 2.4, 3.3, 4.5, 6.1, 8.3];

const quad = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

export const Corridor: React.FC<{
  frame: number;
  tubes: number[];
  dark: number;
  near?: React.ReactNode;
  far?: React.ReactNode;
  front?: React.ReactNode;
}> = ({ frame, tubes, dark, near, far, front }) => {
  const { w, ceil, end } = HALL;
  const zs = Array.from({ length: 16 }, (_, i) => 1.05 * 1.16 ** i).filter((z) => z < end);
  const wall = (sd: number, y0: number, y1: number, fill: string) => <polygon points={quad([proj(sd * w, y0, 1), proj(sd * w, y1, 1), proj(sd * w, y1, end), proj(sd * w, y0, end)])} fill={fill} />;
  const darkRect = { a: proj(-w, ceil, dark), b: proj(w, 0, dark) };
  return (
    <g>
      <rect x={-200} y={-720} width={400} height={730} fill="#1b2928" />
      <polygon points={quad([proj(-w, ceil, 1), proj(w, ceil, 1), proj(w, ceil, end), proj(-w, ceil, end)])} fill="#111918" />
      <polygon points={quad([proj(-w, 0, 1), proj(w, 0, 1), proj(w, 0, end), proj(-w, 0, end)])} fill="#2a2621" />
      {zs.map((z) => (
        <line key={z} x1={proj(-w, 0, z).x} y1={proj(-w, 0, z).y} x2={proj(w, 0, z).x} y2={proj(w, 0, z).y} stroke="#3b352e" strokeWidth={3 / z} />
      ))}
      {[-150, -50, 50, 150].map((X) => (
        <line key={X} x1={proj(X, 0, 1).x} y1={proj(X, 0, 1).y} x2={proj(X, 0, end).x} y2={proj(X, 0, end).y} stroke="#3b352e" strokeWidth={2} />
      ))}
      {[-1, 1].map((sd) => (
        <g key={sd}>
          {wall(sd, ceil, 0, "#1f3333")}
          {wall(sd, -430, 0, "#2e4c52")}
          {zs.map((z) => (
            <g key={z}>
              <line x1={proj(sd * w, 0, z).x} y1={proj(sd * w, 0, z).y} x2={proj(sd * w, -430, z).x} y2={proj(sd * w, -430, z).y} stroke="#18292d" strokeWidth={5 / z} />
              {/* the children's drawings above the lockers */}
              {Math.round(z * 10) % 3 === 0 ? (
                <polygon points={quad([proj(sd * w, -470, z), proj(sd * w, -560, z), proj(sd * w, -560, z * 1.08), proj(sd * w, -470, z * 1.08)])} fill="#d9d2bf" opacity={0.8} />
              ) : null}
            </g>
          ))}
        </g>
      ))}
      {/* the far end: double doors */}
      <rect x={proj(-w, ceil, end).x} y={proj(-w, ceil, end).y} width={(2 * w) / end} height={-ceil / end} fill="#162221" />
      <rect x={proj(-60, -300, end).x} y={proj(-60, -300, end).y} width={120 / end} height={300 / end} fill="#0c1212" />
      {far}
      {/* fluorescent tubes and the pools of light under them */}
      {TUBES.map((z, i) => {
        const l = tubes[i] ?? 0;
        const c = proj(0, ceil + 8, z);
        const f = proj(0, 0, z);
        return (
          <g key={z}>
            <ellipse cx={f.x} cy={f.y} rx={260 / z} ry={70 / z} fill="url(#tubeGlow0)" opacity={l} />
            <ellipse cx={c.x} cy={c.y + 30 / z} rx={240 / z} ry={120 / z} fill="url(#tubeGlow0)" opacity={l * 0.7} />
            <rect x={c.x - 80 / z} y={c.y - 8 / z} width={160 / z} height={16 / z} rx={4 / z} fill={l > 0.4 ? "#effff8" : "#283030"} />
          </g>
        );
      })}
      {near}
      {/* the dark swallowing the hall from the far end */}
      {dark < end ? <rect x={darkRect.a.x} y={darkRect.a.y} width={darkRect.b.x - darkRect.a.x} height={darkRect.b.y - darkRect.a.y} fill="#020303" opacity={0.96} /> : null}
      {front}
      <rect x={-200} y={-720} width={400} height={730} fill="#000" opacity={0.25 + 0.05 * Math.sin(frame * 0.7)} />
    </g>
  );
};

// The girl, seen from the front: red dress, pigtails, a key held out. Feet at (0, 0), ~360 tall.
export const Kid: React.FC<{ x: number; y: number; scale: number; frame: number; tilt?: number; hold?: number; glow?: number; smile?: number }> = ({ x, y, scale, frame, tilt = 0, hold = 1, glow = 0, smile = 0 }) => {
  const hand = { x: 30 + 66 * hold, y: -250 + 10 * hold };
  const sway = Math.sin(frame * 0.08) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <line x1={-20} y1={0} x2={-13} y2={-140} stroke="#111" strokeWidth={14} strokeLinecap="round" />
      <line x1={20} y1={0} x2={13} y2={-140} stroke="#111" strokeWidth={14} strokeLinecap="round" />
      <line x1={-22} y1={-245} x2={-46} y2={-150} stroke="#111" strokeWidth={13} strokeLinecap="round" />
      <polyline points={`22,-245 ${30 + 40 * hold},${-232 + 8 * hold} ${hand.x},${hand.y}`} stroke="#111" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polygon points="0,-262 -64,-118 64,-118" fill="#8e1b1b" />
      <polygon points="0,-262 -18,-222 18,-222" fill="#6a1212" />
      {/* the key and its tag, swinging under her fingers */}
      <g transform={`translate(${hand.x} ${hand.y}) rotate(${sway})`}>
        {glow > 0 ? <circle cx={0} cy={70} r={110} fill="url(#goldGlow0)" opacity={glow} /> : null}
        <circle cx={0} cy={6} r={9} fill="none" stroke="#e8b84a" strokeWidth={5} />
        <line x1={0} y1={14} x2={0} y2={52} stroke="#e8b84a" strokeWidth={6} />
        <path d="M 0 40 h 10 M 0 48 h 8" stroke="#e8b84a" strokeWidth={5} />
        <rect x={-20} y={56} width={40} height={50} rx={6} fill="#f2e3b8" stroke="#b78b35" strokeWidth={3} />
        <text x={0} y={95} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={34} fill="#8e1b1b">
          0
        </text>
      </g>
      <g transform={`translate(0 -282) rotate(${tilt})`}>
        <line x1={0} y1={20} x2={0} y2={0} stroke="#111" strokeWidth={12} />
        <circle cx={-50} cy={-56} r={18} fill="#111" />
        <circle cx={50} cy={-56} r={18} fill="#111" />
        <circle cx={-38} cy={-50} r={6} fill="#8e1b1b" />
        <circle cx={38} cy={-50} r={6} fill="#8e1b1b" />
        <circle cx={0} cy={-40} r={46} fill="#111" />
        <circle cx={-16} cy={-44} r={9} fill="#fff" />
        <circle cx={16} cy={-44} r={9} fill="#fff" />
        <circle cx={-16} cy={-44} r={3.5} fill="#111" />
        <circle cx={16} cy={-44} r={3.5} fill="#111" />
        <path d={`M -10 -18 Q 0 ${-18 + smile * 10} 10 -18`} stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

// The thing in the hall: far too tall, bent under the ceiling, mostly darkness and a grin. Feet at (0, 0), ~740 tall.
export const Tall: React.FC<{ x: number; y: number; scale: number; frame: number; eyes: number; step: number }> = ({ x, y, scale, frame, eyes, step }) => {
  const sw = Math.sin(frame * 0.05) * 6;
  const limbs = `M -36 0 L -20 -330 L 36 0 M -20 -330 L 10 -600 M 10 -600 Q -90 -420 ${-120 + sw} -70 M 10 -600 Q 120 -420 ${130 - sw} -60`;
  return (
    <g transform={`translate(${x} ${y - step * 6}) scale(${scale})`}>
      <path d={limbs} stroke="#2c2e37" strokeWidth={34} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={limbs} stroke="#040405" strokeWidth={26} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[-1, 1].map((sd) => (
        <g key={sd} stroke="#040405" strokeWidth={8} strokeLinecap="round">
          {[-14, 0, 14].map((d) => (
            <line key={d} x1={sd > 0 ? 130 - sw : -120 + sw} y1={sd > 0 ? -60 : -70} x2={(sd > 0 ? 130 - sw : -120 + sw) + d} y2={(sd > 0 ? -60 : -70) + 60} />
          ))}
        </g>
      ))}
      <ellipse cx={30} cy={-668} rx={56} ry={66} fill="#040405" stroke="#2c2e37" strokeWidth={4} />
      <g opacity={eyes} filter="url(#glow0)">
        <circle cx={30} cy={-668} r={150} fill="url(#tubeGlow0)" opacity={0.35} />
        <circle cx={6} cy={-684} r={16} fill="#f4f7ff" />
        <circle cx={56} cy={-682} r={16} fill="#f4f7ff" />
        <path d="M -30 -646 Q 30 -596 92 -646" stroke="#f4f7ff" strokeWidth={8} fill="none" strokeLinecap="round" />
        {[-10, 6, 22, 38, 54, 70].map((tx) => (
          <line key={tx} x1={tx} y1={-640 + Math.abs(tx - 30) * 0.25} x2={tx} y2={-628 + Math.abs(tx - 30) * 0.1} stroke="#f4f7ff" strokeWidth={3} />
        ))}
      </g>
    </g>
  );
};
