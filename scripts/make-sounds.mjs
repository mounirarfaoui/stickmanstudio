// Generates an episode's sampled sound effects with Suno "sounds" on kie.ai.
// episode.json: "sounds": { "<id>": { "prompt": "...", "loop": false } }
// Writes public/<publicDir>/sfx/<id>.wav (take 0, or SOUND_TAKES='{"id":1}' to pick another).
// Run: npm run sounds [-- <episode dir>] [--reuse]   (only missing sounds are generated)
import fs from "node:fs";
import path from "node:path";
import { createTask, download, waitForTask } from "./kie.mjs";
import { toWav } from "./audio-utils.mjs";
import { loadEpisode } from "./episode.mjs";

const ep = loadEpisode();
const sounds = ep.cfg.sounds ?? {};
const outDir = path.join(ep.publicDir, "sfx");
const cache = path.join(ep.cacheDir, "sounds");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(cache, { recursive: true });
const takes = JSON.parse(process.env.SOUND_TAKES ?? "{}");
const reuse = process.argv.includes("--reuse");

await Promise.all(
  Object.entries(sounds).map(async ([id, { prompt, loop = false }]) => {
    const cached = () => fs.readdirSync(cache).filter((f) => f.startsWith(`${id}.take`));
    if (!reuse && !cached().length) {
      for (let attempt = 1; ; attempt++) {
        try {
          const taskId = await createTask("ai-music-api/sounds", { prompt, model: "V6", sound_loop: loop });
          const data = await waitForTask(taskId, { intervalMs: 8000, timeoutMs: 15 * 60 * 1000 });
          const result = JSON.parse(data.resultJson ?? "{}");
          const urls = result.resultUrls ?? (data.response?.data ?? []).map((t) => t.audio_url);
          if (!urls.length) throw new Error(`no audio: ${JSON.stringify(data).slice(0, 300)}`);
          for (const [i, url] of urls.entries()) {
            const clean = url.split("?")[0];
            await download(url, path.join(cache, `${id}.take${i}${clean.slice(clean.lastIndexOf("."))}`));
          }
          break;
        } catch (e) {
          if (attempt >= 4) throw e;
          console.warn(`${id}: ${e.message} — retrying`);
        }
      }
    }
    const take = takes[id] ?? 0;
    const src = cached().find((f) => f.startsWith(`${id}.take${take}.`));
    if (!src) throw new Error(`${id}: no take ${take}`);
    toWav(path.join(cache, src), path.join(outDir, `${id}.wav`), { channels: 2 });
    console.log(`${id} <- take ${take}`);
  }),
);
