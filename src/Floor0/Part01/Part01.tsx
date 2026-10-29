import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { lerpPose, Pose, POSES, StickFigure } from "../../shared/rig";
import { ACTION, cameraTransform, clamp01, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, P78 } from "../../LastLight/bridge";
import { Captions, SPEAKERS } from "../../LastLight/Overlays";
import { rand } from "../../LastLight/world";
import { Car, Corridor, Defs0, Kid, proj, Shaft, Sparks, Tall, TUBES } from "../elevator";
import { NOTICE, NoticeWall, PANEL, PanelClose } from "../closeups";
import { Badge0, ChoiceCards, DoorTimer, EndCard0 } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

// The car sits with its floor at (CX, CY); Theo is drawn in the car's coordinates at this scale
const CX = 540;
const CY = 1500;
const TS = 1.55;
const STEPS = beats.step;

// How far the car has fallen: it accelerates until the brakes bite at Floor 12
const dropAt = (s: number) => 520 * 76 * clamp01(Math.min(s, beats.slam) / beats.slam) ** 1.4;

type SetName = "car" | "panel" | "wall" | "draw" | "kid";
type Shot0 = { from: number; to: number; set: SetName; keys: [number, number, number, number][] };
const SHOTS: Shot0[] = [
  { from: 0, to: 42, set: "car", keys: [[0, 520, 1060, 0.85], [42, 530, 1000, 0.72]] },
  { from: 42, to: 78, set: "car", keys: [[42, 515, 790, 1.9], [78, 515, 780, 2.15]] },
  { from: 78, to: 120, set: "car", keys: [[78, 540, 900, 0.52], [120, 540, 950, 0.6]] },
  { from: 120, to: 175, set: "car", keys: [[120, 540, 1080, 0.84], [175, 520, 1180, 1.0]] },
  { from: 175, to: 300, set: "panel", keys: [[175, 540, 560, 1.45], [232, 540, 1180, 1.45], [262, 540, PANEL.hole, 2.1], [300, 540, PANEL.hole + 10, 2.35]] },
  { from: 300, to: 420, set: "wall", keys: [[300, NOTICE.x, NOTICE.y, 1.5], [420, NOTICE.x, NOTICE.y, 1.78]] },
  { from: 420, to: 472, set: "wall", keys: [[420, -150, 880, 1.05], [472, -220, 1060, 1.15]] },
  { from: 472, to: 525, set: "wall", keys: [[472, NOTICE.trust.x + 410, NOTICE.trust.y - 60, 1.2], [525, NOTICE.trust.x + 420, NOTICE.trust.y - 40, 1.25]] },
  { from: 525, to: 600, set: "car", keys: [[525, 250, 610, 2.6], [600, 250, 630, 2.95]] },
  { from: 600, to: 650, set: "car", keys: [[600, 560, 1060, 0.95], [650, 580, 1080, 1.0]] },
  { from: 650, to: 700, set: "car", keys: [[650, 540, 1130, 1.3], [700, 540, 1110, 1.45]] },
  { from: 700, to: 790, set: "car", keys: [[700, 610, 1170, 1.45], [790, 570, 1160, 1.85]] },
  { from: 790, to: 905, set: "draw", keys: [[790, 230, 980, 1.25], [848, 760, 1000, 1.3], [905, 540, 1010, 2.0]] },
  { from: 905, to: 965, set: "car", keys: [[905, 530, 1215, 2.6], [965, 530, 1215, 3.05]] },
  { from: 965, to: 1075, set: "kid", keys: [[965, 540, 1100, 1.0], [1030, 560, 1100, 1.1], [1075, 820, 1330, 1.6]] },
  { from: 1075, to: 1140, set: "car", keys: [[1075, 540, 1180, 2.0], [1140, 550, 1190, 2.3]] },
  { from: 1140, to: 1205, set: "car", keys: [[1140, 600, 1130, 1.1], [1205, 610, 1130, 1.2]] },
  { from: 1205, to: 1260, set: "car", keys: [[1205, 770, 1010, 2.5], [1260, 770, 1010, 2.8]] },
  { from: 1260, to: 9999, set: "car", keys: [[1260, 590, 1170, 1.25], [1335, 600, 1190, 1.55]] },
];
const shotAt = (s: number) => SHOTS.find((sh) => s >= sh.from && s < sh.to) ?? SHOTS[SHOTS.length - 1];
const camOf = (s: number, shot: Shot0) => {
  const f = shot.keys.map((k) => k[0]);
  const at = (i: number) => (f.length > 1 ? track(s, f, shot.keys.map((k) => k[i])) : shot.keys[0][i]);
  return { fx: at(1), fy: at(2), z: at(3) };
};

// Torn between the door and the panel
const TORN: Pose = { ...POSES.stand, lean: 10, tilt: 4, duck: 0.3, rUA: 80, rFA: 95, lUA: -70, lFA: -60, lTh: -18, lSh: -8, rTh: 16, rSh: 4 };

const theoAt = (s: number, frame: number) => {
  let x = 170;
  let y = 0;
  let pose: Pose = POSES.stand;
  let flip = false;
  let rot = 0;
  let fc = face(0.7, 0, 0.2);
  if (s < beats.slam) {
    // free fall: floating, flailing
    x = -40;
    y = -260 + Math.sin(frame * 0.2) * 30;
    pose = { ...ACTION.fall, lUA: -150 + 30 * Math.sin(frame * 0.8), rUA: 150 + 30 * Math.sin(frame * 0.9 + 1), lTh: 20 + 25 * Math.sin(frame * 0.6), rTh: 40 - 25 * Math.sin(frame * 0.7) };
    rot = 12 * Math.sin(frame * 0.13);
    fc = face(1, 1, 0.8);
  } else if (s < 175) {
    x = -40;
    y = track(s, [beats.slam, beats.slam + 6], [-260, 0]);
    pose = lerpPose(lerpPose(ACTION.fall, ACTION.land, clamp01((s - beats.slam) / 6)), KAI.sitLook, clamp01((s - 135) / 25));
    fc = face(1, s < 140 ? 0.8 : 0.3, 0.7);
  } else if (s < beats.ding) {
    // up at the panel, then staring at the intercom
    pose = s > 560 ? { ...POSES.stand, tilt: -24 + Math.sin(frame * 0.07) * 3, lUA: -16, lFA: 30, rUA: 18, rFA: -26 } : POSES.stand;
    fc = face(0.9, 0, 0.5);
  } else if (s < 700) {
    // the doors open: he turns to face them and backs off
    flip = true;
    x = track(s, [beats.ding, 700], [170, 250]);
    pose = P78.backUp;
    fc = face(1, 0.3, 0.5);
  } else if (s < STEPS[0]) {
    flip = true;
    x = 250;
    pose = s >= beats.key ? lerpPose(KAI.watch, P78.look, clamp01((s - beats.key) / 15)) : { ...KAI.watch, duck: 0.15 + Math.sin(frame * 0.1) * 0.05 };
    if (s >= beats.her && s < beats.her + 20) pose = lerpPose(pose, KAI.flinch, 1 - clamp01((s - beats.her) / 20));
    fc = face(s >= beats.key ? 0.6 : 0.9, s >= beats.her && s < beats.key ? 0.4 : 0, 0.4);
  } else if (s < beats.choice) {
    flip = true;
    x = track(s, [STEPS[0], STEPS[3]], [250, 300]);
    const k = impulse(s, STEPS, 6);
    pose = lerpPose(P78.backUp, KAI.flinch, clamp01(k));
    fc = face(1, 0.5, 0.9);
  } else {
    flip = true;
    x = 290;
    const sway = Math.sin(frame * 0.18);
    pose = { ...TORN, lean: TORN.lean + sway * 8, rUA: TORN.rUA + sway * 10, lUA: TORN.lUA - sway * 12 };
    fc = face(1, 0.5, 1);
  }
  return { x, y, pose, flip, rot, face: fc };
};

const bulbsAt = (s: number, frame: number) => {
  const fl = (i: number) => (Math.sin(frame * 1.7 + i * 2.1) * Math.sin(frame * 0.53 + i) > -0.2 ? 1 : 0.15);
  if (s < beats.slam) return [0, 1, 2].map(fl);
  if (s < beats.slam + 10) return [0, 0, 0];
  if (s < 175) return [1, fl(1), 1];
  if (s >= 530 && s < 645) return [0.6, 0.55 + 0.1 * fl(2), 0.6];
  if (s >= beats.her - 5 && s < beats.her + 1) return [0, 0, 0];
  if (s >= STEPS[0] && s < beats.freeze) {
    const k = impulse(s, STEPS, 4);
    return [0, 1, 2].map((i) => clamp01(1 - k * (0.8 + 0.2 * i)) * fl(i));
  }
  return [1, 1, 0.92 + 0.08 * fl(2)];
};

// Crayon on paper: a doubled, slightly offset stroke
const Crayon: React.FC<{ d: string; color: string; w?: number }> = ({ d, color, w = 7 }) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={color} strokeWidth={w} opacity={0.8} />
    <path d={d} stroke={color} strokeWidth={w * 0.5} opacity={0.6} transform="translate(2 -1.5)" />
  </g>
);
const CRAYON_FONT = '"Comic Sans MS", "Chalkboard SE", cursive';

// One child's drawing: an elevator with three bulbs, someone inside, a floor number
const Doodle: React.FC<{ x: number; y: number; w: number; h: number; rot: number; num: string; who: "stand" | "lie" | "none" | "girl"; black?: boolean; theo?: boolean }> = ({ x, y, w, h, rot, num, who, black, theo }) => {
  const bx = -w * 0.3;
  const bw = w * 0.42;
  const by = -h * 0.28;
  const bh = h * 0.62;
  const fy = by + bh - 10;
  const fx = bx + bw / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} fill="#000" opacity={0.25} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#efe8d4" />
      <rect x={-w / 2 + 6} y={-h / 2 - 14} width={70} height={28} fill="#e9e3b0" opacity={0.7} transform="rotate(-8)" />
      <rect x={w / 2 - 76} y={-h / 2 - 12} width={70} height={28} fill="#e9e3b0" opacity={0.7} transform="rotate(7)" />
      <Crayon d={`M ${bx} ${by} L ${bx + bw} ${by + 3} L ${bx + bw - 2} ${by + bh} L ${bx + 2} ${by + bh - 2} Z`} color="#444" w={w * 0.016} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={bx + bw * (0.2 + i * 0.3)} cy={by + 18} r={w * 0.016} fill="#e8b400" />
      ))}
      {black ? <Crayon d={Array.from({ length: 14 }, (_, i) => `M ${bx + 6} ${by + 10 + i * (bh / 14)} L ${bx + bw - 6} ${by + 18 + i * (bh / 14)}`).join(" ")} color="#111" w={w * 0.03} /> : null}
      {who === "stand" || who === "girl" ? (
        <g>
          <circle cx={fx} cy={fy - bh * 0.62} r={w * 0.035} fill="#111" />
          <Crayon d={`M ${fx} ${fy - bh * 0.56} L ${fx} ${fy - bh * 0.28} M ${fx} ${fy - bh * 0.28} L ${fx - 14} ${fy} M ${fx} ${fy - bh * 0.28} L ${fx + 14} ${fy} M ${fx - 20} ${fy - bh * 0.45} L ${fx + 20} ${fy - bh * 0.45}`} color="#111" w={w * 0.014} />
        </g>
      ) : null}
      {who === "lie" ? <Crayon d={`M ${bx + 20} ${fy} L ${bx + bw - 30} ${fy} M ${bx + bw - 30} ${fy} m 10 0 a 10 10 0 1 0 0.1 0`} color="#111" w={w * 0.016} /> : null}
      {who === "girl" ? (
        <g>
          <polygon points={`${bx + bw + 50},${fy - 70} ${bx + bw + 30},${fy - 20} ${bx + bw + 70},${fy - 20}`} fill="#c0392b" />
          <circle cx={bx + bw + 50} cy={fy - 84} r={w * 0.03} fill="#111" />
          <Crayon d={`M ${bx + bw + 44} ${fy - 20} L ${bx + bw + 42} ${fy} M ${bx + bw + 56} ${fy - 20} L ${bx + bw + 58} ${fy}`} color="#111" w={w * 0.012} />
        </g>
      ) : null}
      <text x={bx + bw + w * 0.18} y={by + bh * 0.3} textAnchor="middle" fontFamily={CRAYON_FONT} fontWeight={700} fontSize={w * 0.14} fill="#c0392b">
        {num}
      </text>
      {theo ? (
        <g>
          <text x={0} y={-h * 0.36} textAnchor="middle" fontFamily={CRAYON_FONT} fontWeight={700} fontSize={w * 0.13} fill="#c0392b" letterSpacing={6}>
            THEO
          </text>
          {/* something very tall standing next to the elevator, scribbled hard in black */}
          <Crayon
            d={Array.from({ length: 18 }, (_, i) => `M ${w * 0.3 + Math.sin(i) * 14} ${by - 20 + i * 14} L ${w * 0.4 + Math.cos(i) * 10} ${by - 10 + i * 14}`).join(" ") + ` M ${w * 0.35} ${by + bh * 0.3} L ${w * 0.33} ${by + bh} M ${w * 0.37} ${by + bh * 0.3} L ${w * 0.42} ${by + bh}`}
            color="#111"
            w={w * 0.02}
          />
          <circle cx={w * 0.33} cy={by + 6} r={w * 0.012} fill="#efe8d4" />
          <circle cx={w * 0.38} cy={by + 8} r={w * 0.012} fill="#efe8d4" />
        </g>
      ) : null}
    </g>
  );
};

const Drawings: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    <rect x={-800} y={-400} width={2700} height={2800} fill="#203535" />
    <rect x={-800} y={1520} width={2700} height={900} fill="#2e4c52" />
    {Array.from({ length: 24 }, (_, i) => (
      <g key={i}>
        <line x1={-800 + i * 120} y1={1520} x2={-800 + i * 120} y2={2400} stroke="#18292d" strokeWidth={8} />
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={-760 + i * 120} y={1560 + k * 16} width={40} height={6} fill="#18292d" />
        ))}
      </g>
    ))}
    <Doodle x={-120} y={760} w={420} h={340} rot={-6} num="37" who="stand" />
    <Doodle x={140} y={1290} w={380} h={300} rot={4} num="64" who="lie" />
    <Doodle x={930} y={720} w={400} h={320} rot={5} num="88" who="none" black />
    <Doodle x={980} y={1300} w={420} h={330} rot={-4} num="5" who="girl" />
    <Doodle x={540} y={1010} w={560} h={460} rot={-2} num="12" who="stand" theo />
    <rect x={-800} y={-400} width={2700} height={2800} fill="#000" opacity={0.1 + 0.06 * Math.sin(frame * 0.8) * Math.sin(frame * 0.3)} />
  </g>
);

// The girl up close, in the light of the one tube still working above her
const KidClose: React.FC<{ frame: number; s: number }> = ({ frame, s }) => (
  <g>
    <rect x={-600} y={-400} width={2300} height={2800} fill="#182625" />
    <rect x={-600} y={1250} width={2300} height={1200} fill="#22393c" />
    {Array.from({ length: 22 }, (_, i) => (
      <line key={i} x1={-600 + i * 130} y1={1250} x2={-600 + i * 130} y2={2450} stroke="#15262a" strokeWidth={10} />
    ))}
    <ellipse cx={540} cy={120} rx={700} ry={360} fill="url(#tubeGlow0)" opacity={0.8 + 0.2 * Math.sin(frame * 0.9)} />
    <rect x={300} y={60} width={480} height={40} rx={10} fill="#effff8" />
    {Array.from({ length: 30 }, (_, i) => {
      const p = (frame * 0.004 + rand(i + 900)) % 1;
      return <circle key={i} cx={(rand(i + 910) * 1300 - 100 + Math.sin(frame * 0.02 + i) * 40)} cy={200 + p * 1500} r={2 + rand(i) * 3} fill="#d8fff0" opacity={0.25 * (1 - p)} />;
    })}
    <Kid x={540} y={2050} scale={3.4} frame={frame} tilt={track(s, [beats.key, 1075], [0, 10])} glow={s >= beats.keyGlow ? 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.2)) : 0.2} />
    <rect x={-600} y={-400} width={2300} height={2800} fill="url(#vignette0)" />
  </g>
);

export const Part01: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  // past the freeze the picture holds on the moment of choice
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const shot = shotAt(s);
  const cam = camOf(s, shot);

  const stepsOut = STEPS.map(toOut);
  const kick = impulse(f, [toOut(beats.slam), toOut(beats.noZero), toOut(beats.ding), toOut(beats.her), toOut(beats.eyes), ...stepsOut], 4) * 20;
  const falling = s < beats.slam;
  const shake = handheld(f, falling ? 9 : 3, { x: kick * Math.sin(f * 3) + (falling ? Math.sin(f * 2.3) * 10 : 0), y: kick * 0.6 + (falling ? Math.cos(f * 1.9) * 8 : 0) });

  // ---------- the car ----------
  const theo = theoAt(s, f);
  const bulbs = bulbsAt(s, f);
  const swing = s >= beats.slam && s < 400 ? 22 * Math.exp(-(s - beats.slam) / 70) : s >= STEPS[0] ? 3 + impulse(s, STEPS, 8) * 10 : 2;
  const speaker = s >= 530 && s < 645 ? 0.55 + 0.45 * Math.abs(Math.sin(f * 0.5)) : 0;
  const open = track(s, beats.open, [0, 1]);
  const drop = dropAt(s);
  const floorNum = falling ? String(Math.max(12, 88 - Math.floor(drop / 520))) : s < beats.ding ? (f % 20 < 10 ? "--" : "") : "12";

  // ---------- the corridor ----------
  const flick = (i: number) => (Math.sin(f * 1.3 + i * 1.7) * Math.sin(f * 0.41 + i) > -0.6 ? 1 : 0.3);
  const outAt = [Infinity, Infinity, Infinity, STEPS[2], STEPS[1], STEPS[0]];
  const tubes = TUBES.map((_, i) => {
    if (s >= beats.her - 5 && s < beats.her) return 0;
    if (s >= outAt[i]) return 0;
    const k = s >= STEPS[0] ? impulse(s, STEPS, 3) : 0;
    return clamp01(0.95 * flick(i) - k * 0.7);
  });
  const dark = s < 1078 ? 99 : track(s, [1078, 1081, STEPS[0], STEPS[0] + 3, STEPS[1], STEPS[1] + 3, STEPS[2], STEPS[2] + 3], [99, 10, 10, 7.2, 7.2, 5.3, 5.3, 3.9]);
  const girlOn = s >= beats.her;
  const zg = 3.4;
  const zm = track(s, [1078, STEPS[0], STEPS[1], STEPS[2], STEPS[3], STEPS[4]], [10.5, 9.4, 7.6, 6.0, 5.0, 4.4]);
  const eyes = clamp01((s - 1108) / 12);
  const stepK = impulse(s, STEPS, 4);
  const gp = proj(-34, 0, zg);
  const mp = proj(40, 0, zm);
  const corridor = (
    <Corridor
      frame={f}
      tubes={tubes}
      dark={dark}
      front={
        <g>
          {s >= 1078 ? <Tall x={mp.x} y={mp.y} scale={1.15 / zm} frame={f} eyes={eyes} step={stepK} /> : null}
          {girlOn ? <Kid x={gp.x} y={gp.y} scale={1 / zg} frame={f} tilt={track(s, [beats.her, beats.freeze], [0, 14])} smile={track(s, [1290, beats.freeze], [0, 1])} glow={s >= beats.keyGlow ? 0.7 : 0.3} /> : null}
        </g>
      }
    />
  );

  // ---------- panel close-up: his finger finds nothing ----------
  const tip = { x: track(s, [222, beats.noZero], [1000, PANEL.cx + 6]), y: track(s, [222, beats.noZero], [1880, PANEL.hole]) - impulse(s, [beats.noZero, 258, 268, 280], 3) * -14 };

  let scene: React.ReactNode = null;
  if (shot.set === "car") {
    scene = (
      <g>
        <Shaft frame={f} drop={drop} cx={CX} top={-2600} bottom={4600} speed={falling ? Math.min(60, 4 + s * 0.5) : 0} />
        <g transform={`translate(${CX + (falling ? Math.sin(f * 2.7) * 8 : 0)} ${CY})`}>
          <Car frame={f} open={open} floor={floorNum} bulbs={bulbs} swing={swing} speaker={speaker} lit={s >= 175 && s < beats.ding + 30 ? 12 : -1} exterior beyond={corridor}>
            <g transform={`rotate(${theo.rot} ${theo.x} ${theo.y - 250})`}>
              <StickFigure pose={theo.pose} x={theo.x} y={theo.y} scale={TS} frame={f} flip={theo.flip} face={theo.face} />
            </g>
          </Car>
        </g>
        <Sparks frame={f} x={CX} y={CY - 900} amount={falling ? 0.3 + (s / beats.slam) * 0.7 : s < beats.slam + 14 ? 1.4 * (1 - (s - beats.slam) / 14) : 0} />
        {s >= beats.slam && s < beats.slam + 4 ? <rect x={-2000} y={-2000} width={5000} height={6000} fill="#fff3c4" opacity={0.7 * (1 - (s - beats.slam) / 4)} /> : null}
      </g>
    );
  } else if (shot.set === "panel") {
    scene = (
      <g>
        <PanelClose frame={f} lit={12} />
        {s >= 222 ? (
          <g strokeLinecap="round" strokeLinejoin="round" fill="none">
            <polyline points={`${tip.x + 420},${tip.y + 700} ${tip.x + 170},${tip.y + 210} ${tip.x},${tip.y}`} stroke="#111" strokeWidth={34} />
            <circle cx={tip.x} cy={tip.y} r={20} fill="#111" />
          </g>
        ) : null}
      </g>
    );
  } else if (shot.set === "wall") {
    scene = <NoticeWall frame={f} scratch={1} />;
  } else if (shot.set === "draw") {
    scene = <Drawings frame={f} />;
  } else {
    scene = <KidClose frame={f} s={s} />;
  }

  const punch = 1 + 0.07 * impulse(f, EMPH, 5);
  const freezeT = frozen ? frame - toOut(beats.freeze) : 0;
  const timerSec = s < beats.choice ? 30 - (20 * (s - beats.timerStart)) / (beats.choice - beats.timerStart) : 10 - (3 * (s - beats.choice)) / (beats.freeze - beats.choice);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ filter: frozen ? `grayscale(${Math.min(0.8, freezeT * 0.1)}) brightness(${Math.max(0.5, 1 - freezeT * 0.06)})` : undefined }}
      >
        <Defs0 />
        <defs>
          <filter id="zombieGlow">
            <feGaussianBlur stdDeviation={2} />
          </filter>
        </defs>
        <g transform={`translate(540 960) scale(${punch * (1 + freezeT * 0.0012)}) translate(-540 -960)`}>
          <g transform={cameraTransform(cam, shake)}>{scene}</g>
        </g>
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      <Badge0 frame={frame} part={1} title="FLOOR TWELVE" until={Math.round(toOut(100))} />
      <DoorTimer frame={frame} from={Math.round(toOut(beats.timerStart))} seconds={timerSec} frozen={frozen} />
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO DO?" a="RUN FOR THE KEY" b="STAY & PRESS ANOTHER BUTTON" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <EndCard0 frame={frame} from={Math.round(toOut(beats.card))} part={1} />
    </AbsoluteFill>
  );
};
