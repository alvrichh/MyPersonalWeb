#!/usr/bin/env bash
# Records the portfolio tour from the live site and renders .cache/video/portfolio-tour.mp4
# (60 s, 1920×1080, with music). See README.md in this folder.
set -euo pipefail
cd "$(dirname "$0")/../.."
export OUT="${OUT:-.cache/video}"
node scripts/video/record.mjs
FINAL="${FINAL:-3.8}" node scripts/video/build.cjs
python3 scripts/video/music.py 60.5 "$OUT/music.wav"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$OUT/list.txt" -i "$OUT/music.wav" -filter_complex \
  "[0:v]fps=30,format=yuv420p,tpad=stop_mode=clone:stop_duration=1,trim=duration=60,fade=t=in:st=0:d=0.4,fade=t=out:st=57.6:d=2.4[v];\
[1:a]adelay=800|800,loudnorm=I=-16:TP=-2:LRA=11,alimiter=limit=0.7:level=false,afade=t=in:d=1.2,afade=t=out:st=57.6:d=2.4,atrim=duration=60[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 192k -movflags +faststart "$OUT/portfolio-tour.mp4"
echo "Wrote $OUT/portfolio-tour.mp4"
