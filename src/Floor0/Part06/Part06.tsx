import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { lerpPose, Pose, POSES, skeleton, StickFigure } from "../../shared/rig";
import {
  cameraTransform,
  clamp01,
  handheld,
  impulse,
  KAI,
  makeWarp,
  track,
} from "../../LastLight/kit";
import { face } from "../../LastLight/bridge";
import { Captions, SPEAKERS } from "../../LastLight/Overlays";
import { Defs0, Led, Tallies } from "../elevator";
import { ControlRoom, CTRL } from "../control";
import { Badge0, ChoiceCards, EndCard0, HookText, Lives } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) =>
  c.words.filter((w) => w.emph).map((w) => w.frame),
);

const F = CTRL.floor;
const TX = 560;
const SC = 1.45;
// the centre screen of the wall, where the girl waved in Part 5
const SCREEN = { x: 380, y: 640, w: 136, h: 114 };
const CENTRE = { x: SCREEN.x + SCREEN.w / 2, y: SCREEN.y + SCREEN.h / 2 };
const HEAD = (() => {
  const sk = skeleton(KAI.watch);
  return { x: TX + sk.head.x * SC, y: F + 34 + sk.head.y * SC };
})();
const PAPER = { x: 690, y: F - 240, w: 240, h: 150 };

type Shot0 = {
  from: number;
  to: number;
  keys: [number, number, number, number][];
};
const SHOTS: Shot0[] = [
  // the headset coming down on his head, then the whole wall waking up
  {
    from: 0,
    to: 20,
    keys: [
      [0, HEAD.x, HEAD.y, 3.3],
      [20, HEAD.x, HEAD.y - 10, 2.9],
    ],
  },
  {
    from: 20,
    to: 60,
    keys: [
      [20, 440, 560, 0.72],
      [60, 440, 620, 0.66],
    ],
  },
  {
    from: 60,
    to: 110,
    keys: [
      [60, 520, 1150, 1.6],
      [110, 520, 1150, 1.8],
    ],
  },
  {
    from: 110,
    to: 150,
    keys: [
      [110, -130, 1130, 1.0],
      [150, -130, 1130, 1.18],
    ],
  },
  {
    from: 150,
    to: 205,
    keys: [
      [150, 560, 1130, 1.4],
      [205, 560, 1130, 1.6],
    ],
  },
  {
    from: 205,
    to: 290,
    keys: [
      [205, -600, 640, 1.1],
      [290, 1200, 640, 1.0],
    ],
  },
  {
    from: 290,
    to: 400,
    keys: [
      [290, HEAD.x + 20, HEAD.y, 2.4],
      [400, HEAD.x + 30, HEAD.y, 2.7],
    ],
  },
  {
    from: 400,
    to: 485,
    keys: [
      [400, 520, 1130, 1.8],
      [485, 520, 1130, 1.9],
    ],
  },
  {
    from: 485,
    to: 625,
    keys: [
      [485, HEAD.x + 10, HEAD.y, 2.2],
      [625, HEAD.x + 20, HEAD.y, 2.5],
    ],
  },
  {
    from: 625,
    to: 725,
    keys: [
      [625, PAPER.x + 120, PAPER.y - 70, 2.6],
      [725, PAPER.x + 120, PAPER.y - 70, 3.1],
    ],
  },
  {
    from: 725,
    to: 840,
    keys: [
      [725, CENTRE.x, CENTRE.y + 60, 1.3],
      [840, CENTRE.x, CENTRE.y, 7.0],
    ],
  },
  {
    from: 840,
    to: 935,
    keys: [
      [840, HEAD.x + 30, HEAD.y, 2.6],
      [935, HEAD.x + 30, HEAD.y, 2.9],
    ],
  },
  {
    from: 935,
    to: 9999,
    keys: [
      [935, 420, 1150, 1.25],
      [1020, 430, 1160, 1.5],
    ],
  },
];
const camOf = (s: number) => {
  const shot =
    SHOTS.find((sh) => s >= sh.from && s < sh.to) ?? SHOTS[SHOTS.length - 1];
  const f = shot.keys.map((k) => k[0]);
  const at = (i: number) =>
    track(
      s,
      f,
      shot.keys.map((k) => k[i]),
    );
  return { fx: at(1), fy: at(2), z: at(3) };
};

const PUTON: Pose = {
  ...POSES.stand,
  lean: 2,
  tilt: -4,
  duck: 0.1,
  lUA: -140,
  lFA: -70,
  rUA: 140,
  rFA: 70,
};
const LISTEN: Pose = { ...KAI.watch, tilt: 12, rUA: 150, rFA: 80 };
const MIC: Pose = { ...KAI.watch, tilt: 10, duck: 0.2, rUA: 118, rFA: 40 };
const TORN: Pose = {
  ...POSES.stand,
  lean: 4,
  tilt: 6,
  duck: 0.3,
  rUA: 70,
  rFA: 86,
  lUA: -62,
  lFA: -74,
  lTh: -14,
  lSh: -6,
  rTh: 14,
  rSh: 4,
};

// The headset on Theo's head: band, cups, a mic boom with its light. Drawn in head coordinates (head centre at 0,0, radius 30).
const Headset: React.FC<{ lift: number; talk: number; live: number }> = ({
  lift,
  talk,
  live,
}) => (
  <g transform={`translate(0 ${-lift})`}>
    <path
      d="M -36 -2 A 36 36 0 0 1 36 -2"
      fill="none"
      stroke="#c9ced6"
      strokeWidth={8}
    />
    <rect x={-46} y={-14} width={20} height={34} rx={8} fill="#c9ced6" />
    <rect x={26} y={-14} width={20} height={34} rx={8} fill="#c9ced6" />
    <line x1={38} y1={14} x2={66} y2={30} stroke="#c9ced6" strokeWidth={4} />
    {talk > 0 || live > 0 ? (
      <circle
        cx={70}
        cy={32}
        r={60}
        fill="url(#redGlow0)"
        opacity={Math.max(talk * 0.7, live)}
      />
    ) : null}
    <circle
      cx={70}
      cy={32}
      r={7}
      fill={live > 0 ? "#ff2a1a" : "#ffb347"}
      opacity={0.25 + 0.75 * Math.max(talk, live)}
      filter="url(#glow0)"
    />
  </g>
);

export const Part06: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const cam = camOf(s);
  const hooking = s < beats.hookEnd;

  const kick =
    impulse(
      f,
      [
        toOut(beats.on),
        toOut(20),
        toOut(60),
        toOut(110),
        toOut(beats.shut[1]),
        toOut(beats.op),
        toOut(beats.tally[0]),
        toOut(beats.paper[0]),
        toOut(beats.mic),
      ],
      4,
    ) * 22;
  const shake = handheld(f, hooking ? 8 : 3, {
    x: kick * Math.sin(f * 3),
    y: kick * 0.6,
  });

  // ---------- the wall waking, the doors shutting ----------
  const wake = clamp01((s - beats.wake[0]) / (beats.wake[1] - beats.wake[0]));
  const c = track(s, beats.shut, [0, 1]);
  const opTalk =
    (s >= beats.op && s < beats.op + 100) ||
    (s >= beats.op2 && s < beats.op2 + 130)
      ? 0.5 + 0.5 * Math.abs(Math.sin(f * 0.5))
      : 0;
  const live = s >= beats.mic ? 1 : 0;
  const tallyT =
    s >= beats.tally[0] && s < beats.tally[1]
      ? clamp01((s - beats.tally[0]) / 60)
      : -1;
  const dark = clamp01((s - beats.dark[0]) / (beats.dark[1] - beats.dark[0]));
  const newTheo = clamp01((s - beats.centre + 10) / 12);

  // ---------- Theo ----------
  const lift = s < beats.on ? (beats.on - s) * 7 : 0;
  // the script lies flat on the desk until he picks it up
  const up = clamp01((s - beats.paper[0] + 6) / 12);
  const tPose: Pose =
    s < beats.on + 8
      ? PUTON
      : s < beats.op
        ? lerpPose(PUTON, KAI.watch, clamp01((s - beats.on - 8) / 18))
        : s < beats.tally[0]
          ? lerpPose(KAI.watch, LISTEN, clamp01((s - beats.op) / 12))
          : s < beats.op2
            ? lerpPose(
                LISTEN,
                { ...KAI.watch, tilt: -10 },
                clamp01((s - beats.tally[0]) / 15),
              )
            : s < beats.paper[0]
              ? lerpPose(
                  { ...KAI.watch, tilt: -10 },
                  LISTEN,
                  clamp01((s - beats.op2) / 12),
                )
              : s < beats.mic
                ? lerpPose(
                    LISTEN,
                    { ...KAI.watch, lean: 14, tilt: 18, duck: 0.2 },
                    clamp01((s - beats.paper[0]) / 15),
                  )
                : s < beats.choice
                  ? lerpPose(
                      { ...KAI.watch, lean: 14, tilt: 18, duck: 0.2 },
                      MIC,
                      clamp01((s - beats.mic) / 10),
                    )
                  : lerpPose(
                      MIC,
                      {
                        ...TORN,
                        lean: TORN.lean + Math.sin(f * 0.2) * 7,
                        rUA: TORN.rUA + Math.sin(f * 0.3) * 8,
                      },
                      clamp01((s - beats.choice) / 15),
                    );
  const tFace = face(
    1,
    s < beats.wake[1] ? 0.8 : s >= beats.mic ? 0.7 : 0.25,
    0.8,
  );
  const sk = skeleton(tPose);

  const punch = 1 + 0.08 * impulse(f, EMPH, 5);
  const freezeT = frozen ? frame - toOut(beats.freeze) : 0;
  const filter = frozen
    ? `grayscale(${Math.min(0.8, freezeT * 0.1)}) brightness(${Math.max(0.5, 1 - freezeT * 0.06)})`
    : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ filter }}
      >
        <Defs0 />
        <g
          transform={`translate(540 960) scale(${punch * (1 + freezeT * 0.0012)}) translate(-540 -960)`}
        >
          <g transform={cameraTransform(cam, shake)}>
            <ControlRoom
              frame={f}
              alarm={0}
              swing={0.1}
              talk={0}
              dead={1 - wake}
              pressed
              girl={1}
              wake={wake}
              headset={false}
            >
              {/* the door panels, sliding shut behind him */}
              <rect
                x={-322}
                y={778}
                width={192 * c}
                height={722}
                fill="#6d7581"
              />
              <rect
                x={62 - 192 * c}
                y={778}
                width={192 * c}
                height={722}
                fill="#6d7581"
              />
              {/* the script, taped to the desk */}
              <g transform={`translate(${PAPER.x} ${PAPER.y}) rotate(${-2 * up}) scale(1 ${0.06 + 0.94 * up}) translate(0 ${-PAPER.h})`}>
                <rect
                  x={0}
                  y={0}
                  width={PAPER.w}
                  height={PAPER.h}
                  fill="#efe8d4"
                  stroke="#b7ad90"
                  strokeWidth={2}
                />
                <rect
                  x={PAPER.w / 2 - 22}
                  y={-7}
                  width={44}
                  height={14}
                  fill="#cfd6dd"
                  opacity={0.85}
                />
                <text
                  x={14}
                  y={28}
                  fontFamily="Arial Black, sans-serif"
                  fontSize={16}
                  fill="#b3211b"
                >
                  SHIFT SCRIPT
                </text>
                <g
                  fontFamily='"Courier New", monospace'
                  fontSize={14}
                  fontWeight={700}
                  fill="#23262c"
                >
                  <text x={14} y={56}>
                    1. Find Floor Zero,
                  </text>
                  <text x={14} y={72}>
                    {"   and you may leave."}
                  </text>
                  <text x={14} y={94}>
                    2. That&apos;s one light, Theo.
                  </text>
                  <text x={14} y={116}>
                    3. Floor One had a door.
                  </text>
                  <text x={14} y={138}>
                    4. Say it. You are the Operator.
                  </text>
                </g>
                <line
                  x1={10}
                  y1={60}
                  x2={PAPER.w - 10}
                  y2={56}
                  stroke="#b3211b"
                  strokeWidth={2}
                  opacity={0.5}
                />
              </g>
              {/* on the centre screen: a new Theo wakes beside the girl, and the dark comes in from the right */}
              {newTheo > 0 ? (
                <g
                  transform={`translate(${SCREEN.x + 24} ${SCREEN.y + 100}) scale(${0.26 * newTheo})`}
                >
                  <StickFigure
                    pose={
                      s >= beats.mic
                        ? { ...KAI.flinch, tilt: -30 }
                        : lerpPose(
                            KAI.flinch,
                            KAI.watch,
                            clamp01((s - beats.centre) / 30),
                          )
                    }
                    x={0}
                    y={0}
                    scale={1}
                    frame={f}
                    face={face(1, 0.6, 0.6)}
                  />
                </g>
              ) : null}
              {dark > 0 ? (
                <g>
                  <rect
                    x={SCREEN.x + SCREEN.w - SCREEN.w * 0.55 * dark}
                    y={SCREEN.y}
                    width={SCREEN.w * 0.55 * dark}
                    height={SCREEN.h}
                    fill="#07090c"
                    opacity={0.92}
                  />
                  <circle
                    cx={SCREEN.x + SCREEN.w - SCREEN.w * 0.55 * dark + 9}
                    cy={SCREEN.y + 26}
                    r={2.2}
                    fill="#fff"
                    opacity={dark}
                  />
                  <circle
                    cx={SCREEN.x + SCREEN.w - SCREEN.w * 0.55 * dark + 16}
                    cy={SCREEN.y + 25}
                    r={2.2}
                    fill="#fff"
                    opacity={dark}
                  />
                </g>
              ) : null}
              <StickFigure
                pose={tPose}
                x={TX}
                y={F + 34}
                scale={SC}
                frame={f}
                face={tFace}
              />
              <g
                transform={`translate(${TX + sk.head.x * SC} ${F + 34 + sk.head.y * SC}) rotate(${sk.headAngle}) scale(${SC})`}
              >
                <Headset lift={lift} talk={opTalk} live={live} />
              </g>
            </ControlRoom>
          </g>
        </g>
        {/* the tallies on the elevator wall, counted up: not days, tries */}
        {tallyT >= 0 ? (
          <g
            transform={`translate(540 ${track(s, [beats.tally[0], beats.tally[0] + 8], [2300, 980])})`}
          >
            <rect
              x={-420}
              y={-330}
              width={840}
              height={660}
              rx={18}
              fill="#3b3f47"
              stroke="#0a0a0a"
              strokeWidth={12}
            />
            <Tallies
              x={-380}
              y={-290}
              cols={12}
              rows={9}
              dx={64}
              dy={54}
              size={40}
              skip={(cc, r) => r * 12 + cc > tallyT * 108}
            />
            <rect
              x={-200}
              y={210}
              width={400}
              height={96}
              rx={12}
              fill="#060607"
              stroke="#4a4f57"
              strokeWidth={6}
            />
            <Led
              x={0}
              y={284}
              text={String(Math.round(1 + tallyT * 1200)).padStart(4, "0")}
              size={72}
            />
          </g>
        ) : null}
        {hooking && s < beats.wake[1] ? (
          <rect
            width={1080}
            height={1920}
            fill="#bfe3f2"
            opacity={0.18 * wake * Math.abs(Math.sin(f * 0.6))}
          />
        ) : null}
        {s >= beats.on && s < beats.on + 4 ? (
          <rect
            width={1080}
            height={1920}
            fill="#fff"
            opacity={0.8 * (1 - (s - beats.on) / 4)}
          />
        ) : null}
        {s >= beats.mic && s < beats.mic + 6 ? (
          <rect
            width={1080}
            height={1920}
            fill="#ff2a1a"
            opacity={0.35 * (1 - (s - beats.mic) / 6)}
          />
        ) : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? (
          <rect
            width={1080}
            height={1920}
            fill="#fff"
            opacity={Math.max(0, 0.6 - freezeT * 0.12)}
          />
        ) : null}
      </svg>
      <HookText
        frame={frame}
        until={Math.round(toOut(60))}
        lines={["I PUT IT ON.", "200 OF ME WOKE UP."]}
        top={120}
      />
      {!hooking ? (
        <Badge0
          frame={frame - Math.round(toOut(beats.hookEnd))}
          part={6}
          title="THE HEADSET"
          until={65}
        />
      ) : null}
      {!hooking ? (
        <Lives frame={frame} from={Math.round(toOut(beats.hookEnd))} left={3} />
      ) : null}
      <ChoiceCards
        frame={frame}
        from={Math.round(toOut(beats.cards))}
        question="WHAT SHOULD THEO SAY?"
        a="SAY THE LINE"
        b="TELL HIM THE TRUTH"
      />
      <Captions
        frame={frame}
        chunks={timeline.captions}
        speakers={
          episode.captions.speakers as Record<string, keyof typeof SPEAKERS>
        }
      />
      <EndCard0 frame={frame} from={Math.round(toOut(beats.card))} part={6} />
    </AbsoluteFill>
  );
};
