import React from "react";
import { FONT } from "../LastLight/Overlays";

// Floor 64: the hospital ward, drawn side-on. HX is the bed that is still beeping.
export const FLOOR = 1500;
export const HX = 1000;
export const BEDS = [HX - 1560, HX - 780, HX + 780, HX + 1560];
export const BACK = [HX - 1160, HX - 390, HX + 390, HX + 1170];

// A body under a sheet. up = 0 lying flat, head to the left; up = 1 sitting bolt upright.
export const SheetBody: React.FC<{ x: number; y: number; scale: number; up: number; frame: number; seed: number }> = ({ x, y, scale, up, frame, seed }) => (
  <g transform={`translate(${x + 40 * scale} ${y - 95 * scale}) rotate(${up * 90 + Math.sin(frame * 0.2 + seed) * up * 2}) scale(${scale})`}>
    <path d="M 30 26 L -245 26 Q -290 26 -300 -14 Q -304 -52 -262 -56 Q -226 -58 -216 -32 L -190 -34 Q -60 -60 34 -30 Z" fill="#e9eee7" stroke="#aebbb1" strokeWidth={4} />
    <path d="M -120 22 Q -130 -4 -116 -36 M -30 24 Q -38 -6 -24 -42" stroke="#b7c3ba" strokeWidth={5} fill="none" />
    {up > 0.75 ? (
      <g opacity={(up - 0.75) * 4} transform="translate(-258 -16)">
        <circle cx={-6} cy={-16} r={8} fill="#141716" />
        <circle cx={-6} cy={14} r={8} fill="#141716" />
      </g>
    ) : null}
  </g>
);

export const BedFrame: React.FC<{ x: number; y: number; scale: number; children?: React.ReactNode }> = ({ x, y, scale, children }) => (
  <g>
    <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="#59655e" strokeLinecap="round">
      <line x1={-280} y1={0} x2={-280} y2={-210} strokeWidth={14} />
      <line x1={280} y1={0} x2={280} y2={-170} strokeWidth={14} />
      <line x1={-280} y1={-82} x2={280} y2={-82} strokeWidth={18} />
      <rect x={-270} y={-124} width={540} height={36} rx={10} fill="#c7d0c7" stroke="none" />
    </g>
    {children}
  </g>
);

export const Monitor: React.FC<{ frame: number; flat: number }> = ({ frame, flat }) => {
  const mx = HX - 380;
  const pts = Array.from({ length: 34 }, (_, i) => {
    const ph = (((i * 3 - frame * 3) % 44) + 44) % 44;
    const blip = ph < 3 ? -26 : ph < 6 ? 22 : ph < 8 ? -8 : 0;
    return `${mx - 72 + i * 4.4},${1010 + blip * (1 - flat) + i * 0.03}`;
  }).join(" ");
  return (
    <g>
      <line x1={mx} y1={FLOOR} x2={mx} y2={1090} stroke="#59655e" strokeWidth={14} />
      <line x1={mx - 50} y1={FLOOR} x2={mx + 50} y2={FLOOR} stroke="#59655e" strokeWidth={14} />
      <rect x={mx - 90} y={930} width={180} height={160} rx={14} fill="#10140f" stroke="#59655e" strokeWidth={8} />
      <polyline points={pts} fill="none" stroke="#6dff9c" strokeWidth={5} filter="url(#glow0)" />
      <circle cx={mx} cy={1010} r={170} fill="#6dff9c" opacity={0.05} />
      {/* the cord and the plug */}
      <path d={`M ${mx - 40} 1088 Q ${mx - 70} 1360 ${mx - 180} 1370`} stroke="#111" strokeWidth={7} fill="none" />
      <rect x={mx - 220} y={1340} width={54} height={70} rx={8} fill="#c8d0c8" stroke="#59655e" strokeWidth={4} />
      <rect x={mx - 205} y={1358} width={34} height={32} rx={6} fill="#c0392b" />
    </g>
  );
};

// The whole room. reveal: how far the sheet is off the hero's face; rises and backRise: the rows sitting up.
// awake hides the sleeper, who has woken; empty hides the bodies that have left their beds.
export const WardRoom: React.FC<{ frame: number; reveal: number; rises: number[]; backRise: number[]; flat?: number; awake?: boolean; empty?: boolean; children?: React.ReactNode }> = ({ frame, reveal, rises, backRise, flat = 0, awake = false, empty = false, children }) => {
  const hx0 = HX - 245;
  return (
    <g>
      <rect x={-1400} y={-600} width={4800} height={3200} fill="#47564f" />
      <rect x={-1400} y={1180} width={4800} height={40} fill="#37443e" />
      {Array.from({ length: 12 }, (_, i) => {
        const wx = -1200 + i * 420;
        return (
          <g key={i}>
            <rect x={wx} y={590} width={240} height={330} fill="#111c28" stroke="#303d37" strokeWidth={12} />
            <line x1={wx + 120} y1={590} x2={wx + 120} y2={920} stroke="#303d37" strokeWidth={8} />
          </g>
        );
      })}
      {[-1100, -300, 500, 1300, 2100, 2900].map((tx, i) => (
        <g key={tx}>
          <ellipse cx={tx} cy={410} rx={520} ry={190} fill="url(#tubeGlow0)" opacity={0.65 + 0.2 * Math.sin(frame * 0.9 + i)} />
          <rect x={tx - 160} y={350} width={320} height={22} rx={6} fill="#effff8" />
        </g>
      ))}
      <rect x={-1400} y={FLOOR - 112} width={4800} height={2} fill="#2c3731" />
      {BACK.map((bx, i) => (
        <BedFrame key={bx} x={bx} y={1395} scale={0.68}>
          {empty ? null : <SheetBody x={bx} y={1395} scale={0.68} up={backRise[i]} frame={frame} seed={i + 6} />}
        </BedFrame>
      ))}
      <rect x={-1400} y={1400} width={4800} height={1400} fill="#333d38" />
      {Array.from({ length: 34 }, (_, i) => (
        <line key={i} x1={-1400 + i * 150} y1={1400} x2={-1400 + i * 150 - 40} y2={2200} stroke="#2a332f" strokeWidth={3} />
      ))}
      {BEDS.map((bx, i) => (
        <BedFrame key={bx} x={bx} y={FLOOR} scale={1}>
          {empty ? null : <SheetBody x={bx} y={FLOOR} scale={1} up={rises[i]} frame={frame} seed={i} />}
        </BedFrame>
      ))}
      <Monitor frame={frame} flat={flat} />
      <BedFrame x={HX} y={FLOOR} scale={1}>
        {awake ? null : (
          <g>
            {/* Theo, asleep: the same face, eyes shut, a name band on the rail */}
        <rect x={hx0 - 70} y={FLOOR - 150} width={150} height={44} rx={20} fill="#f2f5ef" />
        <line x1={hx0 + 30} y1={FLOOR - 128} x2={HX + 40} y2={FLOOR - 128} stroke="#111" strokeWidth={22} strokeLinecap="round" />
        <circle cx={hx0} cy={FLOOR - 170} r={46} fill="#111" />
        <path d={`M ${hx0 - 16} ${FLOOR - 187} q 8 7 16 0 M ${hx0 + 8} ${FLOOR - 187} q 8 7 16 0`} stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <path d={`M ${hx0 - 8} ${FLOOR - 155} q 8 -3 16 0`} stroke="#fff" strokeWidth={3} fill="none" />
        </g>
        )}
        <g transform={`translate(${170 * reveal} 0)`}>
          <path d={`M ${HX + 270} ${FLOOR - 92} L ${HX - 280} ${FLOOR - 92} Q ${HX - 305} ${FLOOR - 172} ${HX - 250} ${FLOOR - 210} Q ${HX - 190} ${FLOOR - 212} ${HX - 170} ${FLOOR - 148} Q ${HX} ${FLOOR - 190} ${HX + 270} ${FLOOR - 138} Z`} fill="#e9eee7" stroke="#aebbb1" strokeWidth={4} />
        </g>
        {reveal > 0.6 ? (
          <g opacity={(reveal - 0.6) * 2.5}>
            <rect x={hx0 - 95} y={FLOOR - 320} width={190} height={62} rx={8} fill="#efe8d4" stroke="#6a7068" strokeWidth={4} />
            <text x={hx0} y={FLOOR - 274} textAnchor="middle" fontFamily={FONT} fontSize={42} fill="#c0392b">
              THEO
            </text>
          </g>
        ) : null}
      </BedFrame>
      {children}
      <rect x={HX + 262} y={FLOOR - 170} width={58} height={82} rx={4} fill="#d5cfbd" stroke="#59655e" strokeWidth={4} />
    </g>
  );
};
