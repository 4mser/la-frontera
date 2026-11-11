#!/bin/bash
# Cuts the vertical Ep. 1 timeline (out/reel-ep1-completo.mp4, ReelEp1) into its three parts, at the frames of
# CORTES in src/VideoReelEp1.tsx, with the sound at −14 LUFS (two-pass loudnorm) for Reels / Shorts / TikTok.
set -e
cd "$(dirname "$0")"
SRC=out/reel-ep1-completo.mp4
SAL=~/Development/BN_Videos/entregables/La-frontera/Reels/Ep01
mkdir -p "$SAL"
FPS=30
# frames: part 1 = the opening (and its 0.3 s of black), part 2 = chapter I to the snowflake, part 3 = to the end
CORTES=(0 5378 9794 $(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$SRC"))
for k in 0 1 2; do
  a=${CORTES[$k]}; b=${CORTES[$((k+1))]}
  t0=$(echo "scale=4; $a/$FPS" | bc); t1=$(echo "scale=4; $b/$FPS" | bc)
  out="$SAL/La-frontera-Ep01-parte$((k+1)).mp4"
  # pass 1: measure
  m=$(ffmpeg -hide_banner -ss "$t0" -to "$t1" -i "$SRC" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  mi=$(echo "$m" | python3 -c "import json,sys;d=json.load(sys.stdin);print('measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s' % (d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset']))")
  # pass 2: cut frame-accurately, short fades so the cut never clicks
  d=$(echo "scale=4; $t1-$t0" | bc)
  ffmpeg -loglevel error -y -ss "$t0" -to "$t1" -i "$SRC" \
    -vf "fps=30,format=yuv420p" \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11:$mi:linear=true,afade=in:d=0.15,afade=out:st=$(echo "scale=4; $d-0.25" | bc):d=0.25,aresample=48000" \
    -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$out"
  echo "parte $((k+1)): $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out") s → $out"
done
