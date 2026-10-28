// usage: node sheet.mjs <timeline.json> <draft.mp4> <out.jpg> story1 story2 ...
import fs from "node:fs";
import { execSync } from "node:child_process";
const [tl, mp4, out, ...stories] = process.argv.slice(2);
const a = JSON.parse(fs.readFileSync(tl, "utf8")).anchors;
const toOut = (s) => { for (let i = 1; i < a.length; i++) if (s <= a[i][0]) return a[i-1][1] + (s - a[i-1][0]) * (a[i][1]-a[i-1][1])/(a[i][0]-a[i-1][0]); return a.at(-1)[1] + s - a.at(-1)[0]; };
const dir = out + ".d"; fs.mkdirSync(dir, { recursive: true });
stories.forEach((s, i) => {
  const t = (toOut(+s) / 30).toFixed(3);
  execSync(`npx remotion ffmpeg -y -loglevel error -ss ${t} -i "${mp4}" -frames:v 1 -vf "scale=270:480" "${dir}/${String(i).padStart(2,"0")}.png"`);
});
execSync(`python -c "import sys,glob;from PIL import Image;f=sorted(glob.glob(sys.argv[1]+'/*.png'));W=8;im=[Image.open(x) for x in f];w,h=im[0].size;s=Image.new('RGB',(W*w,((len(im)+W-1)//W)*h));[s.paste(m,((i%W)*w,(i//W)*h)) for i,m in enumerate(im)];s.save(sys.argv[2])" "${dir}" "${out}"`);
console.log("sheet", out);
