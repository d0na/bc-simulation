#!/bin/bash

# Configurazioni
outff="png"
outf="png"
size="600,600"
fileOut="simGraph12Bezier"

# Verifica esistenza file di input
fileIn1="./output/86400a1_20250428183132.tsv"
#fileIn1="./output/simResultsTest5Scaledt86400a1.tsv"
#fileIn2="./simResultsTest6Scaledt1209600a60.tsv"

# Controlla se i file esistono
for file in "$fileIn1" ; do
    if [ ! -f "$file" ]; then
        echo "ERRORE: File $file non trovato!" >&2
        exit 1
    fi
#    if [ ! -s "$file" ]; then
#        echo "ERRORE: File $file è vuoto!" >&2
#        exit 1
#    fi
done

# Crea comando gnuplot
gnuplot << EOF
set terminal ${outff} size ${size}
set output "${fileOut}.${outf}"
set xlabel 'seconds'
set ylabel 'gas'
set grid ytics
set xrange [0:1209600]
set yrange [1000000:1800100000]
set logscale y
set xtics font 'Times-New-Roman,15'
set ytics font 'Times-New-Roman,15'
set key outside center below

# Formattazione dati: salta intestazioni se presenti
set datafile commentschars "#"
set datafile separator "\t"
plot   "${fileIn1}"  using 1:2 with lines title 'Total' smooth bezier lw 3 lc "medium-blue",
#        "${fileIn1}" using 1:12 with filledcurves smooth bezie title 'assetTransfer' lc "light-red",
#        "${fileIn1}" using 1:10 with filledcurves smooth bezie title 'attributeUpdate' lc "goldenrod",
#        "${fileIn1}" using 1:8 with filledcurves smooth bezie title 'holderPolicyUpdate' lc "dark-yellow",
#        "${fileIn1}" using 1:6 with filledcurves smooth bezie title 'newAssetCreation' lc "dark-orange",
#        "${fileIn1}" using 1:4 with filledcurves smooth bezie title 'newCreatorCreation' lc "green"
EOF

if [ $? -eq 0 ]; then
    echo "Grafico generato con successo: ${fileOut}.${outf}"
else
    echo "Errore durante la generazione del grafico" >&2
fi