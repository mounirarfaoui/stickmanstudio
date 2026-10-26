// Generates an episode's instrumental music bed with Suno (V6) on kie.ai: public/<publicDir>/music.wav.
// Suno returns two takes; both are kept in .cache/<episode>/music and the first is used unless MUSIC_TAKE=1.
// Run: npm run music [-- <episode dir>] (after npm run timeline, so the length matches the video)
import fs from "node:fs";
import path from "node:path";
import { createTask, download, waitForTask } from "./kie.mjs";
import { toWav } from "./audio-utils.mjs";
import { loadEpisode } from "./episode.mjs";

const ep = loadEpisode();
const timeline = ep.readJson("timeline.json");
const seconds = Math.ceil(timeline.duration / timeline.fps) + 4;
const cache = path.join(ep.cacheDir, "music");
const take = Number(process.env.MUSIC_TAKE ?? 0);
const out = path.join(ep.publicDir, "music.wav");

// Re-pick a take from the cache without paying for a new generation: MUSIC_TAKE=1 npm run music -- <dir> --reuse
if (!process.argv.includes("--reuse")) {
  fs.mkdirSync(cache, { recursive: true });
  const { title, style, negative_tags, style_weight } = ep.cfg.music;
  const taskId = await createTask("ai-music-api/generate", {
    model: "V6",
    custom_mode: true,
    instrumental: true,
    title,
    duration: seconds,
    style,
    negative_tags,
    style_weight,
  });
  const data = await waitForTask(taskId, { intervalMs: 10000, timeoutMs: 20 * 60 * 1000 });
  fs.writeFileSync(path.join(cache, "task.json"), JSON.stringify(data, null, 2));

  const result = JSON.parse(data.resultJson ?? "{}");
  const urls = result.resultUrls ?? (data.response?.data ?? []).map((t) => t.audio_url);
  if (!urls.length) throw new Error(`no audio in result: ${JSON.stringify(data).slice(0, 500)}`);
  for (const [i, url] of urls.entries()) {
    const clean = url.split("?")[0];
    await download(url, path.join(cache, `take${i}${clean.slice(clean.lastIndexOf("."))}`));
  }
}
const src = fs.readdirSync(cache).find((f) => f.startsWith(`take${take}.`));
if (!src) throw new Error(`no take ${take} in ${cache}`);
toWav(path.join(cache, src), out, { channels: 2 });
console.log(`${path.relative(ep.root, out)} <- take ${take}`);
