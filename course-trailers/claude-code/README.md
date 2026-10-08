# Claude Code Tutorial — narrated trailer

Upload **`claude-code-trailer.mp4`** in the course's **Trailer** tab, verify processing, preview, then publish.

A 28-second, 1920 × 1080 tutorial trailer with the official Claude Code wordmark and ivory/slate/clay palette. A natural English synthetic narrator guides a continuous Start → Explore → Review workflow, with an original instrumental bed ducked under speech.

## Files

- `claude-code-trailer.mp4` — upload-ready H.264 / yuv420p video, 30 fps, stereo AAC, fast-start MP4.
- `poster.png` — matching final course-title frame.
- `storyboard.png` and `scene-1.png` through `scene-6.png` — six representative scenes.
- `technical-report.json` — export metadata and verification results.
- `source/trailer.html` — editable Canvas artwork, transitions, and synchronized audio preview.
- `source/render.cjs` — local renderer; encodes to a temporary file before replacing the final MP4.
- `source/voiceover/` — saved narration takes, text, timing, and captions.
- `source/generate-voice.py` — optional voice regeneration using `edge-tts`.
- `source/mix-audio.py` — repeatable narration assembly, speech processing, music ducking, and loudness normalization.
- `source/audio/` — complete narration and final mixed WAV files.
- `source/assets/BRAND-SOURCES.md` — official brand sources, palette, and asset attribution.
- `previous-version/v1-navy-instrumental/` — preserved original version and source.

## Sequence

| Time | Content |
| --- | --- |
| 0–4.6 s | Official logo and a large terminal question: “How does this code work?” |
| 4.6–9 s | Enter a project and launch Claude Code. |
| 9–14 s | Ask about the homepage, follow the explanation, identify its component. |
| 14–18.35 s | Request a button-label change and review the readable before/after diff. |
| 18.35–21 s | Ask. Understand. Review. |
| 21–28 s | Official Claude Code logo, Tutorial title, and follow-along Baela close. |

Narrator: Microsoft Edge `en-US-AndrewMultilingualNeural`, rate −15%, standard pitch. Baela is spoken as “Bay-la”. No person's voice was cloned.

## Re-render

From the project root:

```sh
node course-trailers/claude-code/source/render.cjs
```

Use `--stills` for only the poster/storyboard. Requirements: FFmpeg, Python 3, Node.js, and the project's existing Playwright Chromium and Sharp packages. Saved voice takes allow rendering without network access or the temporary TTS environment. The renderer serves only the local source folder on a temporary loopback port. No application dependencies were added.

For a browser preview, serve `source/` locally (for example, `python3 -m http.server --directory course-trailers/claude-code/source 8080`) and open `/trailer.html`.

Optional voice regeneration requires `edge-tts` in a separate environment; run `generate-voice.py`, then rerender. Narration scripts and mixed WAV files are preserved for editing.

## Content and attribution

Created for the existing **Claude Code Tutorial** course. The terminal, project, and diff are illustrative walkthroughs, not a recording of a real session. They introduce basic usage without claiming an advanced syllabus or guaranteed results.

Official logo assets and palette come from [Anthropic's press kit](https://anthropic.com/press-kit), with product behavior checked against [Claude Code documentation](https://code.claude.com/docs/en/overview). The course is independently branded by Baela and does not claim Anthropic sponsorship.

The visual redesign and narration production were prepared by GPT-6 Astra at extra-high reasoning. The primary agent completed rendering and export QA after Astra reached its usage limit. Visuals are code-rendered; the soundtrack is original mathematical synthesis. Font and logo attribution is preserved under `source/assets/`.
