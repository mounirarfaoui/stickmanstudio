import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

import timeline from "./timeline.json";

// Caption chunks with the frame each word is spoken, from scripts/build-timeline.mjs.
type Chunk = { from: number; to: number; words: { text: string; emph: boolean; frame: number }[] };

export const CAPTIONS: Chunk[] = timeline.captions;

export const FONT = '"Arial Black", "Arial Bold", Impact, sans-serif';

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const ChunkView: React.FC<{ chunk: Chunk; frame: number }> = ({ chunk, frame }) => {
  const { words } = chunk;
  // Each word pops in a hair before it is heard
  const times = words.map((w) => w.frame - 2);
  const active = times.filter((t) => t <= frame).length - 1;
  return (
    <div
      style={{
        position: "absolute",
        top: 520,
        left: 80,
        right: 80,
        height: 240,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        gap: "0px 26px",
        opacity: interpolate(frame, [chunk.to - 6, chunk.to], [1, 0], clamp),
        translate: interpolate(frame, [chunk.to - 6, chunk.to], ["0px 0px", "0px -30px"], clamp),
      }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            fontFamily: FONT,
            fontSize: w.emph ? 112 : 90,
            lineHeight: 1.12,
            color: w.emph ? "#FF4B3E" : i === active ? "#FFD43B" : "#FFFFFF",
            WebkitTextStroke: "16px #111",
            paintOrder: "stroke fill",
            textShadow: "0 10px 0 rgba(0,0,0,0.28)",
            opacity: interpolate(frame, [times[i], times[i] + 3], [0, 1], clamp),
            scale: interpolate(frame, [times[i], times[i] + 8], [0.3, 1], {
              ...clamp,
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            }),
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const chunk = CAPTIONS.find((c) => frame >= c.from && frame < c.to);
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{chunk ? <ChunkView chunk={chunk} frame={frame} /> : null}</AbsoluteFill>;
};

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        top: 130,
        left: 80,
        right: 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        opacity: interpolate(frame, [0, 6, 84, 98], [0, 1, 1, 0], clamp),
        translate: interpolate(frame, [0, 10], ["0px -40px", "0px 0px"], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {["YOUR BRAIN IS", "LYING TO YOU"].map((line) => (
        <div
          key={line}
          style={{
            fontFamily: FONT,
            fontSize: 70,
            color: "#fff",
            backgroundColor: "#111",
            padding: "8px 30px",
            borderRadius: 18,
            letterSpacing: 2,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { words } = timeline.endCard;
  const sub = words[words.length - 1].frame + 24;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 80,
          right: 80,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "4px 28px",
        }}
      >
        {words.map(({ text: w, frame: spoken }, i) => {
          const t = spoken - 3;
          const marked = i >= 2;
          return (
            <span
              key={w}
              style={{
                display: "inline-block",
                fontFamily: FONT,
                fontSize: 100,
                lineHeight: 1.18,
                color: "#111",
                backgroundColor: marked ? "#FFD43B" : "transparent",
                padding: marked ? "0 14px" : 0,
                borderRadius: 12,
                opacity: interpolate(frame, [t, t + 4], [0, 1], clamp),
                translate: interpolate(frame, [t, t + 10], ["0px 40px", "0px 0px"], {
                  ...clamp,
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 860,
          left: 100,
          right: 100,
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.3,
          color: "#3a3a40",
          opacity: interpolate(frame, [sub, sub + 12], [0, 1], clamp),
        }}
      >
        Fear may come along.
        <br />
        Take the step anyway.
      </div>
    </AbsoluteFill>
  );
};
