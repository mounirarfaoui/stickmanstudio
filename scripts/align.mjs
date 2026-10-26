// Word-level alignment of a known script against a narration clip using local whisper.cpp.
// whisper.cpp and its model are downloaded once into the git-ignored .cache/whisper folder.
import fs from "node:fs";
import path from "node:path";
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } from "@remotion/install-whisper-cpp";
import { toWav } from "./audio-utils.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const WHISPER_DIR = path.join(ROOT, ".cache", "whisper");
const VERSION = "1.5.5";
const MODEL = "small.en";

let ready = null;
const ensureWhisper = () => {
  ready ??= (async () => {
    await installWhisperCpp({ to: WHISPER_DIR, version: VERSION, printOutput: false });
    await downloadWhisperModel({ folder: WHISPER_DIR, model: MODEL, printOutput: false });
  })();
  return ready;
};

const norm = (w) => w.toLowerCase().replace(/[^a-z']/g, "");

// Returns the start time (seconds) of each script word, or null where whisper's words could not be matched.
export const alignWords = async (wavPath, scriptWords) => {
  await ensureWhisper();
  const input16k = path.join(WHISPER_DIR, "input-16k.wav");
  toWav(wavPath, input16k, { sampleRate: 16000, channels: 1 });
  const output = await transcribe({
    inputPath: input16k,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: VERSION,
    model: MODEL,
    tokenLevelTimestamps: true,
    printOutput: false,
  });
  const { captions } = toCaptions({ whisperCppOutput: output });
  // Token offsets (not the DTW timestamp, which lands mid-word with this model).
  const heard = captions.map((c) => ({ w: norm(c.text), start: c.startMs / 1000 })).filter((c) => c.w);

  const starts = [];
  let j = 0;
  for (const word of scriptWords) {
    const target = norm(word);
    let found = null;
    for (let k = j; k < Math.min(heard.length, j + 4); k++) {
      const h = heard[k].w;
      if (h === target || h.startsWith(target) || target.startsWith(h)) {
        found = k;
        break;
      }
    }
    if (found === null) {
      starts.push(null);
    } else {
      starts.push(heard[found].start);
      j = found + 1;
    }
  }
  fs.rmSync(input16k, { force: true });
  return { starts, heard: heard.map((h) => h.w).join(" ") };
};
