package com.bcsimulator.service;

import com.bcsimulator.dto.graph.DataFileDTO;
import com.bcsimulator.dto.graph.GraphRequestDTO;
import com.bcsimulator.dto.graph.PlotConfigDTO;
import com.bcsimulator.enums.PlotType;
import com.bcsimulator.repository.CsvFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@Service
public class GnuplotService {

    String outputDir = "./output";
    String filename = "./output_graph";

    @Autowired
    private CsvFileRepository cvsFileRepository;

    public File generateGraph(GraphRequestDTO request) throws IOException, InterruptedException {
        String scriptPath = outputDir + "/" + filename + ".plt";
        File scriptFile = new File(scriptPath);

        try (FileWriter writer = new FileWriter(scriptFile)) {
            writer.write("set terminal " + request.getOutputFormat() + " size " + request.getSize() + "\n");
            writer.write("set output '" +  outputDir + "/" + filename  + "." + request.getOutputFormat() + "'\n");
            writer.write("set title '" + request.getTitle() + "'\n");
            writer.write("set xlabel '" + request.getXlabel() + "'\n");
            writer.write("set ylabel '" + request.getYlabel() + "'\n");

            if (request.getXRange() != null)
                writer.write("set xrange [" + request.getXRange() + "]\n");

            if (request.getYRange() != null)
                writer.write("set yrange [" + request.getYRange() + "]\n");

            if (request.isLogscaleY())
                writer.write("set logscale y\n");

            writer.write("set key inside top left\n");
            writer.write("set style data lines\n\n");

            // Mappa alias -> path
            for (DataFileDTO file : request.getDataFiles()) {
                writer.write("# data file alias: " + file.getAlias() + " = " + file.getPath() + "\n");
            }
            writer.write("\n");

            // Genera comandi di plot
            writer.write("plot \\\n");

            List<PlotConfigDTO> plots = request.getPlots();
            for (int i = 0; i < plots.size(); i++) {
                PlotConfigDTO plot = plots.get(i);
                String filePath = request.getDataFiles().stream()
                        .filter(f -> f.getAlias().equals(plot.getDataFileAlias()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("File alias not found: " + plot.getDataFileAlias()))
                        .getPath();

                writer.write("    '" + filePath + "' using " + plot.getUsing());

                if (plot.getType() == PlotType.FILLEDCURVES)
                    writer.write(" with filledcurves");

                else if (plot.getType() == PlotType.LINES)
                    writer.write(" with lines");

                else if (plot.getType() == PlotType.POINTS)
                    writer.write(" with points");

                else if (plot.getType() == PlotType.LINE)
                    writer.write(" with lines");

                writer.write(" title '" + plot.getTitle() + "'");

                if (plot.getType() != PlotType.LINE) {
                    writer.write(" linecolor rgb '" + plot.getColor() + "'");
                    writer.write(" linewidth " + plot.getLineWidth());
                    if (plot.isSmooth())
                        writer.write(" smooth bezier");
                    if (plot.getFill() != null && plot.getType() == PlotType.FILLEDCURVES) {
                        writer.write(" fill solid " + plot.getFill().getSolid());
                        if (plot.getFill().isTransparent())
                            writer.write(" noborder");
                    }
                }

                if (i < plots.size() - 1)
                    writer.write(", \\\n");
                else
                    writer.write("\n");
            }
        }

        // Esegui Gnuplot
        ProcessBuilder pb = new ProcessBuilder("gnuplot", scriptFile.getAbsolutePath());
        pb.inheritIO();
        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode != 0)
            throw new RuntimeException("Gnuplot exited with code " + exitCode);
        return scriptFile;
    }

    public byte[] getGraphImage(GraphRequestDTO request) throws IOException, InterruptedException {
        // genera il grafico
        generateGraph(request);

        String outputPath = outputDir + "/" + filename + "." + request.getOutputFormat();
        File imageFile = new File(outputPath);

        if (!imageFile.exists())
            throw new FileNotFoundException("Generated graph not found: " + outputPath);

        return Files.readAllBytes(imageFile.toPath());
    }
}

