import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";

export const FONT = '"Arial Black", "Arial Bold", Impact, sans-serif';
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type CaptionChunk = { line: string; from: number; to: number; words: { text: string; emph: boolean; frame: number }[] };

export const SPEAKERS = {
  kai: { name: "KAI", color: "#FFD43B" },
  mia: { name: "MIA", color: "#7FE3FF" },
  wade: { name: "WADE", color: "#FF9A3D" },
  june: { name: "JUNE", color: "#FF7FB0" },
  operator: { name: "THE OPERATOR", color: "#FF5A4F" },
} as const;

// Word-synced captions. Lines listed in `broadcast` (TV, radio) get a red news-ticker style;
// lines in `speakers` are spoken dialogue and get a name tag in that character's colour.
export const Captions: React.FC<{ frame: number; chunks: CaptionChunk[]; broadcast?: string[]; speakers?: Record<string, keyof typeof SPEAKERS>; top?: number }> = ({ frame, chunks, broadcast = [], speakers = {}, top = 470 }) => {
  const chunk = chunks.find((c) => frame >= c.from && frame < c.to);
  if (!chunk) return null;
  const isBroadcast = broadcast.includes(chunk.line);
  const speaker = speakers[chunk.line] ? SPEAKERS[speakers[chunk.line]] : null;
  const times = chunk.words.map((w) => w.frame - 2);
  const active = times.filter((t) => t <= frame).length - 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {speaker ? (
        <div
          style={{
            position: "absolute",
            top: top - 6,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [chunk.from, chunk.from + 4, chunk.to - 5, chunk.to], [0, 1, 1, 0], clamp),
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 40, color: "#0a0a0a", backgroundColor: speaker.color, padding: "2px 18px", borderRadius: 10, letterSpacing: 3 }}>{speaker.name}</span>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          top: speaker ? top + 30 : top,
          left: 80,
          right: 80,
          height: 260,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignContent: "center",
          gap: isBroadcast ? "10px 14px" : "0px 26px",
          opacity: interpolate(frame, [chunk.to - 5, chunk.to], [1, 0], clamp),
          translate: interpolate(frame, [chunk.to - 5, chunk.to], ["0px 0px", "0px -26px"], clamp),
        }}
      >
        {chunk.words.map((w, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: FONT,
              fontSize: isBroadcast ? 70 : w.emph ? 112 : 90,
              lineHeight: 1.12,
              ...(isBroadcast
                ? { color: "#fff", backgroundColor: i === active ? "#FF2D2D" : "#B5121B", padding: "4px 18px", borderRadius: 8, textTransform: "uppercase" as const }
                : {
                    color: w.emph ? "#B6FF5C" : i === active ? (speaker?.color ?? "#FFD43B") : "#FFFFFF",
                    WebkitTextStroke: "16px #0a0a0a",
                    paintOrder: "stroke fill",
                    textShadow: "0 10px 0 rgba(0,0,0,0.35)",
                  }),
              opacity: interpolate(frame, [times[i], times[i] + 3], [0, 1], clamp),
              scale: interpolate(frame, [times[i], times[i] + 8], [0.3, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
            }}
          >
            {w.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Logo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontFamily: FONT, fontSize: size, color: "#fff", letterSpacing: size * 0.08, textShadow: "0 0 28px rgba(255,170,90,0.85), 0 0 6px rgba(255,200,140,0.9)" }}>
    LAST LIGHT
  </div>
);

// Opening badge: series logo + part number
export const SeriesBadge: React.FC<{ frame: number; part: number; title: string; until: number }> = ({ frame, part, title, until }) => (
  <div
    style={{
      position: "absolute",
      top: 120,
      left: 0,
      right: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      opacity: interpolate(frame, [0, 6, until - 12, until], [0, 1, 1, 0], clamp),
      translate: interpolate(frame, [0, 12], ["0px -30px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    }}
  >
    <Logo size={84} />
    <div style={{ fontFamily: FONT, fontSize: 44, color: "#0a0a0a", backgroundColor: "#FFD43B", padding: "6px 26px", borderRadius: 12 }}>
      PART {part}/10 · {title}
    </div>
  </div>
);

// Closing card: cut to black, logo, "Part N+1" tease
// `embers` adds drifting sparks and a slow push-in so the card isn't a still frame.
// `final` closes the series: "THE END" instead of the next-part tease.
export const PartCard: React.FC<{ frame: number; from: number; part: number; embers?: boolean; final?: boolean }> = ({ frame, from, part, embers = false, final = false }) => {
  const t = frame - from;
  if (t < 0) return null;
  const pop = (d: number) => ({
    opacity: interpolate(t, [d, d + 6], [0, 1], clamp),
    translate: interpolate(t, [d, d + 12], ["0px 30px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${interpolate(t, [0, 5], [0, 1], clamp)})`, justifyContent: "center", alignItems: "center", gap: 34, scale: embers ? 1 + t * 0.0015 : 1 }}>
      {embers
        ? Array.from({ length: 70 }, (_, i) => {
            const life = (t * (2.4 + (i % 5) * 0.5) + i * 37) % 260;
            return <div key={i} style={{ position: "absolute", left: (i * 97) % 1080 + Math.sin((t + i * 13) * 0.05) * 30, top: 1900 - life * 7, width: 8 + (i % 3) * 5, height: 8 + (i % 3) * 5, borderRadius: "50%", backgroundColor: i % 4 ? "#ff9a4d" : "#ffd27a", opacity: interpolate(t, [0, 10], [0, 1], clamp) * (1 - life / 260) * 0.9, boxShadow: "0 0 12px #ff7a2d" }} />;
          })
        : null}
      {/* with embers on, the logo flickers like a failing light */}
      <div style={{ ...pop(4), opacity: (pop(4).opacity as number) * (embers && Math.sin(t * 0.9) * Math.sin(t * 0.37) > 0.45 ? 0.25 : 1) }}>
        <Logo size={120} />
      </div>
      <div style={{ ...pop(10), fontFamily: FONT, fontSize: 52, color: "#9aa3b5" }}>PART {part} / 10</div>
      <div style={{ ...pop(18), fontFamily: FONT, fontSize: 76, color: "#0a0a0a", backgroundColor: "#FFD43B", padding: "10px 34px", borderRadius: 16 }}>{final ? "THE END" : `PART ${part + 1} SOON`}</div>
      <div style={{ ...pop(26), fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 46, color: "#e8e8e8" }}>{final ? "Follow for the next story" : "Follow so you don't miss it"}</div>
    </AbsoluteFill>
  );
};
