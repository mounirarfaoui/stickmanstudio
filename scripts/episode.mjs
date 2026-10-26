// Resolves the episode the audio scripts work on. Every episode is a folder under src/ with an
// episode.json (lines, captions, timing, music prompt, sfx module). Pass the folder as the first
// argument; it defaults to the original short:
//   npm run voice -- src/LastLight/Part01
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

export const loadEpisode = (argv = process.argv.slice(2)) => {
  const dirArg = argv.find((a) => !a.startsWith("--")) ?? "src/BrainLying";
  const srcDir = path.resolve(ROOT, dirArg);
  const cfg = JSON.parse(fs.readFileSync(path.join(srcDir, "episode.json"), "utf8"));
  const publicDir = path.join(ROOT, "public", cfg.publicDir ?? "");
  const cacheDir = path.join(ROOT, ".cache", cfg.id);
  const readJson = (name) => JSON.parse(fs.readFileSync(path.join(srcDir, name), "utf8"));
  const writeJson = (name, data) => fs.writeFileSync(path.join(srcDir, name), JSON.stringify(data, null, 2) + "\n");
  return {
    cfg,
    root: ROOT,
    srcDir,
    publicDir,
    cacheDir,
    // path of a public asset as the composition references it with staticFile()
    publicRel: (...p) => path.posix.join(cfg.publicDir ?? "", ...p),
    readJson,
    writeJson,
  };
};
