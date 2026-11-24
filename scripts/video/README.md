# Portfolio tour video

Records a 60-second, 1920×1080 tour of https://alvrich.vercel.app with music, for LinkedIn or Instagram.

```bash
scripts/video/render.sh      # writes .cache/video/portfolio-tour.mp4
```

Needs Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`, or set
`CHROMIUM_PATH`), Python 3 with NumPy, and ffmpeg. Everything it writes goes to `.cache/video/`,
which is git-ignored. `SITE` records another deployment; `OUT` changes the output folder.

## What it shows

1. The site in light mode and Spanish; the cursor switches to dark, the Disco accent and English.
2. The cursor hovers the three hero buttons.
3. Zoom on the header avatar: its first two bubble lines ("Hi!", "How you doing?").
4. Scroll to the bottom, slower from the third project on, with a pause on the GitHub contributions.
5. Experience → "My calendar", paging back from this year three years, then back home.
6. Work → "News", scrolling through the reading list, then back home.
7. A click on the avatar ("Hey! That tickles.") glides to the top; the video ends zooming into the portrait as it fades out.

## How it works

- `record.mjs` drives Chromium with a drawn cursor. Short moments are captured with the DevTools
  screencast; long scrolls are captured one screenshot per video frame, with the page's animations
  (the Disco colour cycle) advanced exactly 1/30 s per frame, so colours keep their real pace.
  Page loads are marked `cut` and dropped.
- `build.cjs` gives each part its on-screen length (`TARGET`) and writes the ffmpeg concat list.
  `FINAL` stretches the last zoom so the whole lands on 60 s; the render trims to exactly 60 s.
- `music.py` synthesises an original 124 BPM track (A minor, rolling 16th bass, sidechained pads,
  a riser into a fuller section at about 16 s), so there are no rights to clear.

The avatar's lines come from `src/i18n/bubble.json`: before the last click the recorder pokes the
avatar off camera until it shows "Oh, and try clicking my photo.", so the click lands on
"Hey! That tickles.". If those lines change, update that check in `record.mjs`.
