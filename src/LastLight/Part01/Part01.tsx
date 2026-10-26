import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { GAITS, lerpPose, poseAt, POSES, StickFigure, walkPose } from "../../shared/rig";
import { clamp01, impulse, KAI, makeWarp, track } from "../kit";
import { Captions, PartCard, SeriesBadge } from "../Overlays";
import { Crack, Defs, Door, Dresser, HandPrints, Horde, Outside, Room, SET, TVScreen, WindowFrame, Zombie } from "../world";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;

const { toStory } = makeWarp(timeline);
const OUT = timeline.anchors.map((a) => a[1]);
const STORY = timeline.anchors.map((a) => a[0]);

// Door bangs land on the spoken words of the "hit" line (output frames)
const BANGS = timeline.captions.filter((c) => c.line === "hit").flatMap((c) => c.words.map((w) => w.frame));
type KaiPose = keyof typeof KAI;

const KAI_KEYS: [number, KaiPose][] = [
  [0, "hold"],
  [40, "hold"],
  [56, "sip"],
  [80, "hold"],
  [100, "hold"],
  [126, "watch"],
  [205, "watch"],
  [222, "hold"],
  [440, "hold"],
  [452, "flinch"],
  [476, "flinch"],
  [492, "stand"],
  [530, "push"],
  [574, "push"],
  [584, "brace"],
  [662, "brace"],
  [702, "sit"],
  [776, "sit"],
  [796, "sitLook"],
];
const KAI_X = { frames: [0, 100, 128, 205, 288, 448, 464, 476, 530, 574, 662, 702], values: [990, 990, 1170, 1170, 640, 640, 724, 734, 1612, 1772, 1772, 1792] };

export const Part01: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);

  // ---------- Camera (story frames) ----------
  const CAM = [0, 70, 84, 98, 200, 228, 285, 300, 335, 388, 410, 432, 447, 458, 480, 530, 575, 600, 662, 700, 760, 772, 848, 900];
  const fx = track(s, CAM, [990, 990, 990, 1470, 1470, 1150, 700, 560, 460, 470, 525, 525, 525, 700, 900, 1450, 1790, 1860, 1860, 1790, 1790, 455, 455, 455]);
  const fy = track(s, CAM, [1250, 1250, 1250, 1000, 1000, 1150, 1150, 1050, 935, 935, 1030, 1030, 1030, 1280, 1250, 1250, 1250, 1220, 1220, 1370, 1370, 940, 940, 940]);
  const z = track(s, CAM, [1.6, 1.68, 1.68, 1.85, 1.85, 1.05, 1.2, 1.5, 2.55, 2.55, 3.3, 3.3, 3.3, 1.5, 1.25, 1.2, 1.35, 1.5, 1.5, 2.1, 2.3, 1.45, 1.85, 1.85]);
  const bang = impulse(frame, BANGS);
  const shake = bang * 16 + clamp01((s - beats.charge[0]) / 6) * clamp01((beats.charge[1] + 6 - s) / 6) * 5;
  const shx = shake * Math.sin(frame * 2.9);
  const shy = shake * Math.cos(frame * 3.7) * 0.7;
  const zoomKick = 1 + bang * 0.04;
  const camera = `translate(${540 - fx * z * zoomKick + shx} ${960 - fy * z * zoomKick + shy}) scale(${z * zoomKick})`;

  // ---------- Kai ----------
  const kx = track(s, KAI_X.frames, KAI_X.values);
  const speed = Math.abs(track(s + 1, KAI_X.frames, KAI_X.values) - track(s - 1, KAI_X.frames, KAI_X.values)) / 2;
  const flip = (s > 205 && s < 452) || s >= 662;
  const base = poseAt(s, KAI_KEYS, KAI);
  const gait = speed > 9 ? GAITS.run : GAITS.walk;
  const stride = speed > 9 ? 300 : 190;
  let pose = lerpPose(base, walkPose((flip ? -kx : kx) / stride, gait, base), clamp01(speed / 3));
  const holdingMug = s < beats.mugDrop;
  if (holdingMug) pose = { ...pose, rUA: base.rUA, rFA: base.rFA };
  if (s >= 574 && s < 662) pose = { ...pose, lean: pose.lean - bang * 10 };
  const worry = track(s, [0, 95, 130, 222, 330, 396, 430, 520, 662, 720, 790], [0, 0, 0.45, 0.4, 0.75, 1, 1, 1, 1, 0.85, 1]);
  const gasp = clamp01((s - beats.dawsonSnap) / 4) * clamp01((beats.dawsonSnap + 40 - s) / 10);
  const pant = s > 480 && s < 760 ? 0.25 + 0.2 * Math.sin(frame * 0.5) : 0;
  const face = { worry, smile: 0, mouth: Math.max(gasp * 0.7, pant), sweat: s > 560 ? 0.8 : 0 };

  // ---------- Mr. Dawson across the street ----------
  const charge = clamp01((s - beats.charge[0]) / (beats.charge[1] - beats.charge[0]));
  const chargeE = charge * charge;
  const dawsonOn = s > 150 && charge < 1;
  const dx = track(s, [210, 392, beats.charge[0], beats.charge[1]], [380, 545, 545, 450]);
  const snapped = s >= beats.dawsonSnap;
  const twitch = snapped ? 0 : 18 + 16 * Math.sin(frame * 1.3) * (Math.sin(frame * 0.23) > 0.3 ? 1 : 0.2);
  const shambling = !snapped || charge > 0;
  const dawsonPose = shambling
    ? walkPose(frame / (charge > 0 ? 9 : 34), charge > 0 ? GAITS.run : GAITS.shamble, { ...POSES.stand, tilt: twitch, lUA: 60, lFA: 70, rUA: 75, rFA: 84 })
    : { ...POSES.stand, tilt: 0, lUA: -20, lFA: -10, rUA: 20, rFA: 10 };
  const dawsonGlow = snapped ? 1 : 0.15;
  const dawsonScale = 0.3 + chargeE * 1.5;
  const dawsonY = SET.street + chargeE * 420;

  // ---------- Props & effects ----------
  const dresserX = track(s, [0, beats.dresser[0], beats.dresser[1]], [1690, 1690, 1852]) - bang * 7;
  const mugT = s - beats.mugDrop;
  const shatter = s - beats.mugShatter;
  const horde = clamp01((s - beats.whip) / 14);
  const crack = clamp01((s - beats.crack[0]) / (beats.crack[1] - beats.crack[0]));
  const lampFlicker = s > beats.silence && s < 770 ? (Math.sin(frame * 0.9) * Math.sin(frame * 0.31) > 0.55 ? 0.25 : 1) : 1 - bang * 0.5;
  const tvSince = s - beats.tvOn;
  const tvGlow = tvSince > 0 && s < beats.tvDead ? 0.55 + 0.25 * (Math.floor(frame / 8) % 2) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0c12" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        <g transform={camera}>
          <Room />
          <Outside frame={frame}>
            {dawsonOn ? <Zombie x={dx} y={dawsonY} scale={dawsonScale} pose={dawsonPose} frame={frame} glow={dawsonGlow} color="#56604f" flip={charge > 0} /> : null}
            <Horde frame={frame} reveal={horde} />
          </Outside>
          <HandPrints frame={frame} t={clamp01((s - beats.whip - 6) / 70)} />
          <Crack progress={crack} />
          <WindowFrame />
          <ellipse cx={450} cy={1300} rx={420} ry={260} fill="url(#duskGlow)" />
          <TVScreen frame={frame} since={tvSince} dead={beats.tvDead - beats.tvOn} />
          <ellipse cx={1470} cy={1100} rx={520 * tvGlow} ry={420 * tvGlow} fill="url(#redGlow)" opacity={tvGlow} />
          <ellipse cx={SET.lamp.x} cy={SET.lamp.top + 60} rx={620} ry={560} fill="url(#lampGlow)" opacity={lampFlicker} />
          <Door shake={bang} />
          <Dresser x={dresserX} />
          {/* dust shaken off the door frame */}
          {BANGS.map((b, bi) =>
            frame >= b && frame < b + 40
              ? Array.from({ length: 10 }, (_, i) => (
                  <circle key={`${bi}-${i}`} cx={SET.door.x + 20 + ((i * 53 + bi * 17) % 200)} cy={SET.door.y - 10 + (frame - b) ** 1.6 * (0.6 + (i % 3) * 0.3)} r={3 + (i % 3)} fill="#9aa3b5" opacity={0.7 * (1 - (frame - b) / 40)} />
                ))
              : null,
          )}
          <ellipse cx={kx} cy={SET.floor + 2} rx={60} ry={10} fill="#000" opacity={0.3} />
          <StickFigure
            pose={pose}
            x={kx}
            y={SET.floor}
            scale={1}
            frame={frame}
            flip={flip}
            face={face}
            prop={
              holdingMug
                ? (sk) => (
                    <g transform={`translate(${sk.rHand.x + 4} ${sk.rHand.y - 8})`}>
                      <rect x={-12} y={-20} width={26} height={30} rx={4} fill="#E8E2D6" />
                      <path d="M 14 -14 Q 26 -6 14 4" stroke="#E8E2D6" strokeWidth={5} fill="none" />
                      {s < 90 ? <path d={`M -4 -26 Q ${2 + Math.sin(frame * 0.2) * 4} -40 -2 -54`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.35} /> : null}
                    </g>
                  )
                : undefined
            }
          />
          {/* the dropped mug: falls, then shatters into a coffee splash */}
          {mugT >= 0 && shatter < 0 ? (
            <g transform={`translate(${704 + mugT * 1.5} ${1300 + mugT * mugT * 1.3}) rotate(${mugT * 22})`}>
              <rect x={-12} y={-15} width={26} height={30} rx={4} fill="#E8E2D6" />
            </g>
          ) : null}
          {shatter >= 0 ? (
            <g>
              <ellipse cx={730} cy={SET.floor + 6} rx={Math.min(90, 20 + shatter * 8)} ry={Math.min(16, 4 + shatter * 1.5)} fill="#3b2314" opacity={0.9} />
              {Array.from({ length: 9 }, (_, i) => {
                const a = -Math.PI * (0.1 + 0.8 * ((i * 0.37) % 1));
                const t = Math.min(shatter, 16);
                return <rect key={i} x={730 + Math.cos(a) * t * (5 + (i % 4))} y={SET.floor - 4 + Math.sin(a) * t * 6 + t * t * 0.45} width={10} height={7} fill="#E8E2D6" transform={`rotate(${i * 40 + t * 30} 730 ${SET.floor})`} />;
              })}
            </g>
          ) : null}
          {horde > 0 ? <ellipse cx={450} cy={940} rx={520} ry={520} fill="url(#greenGlow)" opacity={horde} /> : null}
        </g>
        <rect width={1080} height={1920} fill="url(#vignette)" />
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <SeriesBadge frame={frame} part={1} title="DAY ONE" until={Math.round(OUT[1] ? interpolate(88, STORY, OUT) : 88)} />
      <Captions frame={frame} chunks={timeline.captions} broadcast={["tv"]} />
      <PartCard frame={frame} from={Math.round(interpolate(beats.card, STORY, OUT, { extrapolateRight: "extend" }))} part={1} />
    </AbsoluteFill>
  );
};
