import React from "react";
import { rand } from "../LastLight/world";
import { Tallies } from "./elevator";

// Close-up sets, drawn big in their own world coordinates (frame centre around 540, 960).

// The button panel: a hundred buttons, numbered from the bottom up, and a hole where 0 should be.
export const PANEL = { cx: 540, top: 380, row0: 1250, dy: 84, dx: 66, hole: 1430 };
export const PanelClose: React.FC<{ frame: number; lit: number }> = ({ frame, lit }) => {
  const { cx, top, row0, dy, dx, hole } = PANEL;
  return (
    <g>
      <rect x={-400} y={-200} width={1880} height={2400} fill="#2f343c" />
      {Array.from({ length: 40 }, (_, i) => (
        <line key={i} x1={-400 + i * 48} y1={-200} x2={-400 + i * 48} y2={2200} stroke="#fff" strokeOpacity={0.02 + (i % 3) * 0.01} strokeWidth={3} />
      ))}
      <rect x={cx - 380} y={top} width={760} height={1260} rx={28} fill="#1a1d22" stroke="#6b727c" strokeWidth={10} />
      {[0, 1].flatMap((a) => [0, 1].map((b) => <circle key={`${a}${b}`} cx={cx - 350 + a * 700} cy={top + 30 + b * 1200} r={9} fill="#7a818b" />))}
      {Array.from({ length: 100 }, (_, i) => {
        const c = i % 10;
        const r = Math.floor(i / 10);
        const x = cx + (c - 4.5) * dx;
        const y = row0 - r * dy;
        const on = i + 1 === lit;
        return (
          <g key={i}>
            {on ? <circle cx={x} cy={y} r={52} fill="url(#goldGlow0)" opacity={0.6 + 0.2 * Math.sin(frame * 0.3)} /> : null}
            <circle cx={x} cy={y} r={27} fill={on ? "#ffb347" : "#3a3f47"} stroke={on ? "#ffe0a8" : "#8d949e"} strokeWidth={4} />
            <text x={x} y={y + 8} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize={22} fill={on ? "#3a1d00" : "#d0d5dc"}>
              {i + 1}
            </text>
          </g>
        );
      })}
      {/* the empty socket: wires hanging out, the label scratched away */}
      <rect x={cx - 46} y={hole - 46} width={92} height={92} rx={8} fill="#050506" stroke="#4a4f57" strokeWidth={6} />
      {[-18, 0, 16].map((ox, i) => (
        <path key={ox} d={`M ${cx + ox} ${hole - 30} q ${8 + i * 4} ${30 + Math.sin(frame * 0.2 + i) * 6} ${-4 + i * 6} ${62}`} stroke={["#c0392b", "#2c7be5", "#e5c22c"][i]} strokeWidth={6} fill="none" strokeLinecap="round" />
      ))}
      <rect x={cx - 60} y={hole + 64} width={120} height={44} rx={6} fill="#8f6a34" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={cx - 54 + rand(i) * 20} y1={hole + 70 + i * 4} x2={cx + 40 + rand(i + 9) * 20} y2={hole + 72 + i * 4 + (rand(i + 3) - 0.5) * 10} stroke="#3a2a14" strokeWidth={3} />
      ))}
    </g>
  );
};

// The wall beside the panel: the brass notice, and hundreds of tally marks scratched by someone before.
export const NOTICE = { x: 780, y: 950, trust: { x: -300, y: 1505 } };
export const NoticeWall: React.FC<{ frame: number; scratch: number }> = ({ frame, scratch }) => (
  <g>
    <rect x={-900} y={-300} width={2800} height={2600} fill="#30353d" />
    {Array.from({ length: 60 }, (_, i) => (
      <line key={i} x1={-900 + i * 48} y1={-300} x2={-900 + i * 48} y2={2300} stroke="#fff" strokeOpacity={0.02 + (i % 3) * 0.012} strokeWidth={3} />
    ))}
    <rect x={-880} y={420} width={1300} height={1320} fill="none" stroke="#22262c" strokeWidth={8} />
    <g transform={`translate(${NOTICE.x} ${NOTICE.y})`}>
      <rect x={-290} y={-160} width={580} height={320} rx={16} fill="url(#brass0)" stroke="#6a4c22" strokeWidth={6} />
      {[-1, 1].flatMap((a) => [-1, 1].map((b) => <circle key={`${a}${b}`} cx={a * 260} cy={b * 130} r={9} fill="#6a4c22" />))}
      <text x={0} y={-82} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={34} letterSpacing={8} fill="#4a3216">
        NOTICE
      </text>
      <text x={0} y={-12} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={40} fill="#3a2610">
        THE DOORS STAY OPEN
      </text>
      <text x={0} y={92} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={96} fill="#2a1a08">
        30 SECONDS
      </text>
    </g>
    <Tallies x={-840} y={470} cols={17} rows={15} dx={74} dy={74} size={50} skip={(c, r) => r >= 13 && c >= 7} />
    {/* fresh scratches, gouged harder than the rest */}
    <text
      x={NOTICE.trust.x}
      y={NOTICE.trust.y}
      fontFamily="Arial Black, sans-serif"
      fontSize={66}
      letterSpacing={6}
      fill="none"
      stroke="#d7dde4"
      strokeWidth={2.5}
      opacity={scratch}
      transform={`rotate(-4 ${NOTICE.trust.x} ${NOTICE.trust.y})`}
    >
      DON&apos;T TRUST HER
    </text>
    <path d={`M ${NOTICE.trust.x - 10} ${NOTICE.trust.y + 18} l 640 -40`} stroke="#d7dde4" strokeWidth={3} opacity={scratch * 0.8} />
    <rect x={-900} y={-300} width={2800} height={2600} fill="#000" opacity={0.12 + 0.1 * Math.sin(frame * 0.9) * Math.sin(frame * 0.31)} />
  </g>
);
