import React from "react";

// The cable room above Floor 99: steel cables on roof pulleys, each with a THEO name tag
export const AF = 1500;
export const ROOF = 120;
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const tagY = (x: number) => 1000 + rand(x) * 90;

// One cable: a pulley in the roof, a steel line down through a hole in the floor, and a name tag
// shake: 0 calm, 1 every cable in the room thrashing (something pulling from below)
export const Cable: React.FC<{ x: number; frame: number; num: string; cut?: number; mine?: boolean; shake?: number }> = ({ x, frame, num, cut = -1, mine = false, shake = 0 }) => {
  const sway = Math.sin(frame * 0.05 + x * 0.01) * 6 + shake * Math.sin(frame * 1.3 + x * 0.07) * 26;
  const ty = tagY(x);
  const spin = frame * (2 + rand(x) * 3);
  if (cut >= 0) {
    // snapped: the top half whips back up, the bottom half drops through the floor
    const cy = 700;
    const up = Math.max(ROOF + 60, cy - cut * 46);
    const whip = Math.sin(cut * 1.1) * Math.max(0, 60 - cut * 2);
    const down = cy + cut * 22 + cut * cut * 2.4;
    return (
      <g>
        <circle cx={x} cy={ROOF} r={46} fill="#2b2f36" stroke="#4a4f57" strokeWidth={6} />
        <path d={`M ${x} ${ROOF + 46} Q ${x + whip} ${(ROOF + up) / 2} ${x + whip * 0.4} ${up}`} stroke="#9aa3ad" strokeWidth={9} fill="none" />
        <line x1={x - whip * 0.3} y1={down} x2={x} y2={down + 900} stroke="#9aa3ad" strokeWidth={9} />
        <g transform={`translate(${x} ${down + ty - cy}) rotate(${cut * 4})`}>
          <rect x={-46} y={0} width={92} height={56} rx={6} fill="#efe6cc" />
        </g>
      </g>
    );
  }
  return (
    <g>
      <g transform={`rotate(${spin} ${x} ${ROOF})`}>
        <circle cx={x} cy={ROOF} r={46} fill="#2b2f36" stroke="#4a4f57" strokeWidth={6} />
        <line x1={x - 40} y1={ROOF} x2={x + 40} y2={ROOF} stroke="#4a4f57" strokeWidth={6} />
      </g>
      <path d={`M ${x} ${ROOF + 46} Q ${x + sway} 800 ${x} ${AF}`} stroke="#9aa3ad" strokeWidth={9} fill="none" />
      <g transform={`translate(${x + sway * 0.6} ${ty}) rotate(${Math.sin(frame * 0.07 + x) * 5})`}>
        <line x1={0} y1={-16} x2={0} y2={0} stroke="#b9a37a" strokeWidth={3} />
        <rect x={-46} y={0} width={92} height={56} rx={6} fill={mine ? "#fff1c4" : "#efe6cc"} stroke={mine ? "#ff3b30" : "#9a8a66"} strokeWidth={mine ? 5 : 3} />
        <text x={0} y={24} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={20} fill="#2a2a2a">
          THEO
        </text>
        <text x={0} y={48} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={20} fill={mine ? "#d0201a" : "#8e1b1b"}>
          #{num}
        </text>
      </g>
      <ellipse cx={x} cy={AF + 4} rx={30} ry={8} fill="#000" />
    </g>
  );
};

// Big rusty shears, pivot at (0, 0), blades pointing along +y; `open` 0..1
export const Shears: React.FC<{ open: number }> = ({ open }) => (
  <g>
    {[-1, 1].map((sd) => (
      <g key={sd} transform={`rotate(${sd * open * 16})`}>
        <path d={`M ${sd * 4} -10 L ${sd * 16} 40 L ${sd * 3} 190 L ${-sd * 6} 40 Z`} fill="#b8bec6" stroke="#5d636b" strokeWidth={3} />
        <circle cx={-sd * 22} cy={-46} r={20} fill="none" stroke="#5a2a1c" strokeWidth={9} />
        <line x1={-sd * 2} y1={-6} x2={-sd * 16} y2={-30} stroke="#5a2a1c" strokeWidth={9} />
      </g>
    ))}
    <circle cx={0} cy={0} r={6} fill="#3a3f47" />
  </g>
);

export const AtticLamp: React.FC<{ x: number; on: number; frame: number }> = ({ x, on, frame }) => (
  <g transform={`rotate(${Math.sin(frame * 0.06 + x) * 2.5} ${x} 0)`}>
    <line x1={x} y1={0} x2={x} y2={300} stroke="#111" strokeWidth={4} />
    {on > 0 ? <polygon points={`${x - 30},330 ${x + 30},330 ${x + 340},${AF} ${x - 340},${AF}`} fill="#ffe7a6" opacity={0.13 * on} /> : null}
    {on > 0 ? <circle cx={x} cy={330} r={160} fill="url(#goldGlow0)" opacity={0.5 * on} /> : null}
    <path d={`M ${x - 36} 330 L ${x - 20} 298 L ${x + 20} 298 L ${x + 36} 330 Z`} fill="#2b2f36" />
    <circle cx={x} cy={338} r={14} fill={on > 0.5 ? "#FFE08A" : "#2a2c31"} filter={on > 0.5 ? "url(#glow0)" : undefined} />
  </g>
);
