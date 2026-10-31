import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { GAITS, lerpPose, Pose, POSES, StickFigure, walkPose } from "../../shared/rig";
import { ACTION, cameraTransform, clamp01, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, GraspHand, P78 } from "../../LastLight/bridge";
import { Captions, FONT, SPEAKERS } from "../../LastLight/Overlays";
import { rand } from "../../LastLight/world";
import { Car, Corridor, Defs0, HALL, Kid, proj, Tall, TUBES } from "../elevator";
import { PanelClose } from "../closeups";
import { Doodle } from "../Part01/Part01";
import { Badge0, ChoiceCards, DoorTimer, EndCard0, Lives } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const CX = 540;
const CY = 1500;
const TS = 1.55;
const STEPS = beats.up;
// The bed that is still beeping, in the ward's own coordinates
const FLOOR = 1500;
const HX = 1000;
const BEDS = [HX - 1560, HX - 780, HX + 780, HX + 1560];
const BACK = [HX - 1160, HX - 390, HX + 390, HX + 1170];

type SetName = "flash" | "panel" | "car" | "drawing" | "ward" | "chart";
type Shot0 = { from: number; to: number; set: SetName; keys: [number, number, number, number][] };
const SHOTS: Shot0[] = [
  { from: 0, to: 40, set: "flash", keys: [[0, 420, 1180, 0.95], [40, 620, 1180, 1.05]] },
  { from: 40, to: 95, set: "flash", keys: [[40, 760, 1200, 1.25], [95, 820, 1160, 1.5]] },
  { from: 95, to: 150, set: "car", keys: [[95, 680, 1120, 1.5], [150, 720, 1100, 1.7]] },
  { from: 150, to: 225, set: "panel", keys: [[150, 540, 1000, 1.15], [185, 441, 746, 1.9], [225, 441, 746, 2.2]] },
  { from: 225, to: 285, set: "car", keys: [[225, 560, 1130, 1.15], [285, 545, 1130, 1.35]] },
  { from: 285, to: 335, set: "car", keys: [[285, 540, 1160, 2.0], [335, 540, 1150, 2.5]] },
  { from: 335, to: 448, set: "car", keys: [[335, 530, 1205, 2.9], [448, 530, 1200, 3.8]] },
  { from: 448, to: 500, set: "car", keys: [[448, 330, 650, 1.6], [500, 360, 720, 1.4]] },
  { from: 500, to: 575, set: "car", keys: [[500, 250, 610, 2.6], [575, 250, 630, 2.95]] },
  { from: 575, to: 630, set: "car", keys: [[575, 770, 1010, 2.5], [630, 770, 1010, 2.9]] },
  { from: 630, to: 725, set: "drawing", keys: [[630, 540, 950, 1.0], [725, 480, 1010, 1.8]] },
  { from: 725, to: 840, set: "car", keys: [[725, 540, 1130, 1.3], [770, 540, 1120, 1.45], [840, 560, 1160, 1.9]] },
  { from: 840, to: 925, set: "ward", keys: [[840, HX - 780, 1190, 0.95], [925, HX - 420, 1180, 1.1]] },
  { from: 925, to: 985, set: "ward", keys: [[925, HX - 300, 1170, 1.35], [985, HX - 310, 1160, 1.55]] },
  { from: 985, to: 1035, set: "ward", keys: [[985, HX - 330, 1130, 1.7], [1035, HX - 330, 1130, 2.0]] },
  { from: 1035, to: 1105, set: "chart", keys: [[1035, 540, 1100, 1.15], [1105, 540, 1130, 1.4]] },
  { from: 1105, to: 1156, set: "ward", keys: [[1105, HX, 1140, 0.62], [1156, HX - 20, 1150, 0.68]] },
  { from: 1156, to: 1195, set: "ward", keys: [[1156, HX + 800, 1180, 1.3], [1195, HX + 810, 1160, 1.6]] },
  { from: 1195, to: 1250, set: "ward", keys: [[1195, HX - 450, 1060, 2.1], [1250, HX - 450, 1060, 2.4]] },
  { from: 1250, to: 9999, set: "ward", keys: [[1250, HX - 230, 1180, 1.0], [1310, HX - 230, 1190, 1.2]] },
];
const shotAt = (s: number) => SHOTS.find((sh) => s >= sh.from && s < sh.to) ?? SHOTS[SHOTS.length - 1];
const camOf = (s: number, shot: Shot0) => {
  const f = shot.keys.map((k) => k[0]);
  const at = (i: number) => (f.length > 1 ? track(s, f, shot.keys.map((k) => k[i])) : shot.keys[0][i]);
  return { fx: at(1), fy: at(2), z: at(3) };
};

const RUN = { f: [0, 72], v: [230, 820] };
const WALK = { f: [840, 985], v: [HX - 1090, HX - 470] };
// One hand towards the sleeper, the other back towards the plug
const TORN: Pose = { ...POSES.stand, lean: 8, tilt: 6, duck: 0.3, rUA: 72, rFA: 88, lUA: -58, lFA: -70, lTh: -16, lSh: -6, rTh: 16, rSh: 4 };
const PULL: Pose = { ...POSES.stand, lean: 16, tilt: 16, duck: 0.25, rUA: 74, rFA: 84, lUA: 20, lFA: 44 };

// The hall as it would have been: he leaves the car, and the doors don't wait
const HallSide: React.FC<{ frame: number; s: number }> = ({ frame, s }) => {
  const x = track(s, RUN.f, RUN.v);
  const lift = clamp01((s - beats.grab) / 10);
  const pose = lerpPose(walkPose(x / 300, GAITS.run, POSES.stand), ACTION.fall, clamp01((s - beats.grab) / 4));
  const close = clamp01((s - beats.grab + 4) / 5);
  const shut = track(s, [8, 50], [0, 1]);
  return (
    <g>
      <rect x={-800} y={-400} width={3000} height={2800} fill="#1b2928" />
      <rect x={-800} y={1120} width={3000} height={380} fill="#2e4c52" />
      {Array.from({ length: 26 }, (_, i) => (
        <line key={i} x1={-800 + i * 110} y1={1120} x2={-800 + i * 110} y2={1500} stroke="#18292d" strokeWidth={8} />
      ))}
      <rect x={-800} y={FLOOR} width={3000} height={900} fill="#2a2621" />
      {/* the elevator shutting behind him */}
      <rect x={-120} y={780} width={280} height={720} fill="#d8c88f" opacity={0.5} />
      <rect x={-120} y={780} width={140 * shut} height={720} fill="#6d7581" />
      <rect x={160 - 140 * shut} y={780} width={140 * shut} height={720} fill="#6d7581" />
      <Kid x={1030} y={FLOOR} scale={1.25} frame={frame} tilt={10} smile={1} glow={0.7} />
      <g transform={`translate(0 ${-lift * 520})`}>
        <StickFigure pose={pose} x={x} y={FLOOR} scale={1.2} frame={frame} face={face(1, 1, 0.8)} />
      </g>
      {s > 45 ? <GraspHand x={x + 30} y={track(s, [45, beats.grab, beats.grab + 12], [200, 1020, 500])} scale={3} close={close} angle={180} frame={frame} arm={900} /> : null}
    </g>
  );
};

// The ward seen through the doors, beds running away on both sides
const WardView: React.FC<{ frame: number }> = ({ frame }) => {
  const { w, ceil } = HALL;
  const end = 11;
  const zs = [1.45, 2, 2.75, 3.8, 5.2, 7.2];
  const q = (p: { x: number; y: number }[]) => p.map((a) => `${a.x.toFixed(1)},${a.y.toFixed(1)}`).join(" ");
  return (
    <g>
      <rect x={-200} y={-720} width={400} height={730} fill="#61756d" />
      <polygon points={q([proj(-w, ceil, 1), proj(w, ceil, 1), proj(w, ceil, end), proj(-w, ceil, end)])} fill="#3b4a45" />
      <polygon points={q([proj(-w, 0, 1), proj(w, 0, 1), proj(w, 0, end), proj(-w, 0, end)])} fill="#39423e" />
      <rect x={proj(-w, ceil, end).x} y={proj(-w, ceil, end).y} width={(2 * w) / end} height={-ceil / end} fill="#25312d" />
      {zs.map((z, i) => (
        <g key={z}>
          <rect x={-70 / z} y={proj(0, ceil + 8, z).y - 6 / z} width={140 / z} height={12 / z} fill="#e8fff4" opacity={0.75 + 0.25 * Math.sin(frame * 0.7 + i)} />
          {[-1, 1].map((sd) => (
            <g key={sd}>
              <polygon points={q([proj(sd * w, -135, z), proj(sd * (w - 145), -135, z), proj(sd * (w - 145), -135, z * 1.22), proj(sd * w, -135, z * 1.22)])} fill="#dfe6df" />
              <polygon points={q([proj(sd * (w - 145), -135, z), proj(sd * (w - 145), 0, z), proj(sd * (w - 145), 0, z * 1.22), proj(sd * (w - 145), -135, z * 1.22)])} fill="#9fb0a6" />
              <ellipse cx={proj(sd * (w - 70), -150, z * 1.17).x} cy={proj(sd * (w - 70), -150, z * 1.17).y} rx={46 / z} ry={22 / z} fill="#f2f5ef" />
            </g>
          ))}
        </g>
      ))}
      <circle cx={proj(w - 30, -240, 3.8).x} cy={proj(w - 30, -240, 3.8).y} r={7} fill="#6dff9c" filter="url(#glow0)" opacity={frame % 22 < 8 ? 1 : 0.3} />
      <rect x={-200} y={-720} width={400} height={730} fill="#000" opacity={0.28} />
    </g>
  );
};

// A body under a sheet. up = 0 lying flat, head to the left; up = 1 sitting bolt upright.
const SheetBody: React.FC<{ x: number; y: number; scale: number; up: number; frame: number; seed: number }> = ({ x, y, scale, up, frame, seed }) => (
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

const BedFrame: React.FC<{ x: number; y: number; scale: number; children?: React.ReactNode }> = ({ x, y, scale, children }) => (
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

const Monitor: React.FC<{ frame: number; flat: number }> = ({ frame, flat }) => {
  const mx = HX - 380;
  const pts = Array.from({ length: 34 }, (_, i) => {
    const ph = (((i * 3 - frame * 3) % 44) + 44) % 44;
    const blip = ph < 3 ? -26 : ph < 6 ? 22 : ph < 8 ? -8 : 0;
    return `${mx - 72 + i * 4.4},${1010 + blip * (1 - flat)}`;
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

const Ward: React.FC<{ frame: number; s: number; children?: React.ReactNode }> = ({ frame, s, children }) => {
  const reveal = track(s, beats.pull, [0, 1]);
  const rises = BEDS.map((_, i) => track(s, [STEPS[i % 4], STEPS[i % 4] + 14], [0, 1]));
  const backRise = BACK.map((_, i) => track(s, [STEPS[(i + 2) % 4] + 4, STEPS[(i + 2) % 4] + 20], [0, 1]));
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
          <SheetBody x={bx} y={1395} scale={0.68} up={backRise[i]} frame={frame} seed={i + 6} />
        </BedFrame>
      ))}
      <rect x={-1400} y={1400} width={4800} height={1400} fill="#333d38" />
      {Array.from({ length: 34 }, (_, i) => (
        <line key={i} x1={-1400 + i * 150} y1={1400} x2={-1400 + i * 150 - 40} y2={2200} stroke="#2a332f" strokeWidth={3} />
      ))}
      {BEDS.map((bx, i) => (
        <BedFrame key={bx} x={bx} y={FLOOR} scale={1}>
          <SheetBody x={bx} y={FLOOR} scale={1} up={rises[i]} frame={frame} seed={i} />
        </BedFrame>
      ))}
      <Monitor frame={frame} flat={0} />
      <BedFrame x={HX} y={FLOOR} scale={1}>
        {/* Theo, asleep: the same face, eyes shut, a name band on the rail */}
        <rect x={hx0 - 70} y={FLOOR - 150} width={150} height={44} rx={20} fill="#f2f5ef" />
        <line x1={hx0 + 30} y1={FLOOR - 128} x2={HX + 40} y2={FLOOR - 128} stroke="#111" strokeWidth={22} strokeLinecap="round" />
        <circle cx={hx0} cy={FLOOR - 170} r={46} fill="#111" />
        <path d={`M ${hx0 - 16} ${FLOOR - 187} q 8 7 16 0 M ${hx0 + 8} ${FLOOR - 187} q 8 7 16 0`} stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <path d={`M ${hx0 - 8} ${FLOOR - 155} q 8 -3 16 0`} stroke="#fff" strokeWidth={3} fill="none" />
        <g transform={`translate(${track(reveal, [0, 1], [0, 170])} 0)`}>
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

// The clipboard from the foot of the bed
const Chart: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    <rect x={-400} y={-300} width={1900} height={2600} fill="#37443e" />
    <rect x={150} y={420} width={780} height={1100} rx={24} fill="#6d4f2d" />
    <rect x={190} y={490} width={700} height={1000} fill="#efe8d4" />
    <rect x={410} y={390} width={260} height={84} rx={14} fill="#9aa1aa" />
    <text x={540} y={920} textAnchor="middle" fontFamily="Courier New, monospace" fontWeight={700} fontSize={54} fill="#26302b">PATIENT: THEO</text>
    <text x={540} y={985} textAnchor="middle" fontFamily="Courier New, monospace" fontWeight={700} fontSize={42} fill="#26302b">ROOM: FLOOR 64</text>
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={250} y={1025 + i * 30} width={580 - rand(i) * 180} height={14} fill="#a4a38f" />
    ))}
    <g transform={`translate(0 ${150 + Math.sin(frame * 0.4) * 2}) rotate(-7 540 1160)`}>
      <rect x={240} y={1040} width={600} height={210} rx={16} fill="none" stroke="#c0392b" strokeWidth={12} />
      <text x={540} y={1120} textAnchor="middle" fontFamily={FONT} fontSize={72} fill="#c0392b">DO NOT</text>
      <text x={540} y={1215} textAnchor="middle" fontFamily={FONT} fontSize={86} fill="#c0392b">WAKE</text>
    </g>
    <rect x={-400} y={-300} width={1900} height={2600} fill="url(#vignette0)" />
  </g>
);

export const Part02: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const shot = shotAt(s);
  const cam = camOf(s, shot);
  const flash = s < beats.flashEnd;

  const kick = impulse(f, [toOut(beats.grab), toOut(beats.flashEnd), toOut(beats.press), toOut(beats.fingers), toOut(beats.smash), toOut(beats.ding), ...beats.up.map(toOut)], 4) * 20;
  const rising = s >= beats.lift && s < beats.ding;
  const shake = handheld(f, flash ? 7 : rising ? 5 : 3, { x: kick * Math.sin(f * 3), y: kick * 0.6 + (rising ? Math.sin(f * 2.1) * 4 : 0) });

  // ---------- the car ----------
  const smashed = s >= beats.smash;
  const fl = (i: number) => (Math.sin(f * 1.7 + i * 2.1) * Math.sin(f * 0.53 + i) > -0.25 ? 1 : 0.2);
  const bulbs = smashed ? [0, s < beats.smash + 25 ? fl(1) : 1, s < beats.smash + 25 ? fl(2) : 1] : [fl(0), fl(1), fl(2)];
  const swing = s >= beats.smash && s < 620 ? 18 * Math.exp(-(s - beats.smash) / 60) : 4;
  const speaker = s >= 460 && s < 570 ? 0.55 + 0.45 * Math.abs(Math.sin(f * 0.5)) : 0;
  // doors open on Floor 12, shut on the fingers, then open again on 64
  const open = s < beats.ding ? track(s, [beats.closing[0], beats.fingers, 435, 448], [1, 0.24, 0.24, 0]) : track(s, beats.open, [0, 1]);
  const floorNum = s < beats.lift ? "12" : s < beats.ding ? String(Math.min(64, 12 + Math.floor((s - beats.lift) * 0.34))) : "64";
  const lit = s >= beats.press ? 64 : -1;

  const zg = 3.4;
  const zm = 3.9;
  const gp = proj(-34, 0, zg);
  const mp = proj(40, 0, zm);
  const hand = clamp01((s - 365) / 25);
  const gh = { x: gp.x - 2, y: gp.y - 365 / zg };
  const sh = { x: mp.x + 2.5, y: mp.y - 690 / zm };
  const wx = sh.x + (gh.x - sh.x) * hand - 10 * (1 - hand);
  const wy = sh.y + 70 * (1 - hand) + (gh.y - sh.y) * hand + (hand >= 1 ? Math.sin(f * 0.35) * 2 : 0);
  const corridor =
    s < beats.ding ? (
      <Corridor
        frame={f}
        tubes={TUBES.map((_, i) => (i > 2 ? 0 : 0.85))}
        dark={3.9}
        front={
          <g>
            <Tall x={mp.x} y={mp.y} scale={1.15 / zm} frame={f} eyes={1} step={0} />
            <Kid x={gp.x} y={gp.y} scale={1 / zg} frame={f} tilt={14} smile={1} glow={0.7} />
            <path d={`M ${sh.x} ${sh.y + 16} Q ${(sh.x + wx) / 2 - 8} ${wy - 12} ${wx} ${wy}`} stroke="#8d93a3" strokeWidth={9} fill="none" strokeLinecap="round" />
            <path d={`M ${sh.x} ${sh.y + 16} Q ${(sh.x + wx) / 2 - 8} ${wy - 12} ${wx} ${wy}`} stroke="#050506" strokeWidth={6} fill="none" strokeLinecap="round" />
            {[-5, 0, 5].map((d) => (
              <line key={d} x1={wx} y1={wy} x2={wx + d} y2={wy + 8} stroke="#050506" strokeWidth={2.5} strokeLinecap="round" />
            ))}
          </g>
        }
      />
    ) : (
      <WardView frame={f} />
    );

  // ---------- Theo in the car ----------
  let tx = 290;
  let tPose: Pose = KAI.flinch;
  let tFlip = true;
  let tFace = face(1, 0.5, 0.8);
  if (s >= 120 && s < 225) {
    tx = 260;
    tFlip = false;
    tPose = { ...POSES.stand, lean: 12, rUA: 78, rFA: 88 };
  } else if (s >= beats.fingers && s < beats.smash) {
    tPose = lerpPose(P78.backUp, KAI.flinch, 0.5);
  } else if (s >= beats.smash && s < 575) {
    tx = 230;
    tFlip = false;
    tPose = { ...POSES.stand, tilt: -24 + Math.sin(f * 0.07) * 3, lUA: -16, lFA: 30, rUA: 18, rFA: -26 };
    tFace = face(1, 0.2, 0.7);
  } else if (s >= 575) {
    tx = 250;
    tPose = { ...KAI.watch, duck: 0.15 + Math.sin(f * 0.1) * 0.05 };
    tFace = face(1, s > 575 && s < 630 ? 0.3 : 0, 0.8);
  }

  // ---------- Theo in the ward ----------
  const wkx = track(s, WALK.f, WALK.v);
  const walking = s < WALK.f[1];
  let wPose: Pose = walking ? walkPose(wkx / 190, GAITS.walk, { ...POSES.stand, duck: 0.2 }) : lerpPose(POSES.stand, PULL, clamp01((s - beats.pull[0]) / 12));
  let wFace = face(0.9, 0, 0.5);
  if (s >= beats.pull[1]) wFace = face(1, 0.9, 0.9);
  if (s >= beats.up[0] && s < beats.choice) {
    wPose = lerpPose(P78.backUp, KAI.flinch, clamp01(impulse(s, STEPS, 8)));
    wFace = face(1, 0.7, 1);
  }
  if (s >= beats.choice) {
    const sway = Math.sin(f * 0.18);
    wPose = { ...TORN, lean: TORN.lean + sway * 7, rUA: TORN.rUA + sway * 8, lUA: TORN.lUA - sway * 10 };
    wFace = face(1, 0.5, 1);
  }

  let scene: React.ReactNode;
  if (shot.set === "flash") {
    scene = <HallSide frame={f} s={s} />;
  } else if (shot.set === "panel") {
    const tip = { x: track(s, [155, beats.press], [980, 441]), y: track(s, [155, beats.press], [1650, 746]) };
    scene = (
      <g>
        <PanelClose frame={f} lit={s >= beats.press ? 64 : 12} />
        <polyline points={`${tip.x + 430},${tip.y + 800} ${tip.x + 170},${tip.y + 230} ${tip.x},${tip.y}`} stroke="#111" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx={tip.x} cy={tip.y} r={20} fill="#111" />
      </g>
    );
  } else if (shot.set === "car") {
    // long black fingers curl round the door edges
    const fingersIn = s >= beats.fingers && s < beats.smash + 2;
    const bk = clamp01((beats.smash - s) / 6);
    scene = (
      <g>
        <rect x={-2000} y={-2000} width={5000} height={6000} fill="#0a0b0e" />
        <g transform={`translate(${CX} ${CY})`}>
          <Car frame={f} open={open} floor={floorNum} bulbs={bulbs} swing={swing} speaker={speaker} lit={lit} exterior beyond={corridor}>
            {fingersIn ? (
              <g stroke="#040405" strokeWidth={15} strokeLinecap="round" fill="none" opacity={bk > 0 ? 1 : 0}>
                {[-650, -600, -545, -490].map((y, i) => (
                  <g key={y}>
                    <path d={`M ${-95 * open} ${y} q -46 -12 -82 ${6 + Math.sin(f * 0.8 + i) * 6} q -22 10 -26 34`} />
                    <path d={`M ${95 * open} ${y + 26} q 44 -14 78 ${4 + Math.sin(f * 0.7 + i) * 6} q 22 10 26 32`} />
                  </g>
                ))}
              </g>
            ) : null}
            <StickFigure pose={tPose} x={tx} y={0} scale={TS} frame={f} flip={tFlip} face={tFace} />
          </Car>
          {s >= beats.smash && s < beats.smash + 18
            ? Array.from({ length: 28 }, (_, i) => {
                const a = rand(i + 40) * Math.PI * 2;
                const t = (s - beats.smash) / 18;
                return <circle key={i} cx={-250 + Math.cos(a) * (40 + rand(i) * 340) * t} cy={-914 + Math.sin(a) * (40 + rand(i + 3) * 300) * t + t * t * 340} r={6 - t * 4} fill="#ffe7a8" opacity={1 - t} filter="url(#glow0)" />;
              })
            : null}
        </g>
      </g>
    );
  } else if (shot.set === "drawing") {
    scene = (
      <g>
        <rect x={-800} y={-400} width={2700} height={2800} fill="#203535" />
        <Doodle x={540} y={1010} w={640} h={520} rot={-3} num="64" who="lie" />
        <rect x={-800} y={-400} width={2700} height={2800} fill="#000" opacity={0.1 + 0.08 * Math.sin(f * 0.8)} />
      </g>
    );
  } else if (shot.set === "chart") {
    scene = <Chart frame={f} />;
  } else {
    scene = (
      <Ward frame={f} s={s}>
        <StickFigure pose={wPose} x={wkx} y={FLOOR + 22} scale={1.45} frame={f} face={wFace} />
      </Ward>
    );
  }

  const punch = 1 + 0.07 * impulse(f, EMPH, 5);
  const freezeT = frozen ? frame - toOut(beats.freeze) : 0;
  const timerSec = s < beats.choice ? 30 - (20 * (s - beats.timerStart)) / (beats.choice - beats.timerStart) : 10 - (3 * (s - beats.choice)) / (beats.freeze - beats.choice);
  const filter = flash ? "grayscale(1) sepia(1) hue-rotate(-45deg) saturate(3.5) contrast(1.15)" : frozen ? `grayscale(${Math.min(0.8, freezeT * 0.1)}) brightness(${Math.max(0.5, 1 - freezeT * 0.06)})` : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ filter }}>
        <Defs0 />
        <g transform={`translate(540 960) scale(${punch * (1 + freezeT * 0.0012)}) translate(-540 -960)`}>
          <g transform={cameraTransform(cam, shake)}>{scene}</g>
        </g>
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {s >= beats.grab + 12 && s < beats.flashEnd ? <rect width={1080} height={1920} fill="#fff" opacity={interpolate(s, [beats.grab + 12, beats.flashEnd], [0.9, 1])} /> : null}
        {s >= beats.flashEnd && s < beats.flashEnd + 5 ? <rect width={1080} height={1920} fill="#fff" opacity={1 - (s - beats.flashEnd) / 5} /> : null}
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      {flash ? <div style={{ position: "absolute", top: 320, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontSize: 56, color: "#fff", WebkitTextStroke: "10px #0a0a0a", paintOrder: "stroke fill" }}>IF YOU&apos;D PICKED A…</div> : null}
      {!flash ? <Badge0 frame={frame - Math.round(toOut(beats.flashEnd))} part={2} title="FLOOR 64" until={70} /> : null}
      <Lives frame={frame} from={Math.round(toOut(beats.smash))} left={2} />
      <DoorTimer frame={frame} from={Math.round(toOut(beats.timerStart))} seconds={timerSec} frozen={frozen} />
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO DO?" a="WAKE HIM UP" b="PULL THE PLUG" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <EndCard0 frame={frame} from={Math.round(toOut(beats.card))} part={2} />
    </AbsoluteFill>
  );
};
