// Shared helpers for the audio scripts: 16-bit PCM WAV read/write and ffmpeg conversion.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

export const readWav = (path) => {
  const buf = fs.readFileSync(path);
  let off = 12;
  let fmt = null;
  while (off < buf.length - 8) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") {
      fmt = { channels: buf.readUInt16LE(off + 10), sampleRate: buf.readUInt32LE(off + 12), bits: buf.readUInt16LE(off + 22) };
    } else if (id === "data") {
      if (!fmt || fmt.bits !== 16) throw new Error(`${path}: expected 16-bit PCM`);
      const frames = Math.floor(size / (2 * fmt.channels));
      const channels = Array.from({ length: fmt.channels }, () => new Float32Array(frames));
      for (let i = 0; i < frames; i++) {
        for (let c = 0; c < fmt.channels; c++) {
          channels[c][i] = buf.readInt16LE(off + 8 + (i * fmt.channels + c) * 2) / 32768;
        }
      }
      return { sampleRate: fmt.sampleRate, channels };
    }
    off += 8 + size + (size % 2);
  }
  throw new Error(`${path}: no data chunk`);
};

export const writeWav = (path, sampleRate, channels) => {
  const n = channels[0].length;
  const ch = channels.length;
  const data = Buffer.alloc(n * ch * 2);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      data.writeInt16LE(Math.round(v * 32767), (i * ch + c) * 2);
    }
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(ch, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * ch * 2, 28);
  header.writeUInt16LE(ch * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path, Buffer.concat([header, data]));
};

// Convert any audio file to 16-bit PCM WAV at the given rate/channels using Remotion's bundled ffmpeg.
export const toWav = (input, output, { sampleRate = 48000, channels = 1 } = {}) => {
  execFileSync("npx", ["remotion", "ffmpeg", "-v", "error", "-y", "-i", input, "-ac", String(channels), "-ar", String(sampleRate), "-c:a", "pcm_s16le", output], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
};
