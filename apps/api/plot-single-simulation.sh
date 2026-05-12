#!/bin/zsh

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <input.tsv> [output-dir]"
  exit 1
fi

INPUT_TSV="$1"
OUTPUT_DIR="${2:-$(dirname "$INPUT_TSV")/plots}"

if [[ ! -f "$INPUT_TSV" ]]; then
  echo "Error: input file not found: $INPUT_TSV"
  exit 1
fi

if ! command -v gnuplot >/dev/null 2>&1; then
  echo "Error: gnuplot is required but not installed"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

BASENAME="$(basename "$INPUT_TSV" .tsv)"

COMMON_SETTINGS="
set datafile separator '\t'
set terminal pngcairo enhanced size 1400,900 font 'DejaVu Sans,18'
set border 3 lw 1.5
set grid xtics ytics lt 1 lc rgb '#d9d9d9' lw 1
set key outside right center box opaque
set xrange [0:*]
set xlabel 'Time (days)'
set xtics font 'DejaVu Sans,14'
set ytics font 'DejaVu Sans,14'
set xlabel font 'DejaVu Sans,20'
set ylabel font 'DejaVu Sans,20'
set title font 'DejaVu Sans,24' noenhanced
set xdata time
set timefmt '%s'
set format x '%.1f'
"

gnuplot <<EOF
$COMMON_SETTINGS
set output '${OUTPUT_DIR}/${BASENAME}_kitty_growth.png'
set title 'Kitty Growth per Run'
set ylabel 'Number of Kitties'
plot \
  '${INPUT_TSV}' using 1:10 with lines lw 2 lc rgb '#d62728' title 'min', \
  '${INPUT_TSV}' using 1:11 with lines lw 2 lc rgb '#2ca02c' title 'max', \
  '${INPUT_TSV}' using 1:(\$9-\$12):(\$9+\$12) with filledcurves lc rgb '#9ecae1' fs transparent solid 0.35 title 'avg +/- std', \
  '${INPUT_TSV}' using 1:9 with lines lw 3 lc rgb '#1f77b4' title 'avg'
EOF

gnuplot <<EOF
$COMMON_SETTINGS
set output '${OUTPUT_DIR}/${BASENAME}_new_kitties_per_interval.png'
set title 'New Kitties per Interval'
set ylabel 'New Kitties'
set style fill solid 0.6 noborder
set boxwidth 0.03 relative
plot \
  '${INPUT_TSV}' using 1:13 with boxes lc rgb '#ff7f0e' title 'new kitties'
EOF

gnuplot <<EOF
$COMMON_SETTINGS
set output '${OUTPUT_DIR}/${BASENAME}_gas_per_interval.png'
set title 'Gas per Interval'
set ylabel 'Mean Gas'
plot \
  '${INPUT_TSV}' using 1:(\$4-\$5):(\$4+\$5) with filledcurves lc rgb '#c7e9c0' fs transparent solid 0.35 title 'mean +/- std', \
  '${INPUT_TSV}' using 1:4 with lines lw 3 lc rgb '#238b45' title 'gas total mean'
EOF

echo "Generated plots in $OUTPUT_DIR"
