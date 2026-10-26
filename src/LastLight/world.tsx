import React from "react";
import { POSES, Pose, StickFigure } from "../shared/rig";

// Shared set for LAST LIGHT: Kai's apartment, the street outside the window, and the undead.
// World units: 2160 x 1920, floor at SET.floor. Everything is procedural.

export const SET = {
  floor: 1520,
  window: { x: 150, y: 620, w: 600, h: 640 },
  street: 1120, // where people stand across the street, seen through the window
  counter: { x: 820, w: 360, top: 1300 },
  tv: { x: 1290, y: 860, w: 360, h: 220 },
  lamp: { x: 1222, top: 960 },
  door: { x: 1860, y: 880, w: 230 },
  dresser: { w: 150, h: 230 },
};

// Deterministic pseudo-random in [0, 1)
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const Defs: React.FC = () => (
  <defs>
    <filter id="zombieGlow" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation={2.5} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={18} />
    </filter>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2a0d1c" />
      <stop offset="0.55" stopColor="#8f2431" />
      <stop offset="1" stopColor="#ff7a3d" />
    </linearGradient>
    <radialGradient id="lampGlow">
      <stop offset="0" stopColor="#FFC879" stopOpacity={0.55} />
      <stop offset="1" stopColor="#FFC879" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="redGlow">
      <stop offset="0" stopColor="#FF3B30" stopOpacity={0.6} />
      <stop offset="1" stopColor="#FF3B30" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="duskGlow">
      <stop offset="0" stopColor="#FF7A3D" stopOpacity={0.35} />
      <stop offset="1" stopColor="#FF7A3D" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="greenGlow">
      <stop offset="0" stopColor="#9CFF57" stopOpacity={0.3} />
      <stop offset="1" stopColor="#9CFF57" stopOpacity={0} />
    </radialGradient>
    <clipPath id="windowClip">
      <rect x={SET.window.x} y={SET.window.y} width={SET.window.w} height={SET.window.h} />
    </clipPath>
    <clipPath id="tvClip">
      <rect x={SET.tv.x} y={SET.tv.y} width={SET.tv.w} height={SET.tv.h} rx={8} />
    </clipPath>
  </defs>
);

// ---------- Outside the window ----------
export const Outside: React.FC<{ frame: number; children?: React.ReactNode }> = ({ frame, children }) => {
  const { x, y, w, h } = SET.window;
  const towers = Array.from({ length: 12 }, (_, i) => ({ x: x - 20 + i * 56, w: 40 + rand(i) * 30, h: 90 + rand(i + 40) * 170 }));
  return (
    <g clipPath="url(#windowClip)">
      <rect x={x} y={y} width={w} height={h} fill="url(#sky)" />
      <circle cx={330} cy={1050} r={90} fill="#FFB36B" opacity={0.9} filter="url(#soft)" />
      <circle cx={330} cy={1050} r={62} fill="#FFC88A" />
      {/* distant smoke plume — something is already wrong */}
      {Array.from({ length: 7 }, (_, i) => {
        const t = (frame * 0.4 + i * 40) % 280;
        return <circle key={i} cx={640 + Math.sin((frame + i * 30) * 0.02) * 14 + t * 0.15} cy={960 - t} r={22 + t * 0.18} fill="#1a0c12" opacity={0.55 * (1 - t / 280)} />;
      })}
      {towers.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={1100 - b.h} width={b.w} height={b.h + 20} fill="#2a1218" />
          {rand(i + 7) > 0.55 ? <rect x={b.x + 10} y={1100 - b.h + 20} width={8} height={10} fill="#FFCF7A" opacity={0.7} /> : null}
        </g>
      ))}
      {/* Mr. Dawson's house across the street */}
      <polygon points="430,1000 560,930 690,1000" fill="#1e0e14" />
      <rect x={450} y={1000} width={220} height={120} fill="#1e0e14" />
      <rect x={480} y={1030} width={38} height={34} fill="#FFB86B" opacity={0.85} />
      <rect x={600} y={1050} width={40} height={70} fill="#120709" />
      <rect x={x} y={SET.street} width={w} height={300} fill="#1b0f14" />
      <rect x={x} y={SET.street - 4} width={w} height={8} fill="#3a1c22" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x + 20 + i * 130} y={1210} width={70} height={8} fill="#4a2a2c" />
      ))}
      <rect x={244} y={900} width={8} height={222} fill="#120709" />
      <circle cx={248} cy={900} r={40} fill="#FFD9A0" opacity={0.25} filter="url(#soft)" />
      {children}
    </g>
  );
};

export const WindowFrame: React.FC = () => {
  const { x, y, w, h } = SET.window;
  return (
    <g>
      <rect x={x - 22} y={y - 22} width={w + 44} height={h + 44} fill="none" stroke="#0d0f15" strokeWidth={28} />
      <rect x={x + w / 2 - 7} y={y} width={14} height={h} fill="#0d0f15" />
      <rect x={x} y={y + h * 0.46} width={w} height={14} fill="#0d0f15" />
      <rect x={x - 40} y={y + h + 8} width={w + 80} height={26} fill="#0d0f15" />
      {/* glass sheen */}
      <polygon points={`${x + 40},${y + 20} ${x + 120},${y + 20} ${x + 30},${y + 200} ${x + 10},${y + 200}`} fill="#fff" opacity={0.05} />
    </g>
  );
};

// ---------- Inside ----------
export const Room: React.FC = () => {
  const { floor, counter, tv, lamp, door } = SET;
  return (
    <g>
      <rect x={-1200} y={-1000} width={4600} height={floor + 1000} fill="#3a4458" />
      {Array.from({ length: 40 }, (_, i) => (
        <rect key={i} x={-1200 + i * 120} y={-1000} width={4} height={floor + 1000} fill="#465169" />
      ))}
      <rect x={-1200} y={floor - 30} width={4600} height={30} fill="#262d3b" />
      <rect x={-1200} y={floor} width={4600} height={1400} fill="#1c212c" />
      {Array.from({ length: 14 }, (_, i) => (
        <line key={i} x1={-1200} y1={floor + 40 + i * 60} x2={3400} y2={floor + 40 + i * 60} stroke="#232937" strokeWidth={3} />
      ))}
      {/* framed photo */}
      <rect x={1000} y={760} width={130} height={100} fill="#1f2533" stroke="#12151d" strokeWidth={10} />
      <circle cx={1050} cy={800} r={14} fill="#2c3445" />
      <circle cx={1085} cy={805} r={11} fill="#2c3445" />
      {/* kitchen counter + coffee machine */}
      <rect x={counter.x} y={counter.top} width={counter.w} height={floor - counter.top} fill="#141822" />
      <rect x={counter.x - 10} y={counter.top - 16} width={counter.w + 20} height={18} fill="#0f121a" />
      <rect x={1078} y={1176} width={84} height={108} rx={8} fill="#0b0d13" />
      <rect x={1094} y={1236} width={30} height={34} fill="#1d222e" />
      <circle cx={1142} cy={1196} r={5} fill="#FF4B3E" />
      {/* TV + console */}
      <rect x={tv.x - 14} y={tv.y - 14} width={tv.w + 28} height={tv.h + 28} rx={14} fill="#0b0d13" />
      <rect x={1270} y={1340} width={400} height={floor - 1340} fill="#161a24" />
      <rect x={1290} y={1370} width={170} height={10} fill="#0e1118" />
      <rect x={1480} y={1370} width={170} height={10} fill="#0e1118" />
      {/* floor lamp */}
      <rect x={lamp.x - 4} y={lamp.top + 50} width={8} height={floor - lamp.top - 50} fill="#0e1118" />
      <ellipse cx={lamp.x} cy={floor - 4} rx={36} ry={8} fill="#0e1118" />
      <polygon points={`${lamp.x - 34},${lamp.top} ${lamp.x + 34},${lamp.top} ${lamp.x + 56},${lamp.top + 64} ${lamp.x - 56},${lamp.top + 64}`} fill="#E9C48A" />
      {/* door frame */}
      <rect x={door.x - 18} y={door.y - 18} width={door.w + 36} height={floor - door.y + 18} fill="#10131b" />
    </g>
  );
};

export const Door: React.FC<{ shake: number }> = ({ shake }) => {
  const { x, y, w } = SET.door;
  const h = SET.floor - y;
  return (
    <g transform={`translate(${-shake * 9} 0) rotate(${-shake * 0.8} ${x + w} ${y + h})`}>
      <rect x={x} y={y} width={w} height={h} fill="#5a3b2a" />
      <rect x={x + 26} y={y + 30} width={w - 52} height={h * 0.38} fill="none" stroke="#4a2f21" strokeWidth={8} />
      <rect x={x + 26} y={y + 60 + h * 0.4} width={w - 52} height={h * 0.45} fill="none" stroke="#4a2f21" strokeWidth={8} />
      <circle cx={x + 34} cy={y + h * 0.53} r={11} fill="#C9A15A" />
      <rect x={x + 26} y={y + h * 0.53 - 40} width={18} height={10} fill="#C9A15A" />
    </g>
  );
};

export const Dresser: React.FC<{ x: number }> = ({ x }) => {
  const { w, h } = SET.dresser;
  const top = SET.floor - h;
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} fill="#2b2230" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={x + 10} y={top + 14 + i * 70} width={w - 20} height={58} fill="#3a2e40" />
          <rect x={x + w / 2 - 14} y={top + 38 + i * 70} width={28} height={8} rx={4} fill="#C9A15A" />
        </g>
      ))}
      <rect x={x + 20} y={top - 46} width={30} height={46} fill="#5B7A99" />
      <circle cx={x + 105} cy={top - 18} r={18} fill="#7a5a3a" />
    </g>
  );
};

export const TVScreen: React.FC<{ frame: number; since: number; dead?: number }> = ({ frame, since, dead = Infinity }) => {
  const { x, y, w, h } = SET.tv;
  // The broadcast cuts out: a burst of static, then a dark "NO SIGNAL" screen
  if (since >= dead + 8) {
    return (
      <g clipPath="url(#tvClip)">
        <rect x={x} y={y} width={w} height={h} fill="#0a0d16" />
        <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={30} fill="#3c4a66" opacity={Math.floor(frame / 20) % 2 ? 0.9 : 0.5}>
          NO SIGNAL
        </text>
      </g>
    );
  }
  if (since < 0 || (since >= dead && since < dead + 8)) {
    if (since >= dead) {
      return (
        <g clipPath="url(#tvClip)">
          <rect x={x} y={y} width={w} height={h} fill="#555" />
          {Array.from({ length: 60 }, (_, i) => (
            <rect key={i} x={x + rand(i + frame * 3) * w} y={y + rand(i * 7 + frame) * h} width={20 + rand(i + 9) * 60} height={4} fill={rand(i + frame) > 0.5 ? "#ddd" : "#222"} />
          ))}
        </g>
      );
    }
    return (
      <g clipPath="url(#tvClip)">
        <rect x={x} y={y} width={w} height={h} fill="#06080c" />
        <polygon points={`${x + 30},${y} ${x + 90},${y} ${x + 10},${y + h} ${x - 50},${y + h}`} fill="#fff" opacity={0.05} />
      </g>
    );
  }
  if (since < 9) {
    return (
      <g clipPath="url(#tvClip)">
        <rect x={x} y={y} width={w} height={h} fill="#555" />
        {Array.from({ length: 60 }, (_, i) => (
          <rect key={i} x={x + rand(i + frame * 3) * w} y={y + rand(i * 7 + frame) * h} width={20 + rand(i + 9) * 60} height={4} fill={rand(i + frame) > 0.5 ? "#ddd" : "#222"} />
        ))}
      </g>
    );
  }
  const blink = Math.floor(frame / 8) % 2 === 0;
  const ticker = "LOCK YOUR DOORS  •  DO NOT LET ANYONE IN  •  STAY INDOORS  •  ";
  return (
    <g clipPath="url(#tvClip)">
      <rect x={x} y={y} width={w} height={h} fill="#7d0b12" />
      <rect x={x} y={y} width={w} height={54} fill={blink ? "#FF2D2D" : "#c4141c"} />
      <text x={x + w / 2} y={y + 38} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={30} fill="#fff">
        ⚠ EMERGENCY ALERT
      </text>
      <text x={x + w / 2} y={y + 118} textAnchor="middle" fontFamily='"Arial Black", Impact, sans-serif' fontSize={46} fill="#fff">
        STAY INDOORS
      </text>
      <rect x={x} y={y + h - 44} width={w} height={44} fill="#000" opacity={0.6} />
      <text x={x + w - ((frame * 4) % 900)} y={y + h - 14} fontFamily="Arial, sans-serif" fontWeight={700} fontSize={22} fill="#FFD43B">
        {ticker + ticker}
      </text>
      {Array.from({ length: 22 }, (_, i) => (
        <rect key={i} x={x} y={y + i * 10} width={w} height={2} fill="#000" opacity={0.18} />
      ))}
    </g>
  );
};

// ---------- The undead ----------
const reach: Pose = { ...POSES.stand, tilt: 12, duck: 0.3, lUA: -150, lFA: -165, rUA: 150, rFA: 168 };

export const Zombie: React.FC<{ x: number; y: number; scale: number; pose: Pose; frame: number; glow: number; color?: string; flip?: boolean }> = ({ x, y, scale, pose, frame, glow, color = "#56604f", flip }) => (
  <StickFigure pose={pose} x={x} y={y} scale={scale} frame={frame} color={color} zombie={{ glow }} flip={flip} face={{ worry: 0, smile: 0, mouth: 0, sweat: 0 }} />
);

// The crowd at the window: three depth rows, the front row pressing on the glass.
export const Horde: React.FC<{ frame: number; reveal: number }> = ({ frame, reveal }) => {
  if (reveal <= 0) return null;
  const rows = [
    { n: 13, y: SET.street + 6, s: 0.3, color: "#2a1a1f", spread: 640, y0: 0 },
    { n: 7, y: 1300, s: 0.62, color: "#211418", spread: 620, y0: 1 },
    { n: 4, y: 1540, s: 1.3, color: "#170e11", spread: 560, y0: 2 },
  ];
  return (
    <g opacity={Math.min(1, reveal * 1.5)}>
      {rows.map((r, ri) =>
        Array.from({ length: r.n }, (_, i) => {
          const k = ri * 31 + i;
          const x = SET.window.x - 10 + (i + 0.5) * (r.spread / r.n) + (rand(k) - 0.5) * 30 + Math.sin(frame * 0.05 + k) * 5;
          const pose = { ...reach, tilt: 8 + rand(k + 3) * 20 + Math.sin(frame * 0.3 + k) * 4, lUA: reach.lUA + Math.sin(frame * 0.4 + k) * 8, rUA: reach.rUA - Math.sin(frame * 0.37 + k) * 8 };
          // rows arrive back to front
          const arrive = Math.min(1, Math.max(0, reveal * 3 - r.y0 * 0.6));
          return <Zombie key={k} x={x} y={r.y + (1 - arrive) * 60} scale={r.s * (0.9 + rand(k + 9) * 0.2)} pose={pose} frame={frame} glow={1} color={r.color} />;
        }),
      )}
    </g>
  );
};

// Hands slapping against the glass
export const HandPrints: React.FC<{ frame: number; t: number }> = ({ frame, t }) => {
  const prints = [
    [300, 880, 0],
    [430, 800, 0.15],
    [580, 900, 0.3],
    [680, 820, 0.42],
    [230, 1050, 0.55],
    [620, 1070, 0.68],
    [470, 1010, 0.8],
  ];
  return (
    <g>
      {prints.map(([px, py, at], i) => {
        const p = (t - at) * 6;
        if (p <= 0) return null;
        const slap = Math.max(0, 1 - p) * 0.25;
        const jitter = Math.sin(frame * 1.7 + i) * 2;
        return (
          <g key={i} transform={`translate(${px + jitter} ${py}) scale(${1 + slap}) rotate(${(rand(i) - 0.5) * 40})`} opacity={Math.min(1, p) * 0.9}>
            <ellipse rx={30} ry={36} fill="#160f12" />
            {[-24, -9, 7, 22].map((fx, j) => (
              <rect key={j} x={fx - 6} y={-86 + Math.abs(fx) * 0.8} width={12} height={52} rx={6} fill="#160f12" />
            ))}
            <rect x={24} y={-30} width={12} height={40} rx={6} fill="#160f12" transform="rotate(35 30 -10)" />
          </g>
        );
      })}
    </g>
  );
};

export const Crack: React.FC<{ progress: number }> = ({ progress }) => {
  if (progress <= 0) return null;
  const cx = 470;
  const cy = 930;
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + rand(i) * 0.5;
    const len = 140 + rand(i + 20) * 260;
    const pts: string[] = [`${cx},${cy}`];
    let px = cx;
    let py = cy;
    for (let k = 1; k <= 4; k++) {
      const aa = a + (rand(i * 9 + k) - 0.5) * 0.6;
      px += Math.cos(aa) * (len / 4);
      py += Math.sin(aa) * (len / 4);
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return { d: `M ${pts.join(" L ")}`, len };
  });
  return (
    <g clipPath="url(#windowClip)">
      {rays.map((r, i) => (
        <g key={i}>
          <path d={r.d} stroke="#000" strokeWidth={7} fill="none" strokeDasharray={r.len * 1.2} strokeDashoffset={r.len * 1.2 * (1 - progress)} opacity={0.5} />
          <path d={r.d} stroke="#F2F6FF" strokeWidth={3} fill="none" strokeDasharray={r.len * 1.2} strokeDashoffset={r.len * 1.2 * (1 - progress)} />
        </g>
      ))}
      <circle cx={cx} cy={cy} r={16 * Math.min(1, progress * 4)} fill="none" stroke="#F2F6FF" strokeWidth={3} />
    </g>
  );
};
