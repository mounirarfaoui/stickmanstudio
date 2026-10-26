# Stickman Studio

Procedural stickman shorts (1080×1920, 30 fps) built with [Remotion](https://www.remotion.dev).

| Composition | What |
| --- | --- |
| `BrainLying` | "Your Brain Is Lying to You" — a ~37 s standalone short (`src/BrainLying`) |
| `LastLight-Part01` | **LAST LIGHT**, a 10-part zombie apocalypse series — Part 1 "Day One" (`src/LastLight`, outline in [SERIES.md](src/LastLight/SERIES.md)) |
| `LastLight-Part02` | LAST LIGHT Part 2 "The Window" — bathroom escape, fire escape, the alley (~45 s) |
| `LastLight-Part03` | LAST LIGHT Part 3 "Mia" — the girl with the bat, a fragile deal, the dog that wakes the street (~45 s) |

Each episode is a folder with an `episode.json` (narration lines, caption chunks, timing, music prompt, sound prompts) and
a `beats.json` (story frames). The audio scripts take the folder as an argument, e.g. for Last Light Part 1:

```console
npm run voice    -- src/LastLight/Part01   # narration (Gemini TTS) + whisper word timings, pauses tightened
npm run timeline -- src/LastLight/Part01   # place lines on story beats, time-warp, captions
npm run music    -- src/LastLight/Part01   # Suno instrumental
npm run sounds   -- src/LastLight/Part01   # Suno sound effects (growls, horde, ambience)
npm run audio    -- src/LastLight/Part01   # mix voice + music + scripts/sfx/<episode>.mjs
npx remotion render LastLight-Part01 output/last-light-part-01.mp4 --crf=18
```

Without a folder argument the scripts work on `src/BrainLying`.

---

## "Your Brain Is Lying to You"

A ~37-second vertical (1080×1920, 30 fps) stickman short built with [Remotion](https://www.remotion.dev).
A nervous stickman about to speak watches his shadow swell into a monster; he freezes, breathes, practises,
speaks — and the shadow shrinks back to its real size. *Courage starts before you feel ready.*

All visuals are procedural SVG (no image assets) with deterministic, frame-based animation.
Narration and music are generated with [kie.ai](https://kie.ai); every sound effect is synthesised in code.

## Quick start

```console
npm i
npm run dev                # preview in Remotion Studio
npx remotion render BrainLying output/your-brain-is-lying-to-you.mp4 --crf=18
```

The generated narration, music and final mix are committed under `public/`, so rendering needs no API key.

## How it fits together

| Step | Command | Output |
| --- | --- | --- |
| Narration — Gemini 3.8 Flash TTS (voice *Charon*), one styled clip per line, word timings from local whisper.cpp | `npm run voice` | `public/voice/*.wav`, `src/BrainLying/voice.json` |
| Timeline — places each line on its story beat, time-warps the animation onto the voice, builds caption chunks | `npm run timeline` | `src/BrainLying/timeline.json` |
| Music — Suno V6 instrumental, as long as the video | `npm run music` | `public/music.wav` |
| Mix — voice + music (ducked under speech) + procedural SFX | `npm run audio` | `public/soundtrack.wav` |

- `src/BrainLying/beats.json` — the story timeline (monster growth, breath, practice, speech) in story frames.
- `src/BrainLying/rig.tsx` — stickman rig (forward kinematics, poses, face) and the shadow monster.
- `src/BrainLying/BrainLying.tsx` — scene, camera, lighting; maps output frames to story frames via `timeline.json`.
- `src/BrainLying/Captions.tsx` — word-synced captions, title and end card.

To change a line, edit `LINES` in `scripts/make-voiceover.mjs`, then run `npm run voice && npm run timeline && npm run audio`
(and `npm run music` if the length changed a lot).

`npm run voice` and `npm run music` need a kie.ai key in a `.env` file (git-ignored):

```
KIE_API_KEY=your-key
```
