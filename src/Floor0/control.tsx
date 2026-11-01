import React from "react";
import { rand } from "../LastLight/world";

// Floor 99, drawn side-on: a wall of screens, each watching a different Theo, an empty chair, a red button.
export const CTRL = { floor: 1500, chair: 480, button: { x: 820, y: 1240 } };

// One screen: a tiny elevator and whoever is inside it
const Screen: React.FC<{ x: number; y: number; w: number; h: number; frame: number; seed: number; alarm: number; us?: boolean }> = ({ x, y, w, h, frame, seed, alarm, us }) => {
  const off = Math.sin(frame * 0.3 + seed * 1.7) * Math.sin(frame * 0.11 + seed) > 0.82;
  const fall = rand(seed) > 0.55;
  const fy = fall ? Math.sin(frame * 0.4 + seed) * h * 0.08 - h * 0.1 : 0;
  const cx = x + w / 2;
  const base = y + h * 0.84 + fy;
  const fig = (px: number) => (
    <g stroke="#0a0d10" strokeWidth={w * 0.025} strokeLinecap="round" fill="none">
      <line x1={px} y1={base - h * 0.2} x2={px} y2={base - h * 0.42} />
      <line x1={px} y1={base - h * 0.2} x2={px - w * 0.05} y2={base} />
      <line x1={px} y1={base - h * 0.2} x2={px + w * 0.05} y2={base} />
      <line x1={px - w * 0.07} y1={base - h * 0.36 - (fall ? h * 0.08 : 0)} x2={px + w * 0.07} y2={base - h * 0.36 - (fall ? h * 0.08 : 0)} />
      <circle cx={px} cy={base - h * 0.5} r={h * 0.075} fill="#0a0d10" />
    </g>
  );
  return (
    <g>
      <rect x={x - 5} y={y - 5} width={w + 10} height={h + 10} rx={8} fill="#1b1e24" />
      <rect x={x} y={y} width={w} height={h} rx={4} fill={off ? "#0b0d10" : alarm > 0 ? "#c9352c" : us ? "#d4c37e" : "#7fa6b8"} />
      {off ? null : (
        <g>
          <rect x={x + w * 0.2} y={y + h * 0.1} width={w * 0.6} height={h * 0.78} fill="none" stroke="#0a0d10" strokeOpacity={0.6} strokeWidth={w * 0.015} />
          {us ? (
            <g>
              {fig(cx - w * 0.12)}
              {fig(cx + w * 0.12)}
            </g>
          ) : (
            fig(cx)
          )}
          <rect x={x} y={y + ((frame * 3 + seed * 13) % h)} width={w} height={h * 0.04} fill="#fff" opacity={0.14} />
        </g>
      )}
    </g>
  );
};

export const ControlRoom: React.FC<{ frame: number; alarm: number; swing: number; talk: number; children?: React.ReactNode; dome?: number }> = ({ frame, alarm, swing, talk, children, dome = 1 }) => {
  const { floor, chair, button } = CTRL;
  const cols = 22;
  const rows = 9;
  const turn = Math.sin(frame * 0.05 + 1) * 0.6 + swing * Math.sin(frame * 0.3);
  return (
    <g>
      <rect x={-2200} y={-1400} width={5500} height={5000} fill="#07090c" />
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        return <Screen key={i} x={-1120 + c * 150} y={120 + r * 130} w={136} h={114} frame={frame} seed={i + 1} alarm={alarm} us={c === 10 && r === 4} />;
      })}
      {/* light from the screens on the floor */}
      <rect x={-2200} y={floor - 90} width={5500} height={90} fill={alarm > 0 ? "#3a1210" : "#121c22"} />
      <rect x={-2200} y={floor} width={5500} height={1800} fill="#0d1115" />
      {Array.from({ length: 30 }, (_, i) => (
        <line key={i} x1={-2200 + i * 190} y1={floor} x2={-2200 + i * 190 - 80} y2={floor + 800} stroke="#1a2026" strokeWidth={3} />
      ))}
      {/* the desk, the button under its glass */}
      <rect x={600} y={floor - 240} width={460} height={34} rx={6} fill="#2b2f36" />
      <rect x={630} y={floor - 206} width={40} height={206} fill="#1c1f24" />
      <rect x={990} y={floor - 206} width={40} height={206} fill="#1c1f24" />
      <rect x={button.x - 92} y={button.y + 14} width={184} height={22} rx={4} fill="#3e434c" />
      <circle cx={button.x} cy={button.y - 10} r={120} fill="url(#redGlow0)" opacity={0.7 + 0.3 * Math.sin(frame * 0.25)} />
      <path d={`M ${button.x - 62} ${button.y + 14} A 62 62 0 0 1 ${button.x + 62} ${button.y + 14} Z`} fill="#e0231b" stroke="#6f0d09" strokeWidth={5} />
      {dome > 0 ? <path d={`M ${button.x - 80} ${button.y + 14} A 80 80 0 0 1 ${button.x + 80} ${button.y + 14}`} fill="#cfe9ff" fillOpacity={0.14} stroke="#dff2ff" strokeOpacity={0.6} strokeWidth={3} /> : null}
      <rect x={button.x - 110} y={button.y + 40} width={220} height={46} rx={6} fill="#efe8d4" />
      <text x={button.x} y={button.y + 75} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={34} fill="#b3211b">
        RESET ALL
      </text>
      {/* the empty chair, still turning; the headset swinging off its arm */}
      <g transform={`translate(${chair} ${floor})`}>
        <line x1={0} y1={0} x2={0} y2={-150} stroke="#2b2f36" strokeWidth={16} />
        <line x1={-70} y1={0} x2={70} y2={0} stroke="#2b2f36" strokeWidth={14} />
        <rect x={-74} y={-176} width={148} height={30} rx={10} fill="#3a3f47" />
        <rect x={-74 * Math.abs(turn) - 12} y={-400} width={148 * Math.abs(turn) + 24} height={228} rx={18} fill="#2f343c" />
        <g transform={`translate(0 -400) rotate(${Math.sin(frame * 0.14) * (10 + swing * 24)})`}>
          <line x1={0} y1={0} x2={0} y2={110} stroke="#111" strokeWidth={5} />
          <path d="M -34 150 A 34 34 0 0 1 34 150" fill="none" stroke="#c9ced6" strokeWidth={9} />
          <rect x={-46} y={140} width={22} height={38} rx={8} fill="#c9ced6" />
          <rect x={24} y={140} width={22} height={38} rx={8} fill="#c9ced6" />
          <circle cx={35} cy={159} r={7} fill="#ff4a3d" opacity={0.4 + 0.6 * talk} filter="url(#glow0)" />
          {talk > 0 ? <circle cx={35} cy={159} r={80} fill="url(#redGlow0)" opacity={talk} /> : null}
        </g>
      </g>
      {/* the way they came in */}
      <rect x={-340} y={760} width={420} height={740} fill="#23262c" stroke="#8a919b" strokeWidth={14} />
      <rect x={-322} y={778} width={384} height={722} fill="#b99f6b" opacity={0.35} />
      {children}
    </g>
  );
};
