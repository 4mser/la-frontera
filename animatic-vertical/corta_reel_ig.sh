#!/bin/bash
# An episode for Instagram / TikTok / Shorts, with burned-in subtitles:
#   ./corta_reel_ig.sh <ep> <frame cut 1> <frame cut 2> ...
# cuts the vertical timeline (out/reel-ep<N>-completo.mp4, composition ReelEp<N>) at the frames of its CORTES, lays
# the subtitles (out/subs-ep<N>.mov, alpha, composition SubtitulosEp<N>) over the picture, and brings the sound to
# −14 LUFS (two-pass loudnorm). Only the light version for upload is made (≈ 18 Mb/s).
# If herramientas/parches_rotulo.sh has re-rendered the stretches with a part's label (out/parche-ep<N>-<k>-ini/fin.mp4),
# they replace those stretches of the full render.
#   Ep. 1: ./corta_reel_ig.sh 1 5378 9794      Ep. 2: ./corta_reel_ig.sh 2 5238 10629
set -e
cd "$(dirname "$0")"
EP=$1; shift
N=$(printf "%02d" "$EP")
SRC=out/reel-ep$EP-completo.mp4
SUB=out/subs-ep$EP.mov
SAL=~/Development/BN_Videos/entregables/La-frontera/Reels/Ep$N/ig
mkdir -p "$SAL"
FPS=30
CORTES=(0 "$@" $(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$SRC"))
for ((k = 0; k < ${#CORTES[@]} - 1; k++)); do
  a=${CORTES[$k]}; b=${CORTES[$((k+1))]}
  t0=$(echo "scale=4; $a/$FPS" | bc); t1=$(echo "scale=4; $b/$FPS" | bc); d=$(echo "scale=4; $t1-$t0" | bc)
  out="$SAL/La-frontera-Ep$N-parte$((k+1))-ig.mp4"
  m=$(ffmpeg -hide_banner -ss "$t0" -to "$t1" -i "$SRC" -vn -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  mi=$(echo "$m" | python3 -c "import json,sys;d=json.load(sys.stdin);print('measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s' % (d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset']))")
  P0=out/parche-ep$EP-$((k+1))-ini.mp4; P1=out/parche-ep$EP-$((k+1))-fin.mp4
  if [ -f "$P0" ] && [ -f "$P1" ]; then
    of=$(echo "scale=4; ($b-141-$a)/$FPS" | bc)
    PAR=(-i "$P0" -i "$P1")
    FC="[0:v]fps=30[v0];[2:v]fps=30,setpts=PTS-STARTPTS[p0];[3:v]fps=30,setpts=PTS-STARTPTS+$of/TB[p1];[v0][p0]overlay=0:0:eof_action=pass:repeatlast=0[v1];[v1][p1]overlay=0:0:eof_action=pass:repeatlast=0:enable='gte(t,$of)'[v];[1:v]fps=30[s];[v][s]overlay=0:0:format=auto:eof_action=pass,format=yuv420p[o]"
  else
    PAR=(); FC="[0:v]fps=30[v];[1:v]fps=30[s];[v][s]overlay=0:0:format=auto:eof_action=pass,format=yuv420p[o]"
  fi
  ffmpeg -loglevel error -y -ss "$t0" -to "$t1" -i "$SRC" -ss "$t0" -to "$t1" -i "$SUB" "${PAR[@]}" \
    -filter_complex "$FC" -map "[o]" -map 0:a \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11:$mi:linear=true,afade=in:d=0.15,afade=out:st=$(echo "scale=4; $d-0.25" | bc):d=0.25,aresample=48000" \
    -c:v libx264 -preset slow -crf 17 -maxrate 18M -bufsize 36M -profile:v high -pix_fmt yuv420p -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$out"
  echo "parte $((k+1)): $(ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$out") → $out"
done
