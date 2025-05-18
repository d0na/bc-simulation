package com.bcsimulator.service;

import com.bcsimulator.dto.graph.DataFileDTO;
import com.bcsimulator.dto.graph.GraphRequestDTO;
import com.bcsimulator.dto.graph.PlotConfigDTO;
import com.bcsimulator.enums.PlotType;
import com.bcsimulator.repository.CsvFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.util.List;

@Service
public class GnuplotService {

    String outputDir = "./output";
    String filename = "./output_graph";

    @Autowired
    private CsvFileRepository cvsFileRepository;

//    public File generateGraph(GraphRequestDTO request) throws IOException, InterruptedException {
//        String scriptPath = outputDir + "/" + filename + ".plt";
//        File scriptFile = new File(scriptPath);
//
//        try (FileWriter writer = new FileWriter(scriptFile)) {
//            writer.write("set terminal " + request.getOutputFormat() + " size " + request.getSize() + "\n");
//            writer.write("set output '" +  outputDir + "/" + filename  + "." + request.getOutputFormat() + "'\n");
//            writer.write("set title '" + request.getTitle() + "'\n");
//            writer.write("set xlabel '" + request.getXlabel() + "'\n");
//            writer.write("set ylabel '" + request.getYlabel() + "'\n");
//
//            if (request.getXRange() != null)
//                writer.write("set xrange [" + request.getXRange() + "]\n");
//
//            if (request.getYRange() != null)
//                writer.write("set yrange [" + request.getYRange() + "]\n");
//
//            if (request.isLogscaleY())
//                writer.write("set logscale y\n");
//
//            writer.write("set key inside top left\n");
//            writer.write("set style data lines\n\n");
//            writer.write(request.getExtraOptions()+"\n");
//            // Mappa alias -> path
//            for (DataFileDTO file : request.getDataFiles()) {
//                writer.write("# data file alias: " + file.getAlias() + " = " + file.getPath() + "\n");
//            }
//            writer.write("\n");
//
//            // Genera comandi di plot
//            writer.write("plot \\\n");
//
//            List<PlotConfigDTO> plots = request.getPlots();
//            for (int i = 0; i < plots.size(); i++) {
//                PlotConfigDTO plot = plots.get(i);
//                String filePath = request.getDataFiles().stream()
//                        .filter(f -> f.getAlias().equals(plot.getDataFileAlias()))
//                        .findFirst()
//                        .orElseThrow(() -> new IllegalArgumentException("File alias not found: " + plot.getDataFileAlias()))
//                        .getPath();
//
//                writer.write("    '" + filePath + "' using " + plot.getUsing());
//
//                if (plot.getType() == PlotType.FILLEDCURVES)
//                    writer.write(" with filledcurves");
//
//                else if (plot.getType() == PlotType.LINES)
//                    writer.write(" with lines");
//
//                else if (plot.getType() == PlotType.POINTS)
//                    writer.write(" with points");
//
//                else if (plot.getType() == PlotType.LINE)
//                    writer.write(" with lines");
//
//                writer.write(" title '" + plot.getTitle() + "'");
//
//                if (plot.getType() != PlotType.LINE) {
//                    writer.write(" linecolor rgb '" + plot.getColor() + "'");
//                    writer.write(" linewidth " + plot.getLineWidth());
//                    if (plot.getSmooth() != null && !plot.getSmooth().isEmpty() )
//                        writer.write(" smooth "+plot.getSmooth());
//                    if (plot.getFill() != null && plot.getType() == PlotType.FILLEDCURVES) {
//                        writer.write(" fill solid " + plot.getFill().getSolid());
//                        if (plot.getFill().isTransparent())
//                            writer.write(" noborder");
//                    }
//                }
//
//                if (i < plots.size() - 1)
//                    writer.write(", \\\n");
//                else
//                    writer.write("\n");
//            }
//        }
//
//        // Esegui Gnuplot
//        ProcessBuilder pb = new ProcessBuilder("gnuplot", scriptFile.getAbsolutePath());
//        pb.inheritIO();
//        Process process = pb.start();
//        int exitCode = process.waitFor();
//
//        if (exitCode != 0)
//            throw new RuntimeException("Gnuplot exited with code " + exitCode);
//        return scriptFile;
//    }

    public byte[] getGraphImage(GraphRequestDTO request) throws IOException, InterruptedException {
        // genera il grafico
        generateGraph(request);

        String outputPath = outputDir + "/" + filename + "." + request.getOutputFormat();
        File imageFile = new File(outputPath);

        if (!imageFile.exists())
            throw new FileNotFoundException("Generated graph not found: " + outputPath);

        return Files.readAllBytes(imageFile.toPath());
    }

    /**
     * Genera un grafico utilizzando Gnuplot basato sui parametri specificati nella richiesta.
     *
     * @param request Oggetto DTO contenente tutte le configurazioni per il grafico
     * @return Il file di script Gnuplot generato
     * @throws IOException              Se si verificano errori di I/O durante la scrittura del file o l'esecuzione di Gnuplot
     * @throws InterruptedException     Se l'esecuzione di Gnuplot viene interrotta
     * @throws IllegalArgumentException Se si verificano errori di configurazione
     */
    public File generateGraph(GraphRequestDTO request) throws IOException, InterruptedException {
        // Validazione dei parametri di input
        validateRequest(request);

        // Preparazione dei percorsi dei file
        String scriptPath = buildScriptPath(outputDir, filename);
        File scriptFile = new File(scriptPath);
        String outputPath = buildOutputPath(outputDir, filename, request.getOutputFormat());

        // Generazione dello script Gnuplot
        writeGnuplotScript(scriptFile, outputPath, request);

        // Esecuzione di Gnuplot
        executeGnuplot(scriptFile);

        return scriptFile;
    }

    /**
     * Valida i parametri della richiesta.
     */
    private void validateRequest(GraphRequestDTO request) {
        if (request == null) {
            throw new IllegalArgumentException("La richiesta non può essere null");
        }

        if (request.getDataFiles() == null || request.getDataFiles().isEmpty()) {
            throw new IllegalArgumentException("Almeno un file di dati deve essere specificato");
        }

        if (request.getPlots() == null || request.getPlots().isEmpty()) {
            throw new IllegalArgumentException("Almeno un grafico deve essere specificato");
        }

        if (request.getOutputFormat() == null || request.getOutputFormat().trim().isEmpty()) {
            throw new IllegalArgumentException("Il formato di output è obbligatorio");
        }
    }

    /**
     * Costruisce il percorso del file di script Gnuplot.
     */
    private String buildScriptPath(String outputDir, String filename) {
        return outputDir + File.separator + filename + ".plt";
    }

    /**
     * Costruisce il percorso del file di output.
     */
    private String buildOutputPath(String outputDir, String filename, String format) {
        return outputDir + File.separator + filename + "." + format;
    }

    /**
     * Scrive lo script Gnuplot nel file specificato.
     */
    private void writeGnuplotScript(File scriptFile, String outputPath, GraphRequestDTO request) throws IOException {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(scriptFile))) {
            // Impostazioni di base
            writeBasicSettings(writer, outputPath, request);

            // Impostazioni degli assi
            writeAxisSettings(writer, request);

            // Impostazioni aggiuntive
            writeAdditionalSettings(writer, request);

            // Mappatura dei file di dati
            writeDataFilesMappings(writer, request.getDataFiles());

            // Genera comandi di plot
            writePlotCommands(writer, request);
        }
    }

    /**
     * Scrive le impostazioni di base dello script Gnuplot.
     */
    private void writeBasicSettings(BufferedWriter writer, String outputPath, GraphRequestDTO request) throws IOException {
        writer.write("set terminal " + request.getOutputFormat() + " size " + request.getSize());
        writer.newLine();
        writer.write("set output '" + outputPath + "'");
        writer.newLine();
        writer.write("set title '" + escapeGnuplotString(request.getTitle()) + "'");
        writer.newLine();
    }

    /**
     * Scrive le impostazioni degli assi.
     */
    private void writeAxisSettings(BufferedWriter writer, GraphRequestDTO request) throws IOException {
        writer.write("set xlabel '" + escapeGnuplotString(request.getXlabel()) + "'");
        writer.newLine();
        writer.write("set ylabel '" + escapeGnuplotString(request.getYlabel()) + "'");
        writer.newLine();

        if (request.getXRange() != null && !request.getXRange().isEmpty()) {
            writer.write("set xrange [" + request.getXRange() + "]");
            writer.newLine();
        }

        if (request.getYRange() != null && !request.getYRange().isEmpty()) {
            writer.write("set yrange [" + request.getYRange() + "]");
            writer.newLine();
        }

        if (request.isLogscaleY()) {
            writer.write("set logscale y");
            writer.newLine();
        }
    }

    /**
     * Scrive impostazioni aggiuntive dello script Gnuplot.
     */
    private void writeAdditionalSettings(BufferedWriter writer, GraphRequestDTO request) throws IOException {
        writer.write("set key inside top left");
        writer.newLine();
        writer.write("set style data lines");
        writer.newLine();

        if (request.getExtraOptions() != null && !request.getExtraOptions().isEmpty()) {
            writer.write(request.getExtraOptions());
            writer.newLine();
        }
    }

    /**
     * Scrive la mappatura dei file di dati.
     */
    private void writeDataFilesMappings(BufferedWriter writer, List<DataFileDTO> dataFiles) throws IOException {
        writer.newLine();
        for (DataFileDTO file : dataFiles) {
            writer.write("# data file alias: " + file.getAlias() + " = " + file.getPath());
            writer.newLine();
        }
        writer.newLine();
    }

    /**
     * Scrive i comandi di plot.
     */
    private void writePlotCommands(BufferedWriter writer, GraphRequestDTO request) throws IOException {
        List<PlotConfigDTO> plots = request.getPlots();
        if (plots.isEmpty()) {
            return;
        }

        writer.write("plot \\");
        writer.newLine();

        for (int i = 0; i < plots.size(); i++) {
            PlotConfigDTO plot = plots.get(i);
            String filePath = findDataFilePath(plot.getDataFileAlias(), request.getDataFiles());

            writer.write("    '" + filePath + "' using " + plot.getUsing());

            // Configura il tipo di plot
            writePlotType(writer, plot);

            // Titolo del plot
            writer.write(" title '" + escapeGnuplotString(plot.getTitle()) + "'");

            // Stile e personalizzazioni
            writePlotStyles(writer, plot);

            // Separatore tra plot o terminatore
            if (i < plots.size() - 1) {
                writer.write(", \\");
            }
            writer.newLine();
        }
    }

    /**
     * Scrive il tipo di plot.
     */
    private void writePlotType(BufferedWriter writer, PlotConfigDTO plot) throws IOException {
        switch (plot.getType()) {
            case FILLEDCURVES:
                writer.write(" with filledcurves");
                break;
            case LINES:
            case LINE:
                writer.write(" with lines");
                break;
            case POINTS:
                writer.write(" with points");
                break;
            default:
                // Default a lines se non specificato
                writer.write(" ");
        }
    }

    private void writeSmoothType(BufferedWriter writer, PlotConfigDTO plot) throws IOException {
        if (plot.getSmooth() != null) {
            switch (plot.getSmooth()) {
                case UNIQUE:
                    writer.write(" smooth unique");
                    break;
                case FREQUENCY:
                    writer.write(" smooth frequency");
                    break;
                case CSPLINES:
                    writer.write(" smooth csplines");
                    break;
                case ACSPLINES:
                    writer.write(" smooth acsplines");
                    break;
                case BEZIER:
                    writer.write(" smooth bezier");
                    break;
                case SBEZIER:
                    writer.write(" smooth sbezier");
                    break;
                case NONE:
                    writer.write("");
                    break;
                default:
                    // Default a lines se non specificato
                    writer.write(" ");
            }
        } else {
            writer.write(" ");
        }
    }

    /**
     * Scrive gli stili e le personalizzazioni del plot.
     */
    private void writePlotStyles(BufferedWriter writer, PlotConfigDTO plot) throws IOException {
//        if (plot.getType() != PlotType.LINE) {
        if (plot.getColor() != null && !plot.getColor().isEmpty()) {
            writer.write(" lc rgb '" + plot.getColor() + "'");
        }

        if (plot.getLineWidth() > 0) {
            writer.write(" linewidth " + plot.getLineWidth());
        }

        // Configura il tipo di plot
        writeSmoothType(writer, plot);

        if (plot.getFill() != null && plot.getType() == PlotType.FILLEDCURVES) {
            writer.write(" fill solid " + plot.getFill().getSolid());
            if (plot.getFill().isTransparent()) {
                writer.write(" noborder");
            }
        }
//        }
    }

    /**
     * Trova il percorso del file di dati dato l'alias.
     */
    private String findDataFilePath(String alias, List<DataFileDTO> dataFiles) {
        return dataFiles.stream()
                .filter(f -> f.getAlias().equals(alias))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("File alias non trovato: " + alias))
                .getPath();
    }

    /**
     * Esegue Gnuplot con lo script specificato.
     */
    private void executeGnuplot(File scriptFile) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder("gnuplot", scriptFile.getAbsolutePath());
        pb.redirectErrorStream(true); // Unisce stderr a stdout per una migliore gestione degli errori

        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            // Lettura dell'output di errore
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                StringBuilder errorOutput = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    errorOutput.append(line).append("\n");
                }
                throw new RuntimeException("Gnuplot è terminato con codice " + exitCode + ": " + errorOutput);
            }
        }
    }

    /**
     * Esegue l'escape delle stringhe per Gnuplot.
     */
    private String escapeGnuplotString(String input) {
        if (input == null) return "";
        return input.replace("'", "\\'");
    }
}

