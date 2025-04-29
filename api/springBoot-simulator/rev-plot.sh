
outff=png
outf=png
size="600,400"
#size="1024,768"
#max=20
#font="font \"/Library/Fonts/Courier New.ttf\" fsize 14"
font=""
title=""


#time	gasTotalMean	gasTotalStd	gasNewCreatorMean	gasNewCreatorStd	gasNewAssetMean	gasNewAssetStd	gasHolderPolicyUpdateMean	gasHolderPolicyUpdateStd	gasCharacteristicUpdateMean	gasCharacteristicUpdateStd	gasTransferMean	gasTransferStd	TotalNumCreators	maxCreators	minCreators	avgCreators	stdCreators	TotalNumAssets	maxAssets	minAssets	avgAssets	stdAssets

same="set terminal $outff $font size $size
set xlabel 'seconds'
set ylabel 'gas'
set grid ytics
show grid
set xrange [0:86400]
set yrange [0:*]
set xtics font 'Times-New-Roman,15
set ytics font 'Times-New-Roman,15
set xlabel font 'Times-New-Roman,18
set ylabel font 'Times-New-Roman,18
set title font 'Times-New-Roman,18
set key outside center below
set key font 'Times-New-Roman,18 \n";
#set yrange [0:3000000]
#set logscale y
#set xdata time
#set timefmt \"%Y-%m-%d\"
#set format x \"%Y-%m-%d\"
#set xrange ['2024-07-14':'2024-07-21']
#set xtics ('2024-07-15','2024-07-16','2024-07-17','2024-07-18','2024-07-19', '2024-07-20')";

#set yrange [0:6800000]

fileIn1=./output/86400a1_20250429131319
fileOut="simGraph1Variance"
gnuplot --persist << EOF
$same
set output "$fileOut.$outf"
set title "Single peak"

plot \
  "$fileIn1.tsv" using 1:(\$16-\$17):(\$16+\$17) with filledcurves lc "skyblue" fs transparent solid 0.35 title "std", \
  "$fileIn1.tsv" using 1:16 lc "skyblue" pt 9 title "mean", \
  "$fileIn1.tsv" using 1:16 with lines title "bezier" smooth bezier lw 3 lc "medium-blue"
EOF

fileIn2=./output/sim2-86400a1_20250429120029
fileOut="simGraph2Variance"
gnuplot --persist << EOF
$same
set output "$fileOut.$outf"
set title 'Boom and bust'
plot \
  "$fileIn2.tsv" using 1:(\$16-\$17):(\$16+\$17) with filledcurves lc "skyblue" fs transparent solid 0.35 title "std", \
  "$fileIn2.tsv" using 1:16 lc "skyblue" pt 9 title "mean", \
  "$fileIn2.tsv" using 1:16 with lines title "bezier" smooth bezier lw 3 lc "medium-blue"
EOF

fileOut="simGraph1Creators"
gnuplot --persist << EOF
$same
set output "$fileOut.$outf"
set ylabel 'number of creators'
set title 'Single peak'
plot \
  '$fileIn1.tsv' using 1:(\$33-\$36):(\$33+\$36) with filledcurves lc "skyblue" fs transparent solid 0.35 title 'std', \
  '$fileIn1.tsv' using 1:33 lc "skyblue" pt 9 title 'mean', \
  '$fileIn1.tsv' using 1:33 with lines title 'bezier' smooth bezier lw 3 lc "medium-blue", \
  '$fileIn1.tsv' using 1:35 with lines title 'max' smooth bezier lw 3 lc "red", \
  '$fileIn1.tsv' using 1:34 with lines title 'min' smooth bezier lw 3 lc "green"
EOF

fileOut="simGraph1Assets"
gnuplot --persist << EOF
$same
set output "$fileOut.$outf"
set ylabel 'number of assets'
set title 'Single peak'
plot \
  '$fileIn1.tsv' using 1:(\$38-\$41):(\$38+\$41) with filledcurves lc "skyblue" fs transparent solid 0.35 title 'std', \
  '$fileIn1.tsv' using 1:38 lc "skyblue" pt 9 title 'mean', \
  '$fileIn1.tsv' using 1:38 with lines title 'bezier' smooth bezier lw 3 lc "medium-blue", \
  '$fileIn1.tsv' using 1:40 with lines title 'max' smooth bezier lw 3 lc "red", \
  '$fileIn1.tsv' using 1:39 with lines title 'min' smooth bezier lw 3 lc "green"
EOF

fileOut="simGraph2Creators"
gnuplot --persist << EOF
$same
set output "$fileOut.$outf"
set ylabel 'number of creators'
set title 'Boom and bust'
plot \
  '$fileIn2.tsv' using 1:(\$33-\$36):(\$33+\$36) with filledcurves lc "skyblue" fs transparent solid 0.35 title 'std', \
  '$fileIn2.tsv' using 1:33 lc "skyblue" pt 9 title 'mean', \
  '$fileIn2.tsv' using 1:33 with lines title 'bezier' smooth bezier lw 3 lc "medium-blue", \
  '$fileIn2.tsv' using 1:35 with lines title 'max' smooth bezier lw 3 lc "red", \
  '$fileIn2.tsv' using 1:34 with lines title 'min' smooth bezier lw 3 lc "green"
EOF

fileOut="simGraph2Assets"
gnuplot --persist << EOF
$same
set output "$fileOut.$outf"
set ylabel 'number of assets'
set title 'Boom and bust'
plot \
  '$fileIn2.tsv' using 1:(\$38-\$41):(\$38+\$41) with filledcurves lc "skyblue" fs transparent solid 0.35 title 'std', \
  '$fileIn2.tsv' using 1:38 lc "skyblue" pt 9 title 'mean', \
  '$fileIn2.tsv' using 1:38 with lines title 'bezier' smooth bezier lw 3 lc "medium-blue", \
  '$fileIn2.tsv' using 1:40 with lines title 'max' smooth bezier lw 3 lc "red", \
  '$fileIn2.tsv' using 1:39 with lines title 'min' smooth bezier lw 3 lc "green"
EOF

fileOut="simGraph1Operationss"
size="600,600"
gnuplot --persist << EOF
$same
set output "$fileOut.$outf"
set ylabel 'gas'
set title 'Single peak'
set yrange [0:3000000]
set terminal $outff $font size $size
plot \
  '$fileIn1.tsv' using 1:16 with lines title 'Total' smooth bezier lw 3 lc "medium-blue", \
  '$fileIn1.tsv' using 1:18 with filledcurves smooth bezie title 'assetTransfer' lc "light-red", \
  '$fileIn1.tsv' using 1:28 with filledcurves smooth bezie title 'attributeUpdate' lc "goldenrod", \
  '$fileIn1.tsv' using 1:30 with filledcurves smooth bezie title 'holderPolicyUpdate' lc "dark-yellow",\
  '$fileIn1.tsv' using 1:14 with filledcurves smooth bezie title 'newAssetCreation' lc "dark-orange",\
  '$fileIn1.tsv' using 1:6 with filledcurves smooth bezie title 'newCreatorCreation' lc "green"
EOF

fileOut="simGraph2Operations"
size="600,600"
gnuplot --persist << EOF
$same
set output "$fileOut.$outf"
set ylabel 'gas'
set title 'Boom and bust'
set yrange [0:105000000]
set terminal $outff $font size $size
plot \
  '$fileIn2.tsv' using 1:16 with lines title 'Total' smooth bezier lw 3 lc "medium-blue", \
  '$fileIn2.tsv' using 1:18 with filledcurves smooth bezie title 'assetTransfer' lc "light-red", \
  '$fileIn2.tsv' using 1:28 with filledcurves smooth bezie title 'attributeUpdate' lc "goldenrod", \
  '$fileIn2.tsv' using 1:30 with filledcurves smooth bezie title 'holderPolicyUpdate' lc "dark-yellow",\
  '$fileIn2.tsv' using 1:14 with filledcurves smooth bezie title 'newAssetCreation' lc "dark-orange",\
  '$fileIn2.tsv' using 1:6 with filledcurves smooth bezie title 'newCreatorCreation' lc "green"
EOF

fileOut="simGraph12Bezier"
size="600,600"
gnuplot --persist << EOF
$same
set output "$fileOut.$outf"
set yrange [1000000:1800100000]
set logscale y
set terminal $outff $font size $size

plot \
  '$fileIn1.tsv' using 1:16 with lines title 'Single peak' smooth bezier lw 3 lc "medium-blue", \
  '$fileIn2.tsv' using 1:16 with lines title 'Boom and bust' smooth bezier lw 3 lc "forest-green", \
  150000000 w l lw 3 lc "light-red" title 'Ethereum', \
  1800000000 w l lw 3 lc "dark-yellow" title 'Optimism', \
  900000000 w l lw 3 lc "dark-orange" title 'Polygon'
EOF

