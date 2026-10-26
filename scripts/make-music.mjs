// Generates the instrumental music bed with Suno (V6) on kie.ai and saves it as public/music.wav.
// Suno returns two takes; both are kept in .cache/music and the first is used unless MUSIC_TAKE=1.
// Run: npm run music (after npm run timeline, so the length matches the video)
import fs from "node:fs";
import { createTask, download, waitForTask } from "./kie.mjs";
import { toWav } from "./audio-utils.mjs";

const timeline = JSON.parse(fs.readFileSync(new URL("../src/BrainLying/timeline.json", import.meta.url), "utf8"));
const seconds = Math.ceil(timeline.duration / timeline.fps) + 4;
const cache = new URL("../.cache/music/", import.meta.url);
fs.mkdirSync(cache, { recursive: true });
const local = (u) => u.pathname.replace(/^\/([A-Za-z]:)/, "$1");

const taskId = await createTask("ai-music-api/generate", {
  model: "V6",
  custom_mode: true,
  instrumental: true,
  title: "Your Brain Is Lying to You",
  duration: seconds,
  style:
    "Cinematic emotional underscore for a motivational short film. Opens dark, intimate and suspenseful: low pulsing synth, deep drone, soft heartbeat-like kick, sparse piano notes. Tension builds through the middle. In the final third it resolves into a warm, hopeful, uplifting piano melody with soft strings swelling. Instrumental only, no vocals, gentle dynamics, mixed to sit under a voiceover.",
  negative_tags: "vocals, singing, choir, rap, EDM drop, heavy drums, distorted guitar",
  style_weight: 0.75,
});
const data = await waitForTask(taskId, { intervalMs: 10000, timeoutMs: 20 * 60 * 1000 });
fs.writeFileSync(new URL("task.json", cache), JSON.stringify(data, null, 2));

const result = JSON.parse(data.resultJson ?? "{}");
const urls = result.resultUrls ?? (data.response?.data ?? []).map((t) => t.audio_url);
if (!urls.length) throw new Error(`no audio in result: ${JSON.stringify(data).slice(0, 500)}`);
for (const [i, url] of urls.entries()) {
  const ext = url.split("?")[0].slice(url.split("?")[0].lastIndexOf("."));
  await download(url, new URL(`take${i}${ext}`, cache));
}
const take = Number(process.env.MUSIC_TAKE ?? 0);
const src = fs.readdirSync(local(cache)).find((f) => f.startsWith(`take${take}.`));
toWav(local(new URL(src, cache)), local(new URL("../public/music.wav", import.meta.url)), { channels: 2 });
console.log(`public/music.wav <- take ${take} of ${urls.length}`);
