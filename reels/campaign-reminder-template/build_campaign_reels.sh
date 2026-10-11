#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
AVATAR="${AVATAR:-$ROOT/assets/profile-avatar.png}"
FREE_SCENE="${FREE_SCENE:-$ROOT/assets/free-scene.png}"
EARLY_BIRD_SCENE="${EARLY_BIRD_SCENE:-$ROOT/assets/early-bird-scene.png}"
OUT="${OUT:-$ROOT/exports}"
TMP="${TMP:-$ROOT/.tmp/campaign-build}"
FREE_START_DATE="${FREE_START_DATE:-10/26}"
FREE_ENDING_DATE="${FREE_ENDING_DATE:-10/18}"
SALE_START_DATE="${SALE_START_DATE:-10/22}"
SALE_ENDING_DATE="${SALE_ENDING_DATE:-10/28}"
FREE_DEADLINE="${FREE_DEADLINE:-October 21}"
SALE_DEADLINE="${SALE_DEADLINE:-October 31}"
SALE_PRICE="${SALE_PRICE:-2.75}"

FREE_START_MM="${FREE_START_DATE%%/*}"; FREE_START_DD="${FREE_START_DATE##*/}"
FREE_ENDING_MM="${FREE_ENDING_DATE%%/*}"; FREE_ENDING_DD="${FREE_ENDING_DATE##*/}"
SALE_START_MM="${SALE_START_DATE%%/*}"; SALE_START_DD="${SALE_START_DATE##*/}"
SALE_ENDING_MM="${SALE_ENDING_DATE%%/*}"; SALE_ENDING_DD="${SALE_ENDING_DATE##*/}"

mkdir -p "$OUT" "$TMP"

for source in "$AVATAR" "$FREE_SCENE" "$EARLY_BIRD_SCENE"; do
  if [[ ! -f "$source" ]]; then
    echo "Missing source asset: $source" >&2
    exit 1
  fi
done

ffmpeg -y -i "$AVATAR" -vf "crop=iw:iw,scale=86:86,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte((X-W/2)*(X-W/2)+(Y-H/2)*(Y-H/2),(W/2)*(W/2)),255,0)'" -frames:v 1 "$TMP/avatar.png" >/dev/null 2>&1
ffmpeg -y -f lavfi -i "color=c=0xFFFFFF@0.98:s=554x280:d=1,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(max(max(18-X,0),X-(W-19))*max(max(18-X,0),X-(W-19))+max(max(18-Y,0),Y-(H-19))*max(max(18-Y,0),Y-(H-19)),18*18),255,0)'" -frames:v 1 "$TMP/card.png" >/dev/null 2>&1

for variant in free-start free-ending-soon early-bird-start early-bird-ending-soon; do
  case "$variant" in
    free-start)
      BG="$FREE_SCENE"; DATE_MM="$FREE_START_MM"; DATE_DD="$FREE_START_DD"; OUT_NAME="free-worksheets-start.mp4"
      TITLE="FREE NOVEMBER WORKSHEETS"; LINE1="Free through $FREE_DEADLINE"; LINE2="Link in bio" ;;
    free-ending-soon)
      BG="$FREE_SCENE"; DATE_MM="$FREE_ENDING_MM"; DATE_DD="$FREE_ENDING_DD"; OUT_NAME="free-worksheets-ending-soon.mp4"
      TITLE="FREE WORKSHEETS END IN 3 DAYS"; LINE1="Download before $FREE_DEADLINE"; LINE2="Link in bio" ;;
    early-bird-start)
      BG="$EARLY_BIRD_SCENE"; DATE_MM="$SALE_START_MM"; DATE_DD="$SALE_START_DD"; OUT_NAME="early-bird-sale-start.mp4"
      TITLE="EARLY-BIRD SALE IS LIVE"; LINE1="Get the complete resource for \$$SALE_PRICE"; LINE2="Through $SALE_DEADLINE • Link in bio" ;;
    early-bird-ending-soon)
      BG="$EARLY_BIRD_SCENE"; DATE_MM="$SALE_ENDING_MM"; DATE_DD="$SALE_ENDING_DD"; OUT_NAME="early-bird-sale-ending-soon.mp4"
      TITLE="EARLY-BIRD PRICING ENDS IN 3 DAYS"; LINE1="Save through $SALE_DEADLINE"; LINE2="Link in bio" ;;
  esac

  printf '%s' "$TITLE" > "$TMP/title.txt"
  printf '%s' "$LINE1" > "$TMP/line1.txt"
  printf '%s' "$LINE2" > "$TMP/line2.txt"

  filter="[0:v]trim=duration=8,setpts=PTS-STARTPTS,crop=610:850:0:110,scale=610:1086,eq=brightness=-0.02:saturation=0.82[base];[2:v]format=rgba[cardimg];[base][cardimg]overlay=x=28:y='395-90*(1-min(t/0.6,1))':format=auto[card];[card]drawtext=font='Helvetica Neue':text='${DATE_MM}':x=30:y='66-90*(1-min(t/0.6,1))':fontsize=18:fontcolor=0xF6F0E2,drawtext=font='Helvetica Neue':text='${DATE_DD}':x=30:y='88-90*(1-min(t/0.6,1))':fontsize=18:fontcolor=0xF6F0E2,drawtext=font='Helvetica Neue':text='Reminder':x=56:y='435-90*(1-min(t/0.6,1))':fontsize=15:fontcolor=0x203245,drawtext=font='Helvetica Neue':text='Now':x=554-tw:y='435-90*(1-min(t/0.6,1))':fontsize=15:fontcolor=0x203245@0.62,drawtext=font='Helvetica Neue':textfile='${TMP}/title.txt':x=56:y='500-90*(1-min(t/0.6,1))':fontsize=22:fontcolor=0x203245,drawtext=font='Helvetica Neue':textfile='${TMP}/line1.txt':x=56:y='550-90*(1-min(t/0.6,1))':fontsize=18:fontcolor=0x203245,drawtext=font='Helvetica Neue':textfile='${TMP}/line2.txt':x=56:y='577-90*(1-min(t/0.6,1))':fontsize=18:fontcolor=0x203245,drawtext=font='Helvetica Neue':text='@engineermom.worksheets':x=56:y='630-90*(1-min(t/0.6,1))':fontsize=14:fontcolor=0x203245@0.58[text];[1:v]format=rgba[av];[text][av]overlay=x=262:y='368-90*(1-min(t/0.6,1))':format=auto,fade=t=in:st=0:d=0.25,fade=t=out:st=7.5:d=0.5,format=yuv420p[v]"

  ffmpeg -y -loop 1 -i "$BG" -i "$TMP/avatar.png" -i "$TMP/card.png" -filter_complex "$filter" -map "[v]" -t 8 -r 30 -c:v libx264 -preset medium -crf 19 -movflags +faststart -an "$OUT/$OUT_NAME" >/dev/null 2>&1
done

echo "Created four campaign Reel variants in $OUT"
ls -lh "$OUT"/free-worksheets-*.mp4 "$OUT"/early-bird-sale-*.mp4
