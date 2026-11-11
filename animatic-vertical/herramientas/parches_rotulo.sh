#!/bin/bash
# Re-renders only the stretches of an episode reel where a part's label shows (its first 4.6 s and its last 4.7 s),
# after a change to RotuloReel.tsx, instead of the whole timeline. corta_reel_ig.sh lays them over the full render.
#   herramientas/parches_rotulo.sh <ep> <frame cut 1> <frame cut 2> ...
set -e
cd "$(dirname "$0")/.."
EP=$1; shift
TOTAL=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 out/reel-ep$EP-completo.mp4)
CORTES=(0 "$@" $TOTAL)
for ((k = 0; k < ${#CORTES[@]} - 1; k++)); do
  a=${CORTES[$k]}; b=${CORTES[$((k+1))]}
  npx remotion render src/index.ts ReelEp$EP out/parche-ep$EP-$((k+1))-ini.mp4 --frames=$a-$((a+137)) --codec=h264 --crf=12 --muted > /dev/null
  npx remotion render src/index.ts ReelEp$EP out/parche-ep$EP-$((k+1))-fin.mp4 --frames=$((b-141))-$((b-1)) --codec=h264 --crf=12 --muted > /dev/null
  echo "parte $((k+1)): $a-$((a+137)) y $((b-141))-$((b-1))"
done
