#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
FRAMES="$ROOT/source-assets/live-capture/frames-2fps"
MAP="$ROOT/source-assets/live-capture/beast-atlas-map.tsv"
WORK="${TMPDIR:-/tmp}/ydxz-beast-atlas"
OUTPUT="$ROOT/public/assets/beast-atlas-original-v1.png"

mkdir -p "$WORK"
index=0
while IFS="$(printf '\t')" read -r art_index definition_id name tier faction frame; do
  case "$art_index" in ""|'#'*) continue ;; esac
  if [ "$art_index" -ne "$index" ]; then
    printf 'Unexpected atlas index %s after %s\n' "$art_index" "$index" >&2
    exit 1
  fi
  input="$FRAMES/frame-$frame.jpg"
  output=$(printf "%s/tile-%02d.png" "$WORK" "$index")
  if [ ! -f "$input" ]; then
    printf 'Missing source frame for %s (%s): %s\n' "$name" "$definition_id" "$input" >&2
    exit 1
  fi
  ffmpeg -loglevel error -y -i "$input" \
    -vf "crop=240:240:35:270,scale=256:256:flags=lanczos" \
    -frames:v 1 "$output"
  index=$((index + 1))
done < "$MAP"

if [ "$index" -ne 48 ]; then
  printf 'Expected 48 atlas entries, got %s\n' "$index" >&2
  exit 1
fi

ffmpeg -loglevel error -y -framerate 1 -start_number 0 -i "$WORK/tile-%02d.png" \
  -vf "tile=8x6:padding=0:margin=0" -frames:v 1 "$OUTPUT"

printf 'Wrote %s (%s tiles)\n' "$OUTPUT" "$index"
