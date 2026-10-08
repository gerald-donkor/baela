# Claude Code Tutorial — course trailer

Upload **`claude-code-trailer.mp4`** to the course trailer field.

A 24-second, 16:9 trailer with Baela typography and colors, original motion graphics, and a soft synthesized instrumental soundtrack. All essential copy is on screen; there is no voiceover. The final title card stays visible for approximately five seconds.

## Verified export

24.000 seconds · 2,007,571 bytes (2.01 MB) · 720 frames. Full audio/video decode completed without errors. The MP4 metadata precedes the media payload for fast-start playback. Audio measures −18.0 LUFS integrated and −7.2 dBFS true peak, with fade-in/fade-out and no clipping.

## Files

- `claude-code-trailer.mp4` — final 1920 × 1080, 30 fps video; H.264 / yuv420p with stereo AAC audio and fast-start MP4 metadata.
- `poster.png` — matching 1920 × 1080 course poster.
- `storyboard.png` — four-scene overview.
- `scene-1.png` through `scene-4.png` — full-resolution reference frames.
- `source/trailer.html` — editable Canvas artwork and timing; open in a browser and select **Play preview** for a silent animation preview.
- `source/render.cjs` — reproducible renderer and original soundtrack synthesizer.
- `source/soundtrack.wav` — original stereo instrumental audio.
- `source/assets/` — bundled Geist fonts and their license.
- `technical-report.json` — FFprobe inspection of the exported video.

## Storyboard

| Time | Content |
| --- | --- |
| 0–6 s | Learn Claude Code. Step by step. Start the session. |
| 6–12 s | Explore your project. Ask an illustrative project question. |
| 12–18 s | Make a change. Review it. Read an illustrative code diff. |
| 18–24 s | Claude Code Tutorial. See the workflow. Follow along. Start learning on Baela. |

## Re-render

From the project root:

```sh
node course-trailers/claude-code/source/render.cjs
```

Requires Node.js, FFmpeg, the project's existing `@playwright/test` and `sharp` packages, and an installed Playwright Chromium browser. No package dependencies were added. A restricted environment may need to authorize the local headless browser. For artwork only, append `--stills`. The renderer replaces only the generated files in this trailer folder.

## Content and rights notes

Created for the existing **Claude Code Tutorial** course, whose supplied summary is “Learn everything about Claude code from beginner to pro”. This trailer introduces the beginner-friendly Start / Explore / Review workflow.

The terminal and code screens are illustrative motion graphics, not recordings of a real Claude Code session. They do not represent a confirmed course syllabus or measured results. Basic descriptions of project exploration and code editing were checked against the [official Claude Code overview](https://code.claude.com/docs/en/overview) on 2026-10-08.

Visuals and music were created for this trailer. The soundtrack uses mathematical synthesis, with no sampled or licensed commercial recordings. Geist is included under its bundled SIL Open Font License. Claude Code is a product of Anthropic; the trailer presents the independently branded Baela course and does not claim Anthropic affiliation.
