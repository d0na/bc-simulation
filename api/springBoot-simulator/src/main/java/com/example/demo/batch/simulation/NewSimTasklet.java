package com.example.demo.batch.simulation;

import com.example.demo.dto.SimulationRequestDTO;
import com.example.demo.model.CsvFile;
import com.example.demo.nmtsimulation.roundResults.SimRoundResults;
import com.example.demo.nmtsimulation.roundResults.SimRoundResultsAggregated;
import com.example.demo.nmtsimulation.simParam.SimParams;
import com.example.demo.repository.CsvFileRepository;
import com.example.demo.service.ProgressTracker;
import com.example.demo.simulator.Simulation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.stream.Stream;

@Component
@Slf4j
public class NewSimTasklet implements Tasklet {

    @Autowired
    private ProgressTracker tracker;

    @Autowired
    private CsvFileRepository csvFileRepository;


    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {

        JobExecution jobExecution = chunkContext.getStepContext().getStepExecution().getJobExecution();
        Long jobExecutionId = jobExecution.getId();
        JobParameters params = chunkContext.getStepContext().getStepExecution().getJobParameters();
        SimulationRequestDTO request = SimulationRequestDTO.fromJobParameters(params);
        Simulation simulation = new Simulation(request);

        try (BufferedWriter bw = new BufferedWriter(new FileWriter(Objects.requireNonNull(params.getString("outfile"))))) {
            simulation.run(bw);

            CsvFile savedFile = registerCsvFile(request.getName(), params.getString("outfile"));
        } catch (IOException ex) {
            System.err.println("ERROR WHILE WRITING TO FILE.");
            ex.printStackTrace();
        }


        return RepeatStatus.FINISHED;
    }
    private CsvFile registerCsvFile(String name, String filePath) {
        CsvFile file = new CsvFile();
        file.setName(name);
        file.setPath(filePath);
        file.setCreatedAt(LocalDateTime.now());
        file.setColumns(readCsvHeader(filePath));

        CsvFile savedFile = csvFileRepository.save(file);

        log.info("CsvFile saved in database with id: {}", savedFile.getId());

        return savedFile;
    }

    private String readCsvHeader(String filePath) {
        Path csvPath = Path.of(filePath);
        try (Stream<String> lines = Files.lines(csvPath)) {
            return lines.findFirst().orElse("");
        } catch (IOException e) {
            log.error("Errore nella lettura del file CSV: {}", e.getMessage(), e);
            throw new RuntimeException("Errore nella lettura del file CSV", e);
        }
    }


    /**
     * Generates the output file name based on the directory, simulation type, max simulation time, aggregation interval,
     * and a current timestamp. This helps uniquely identify each simulation result file.
     *
     * @param dir
     * @param simType
     * @param maxTime
     * @param numAggr
     * @return
     */
    private String buildOutFileName(String dir, String simType, int maxTime, int numAggr) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        return dir + simType + maxTime + "a" + numAggr + "_" + timestamp + ".tsv";
    }

    /**
     * Logs the simulation configuration parameters, including the number of runs, max simulation time, aggregation interval,
     * output file path, and simulation class name. Useful for debugging and audit purposes.
     *
     * @param numAggr
     * @param maxTime
     * @param numRuns
     * @param outFile
     * @param simParams
     */
    private void logSimConfiguration(int numAggr, int maxTime, int numRuns, String outFile, SimParams simParams) {
        log.info("Launching simulation:");
        log.info("numAggr: {}", numAggr);
        log.info("maxTime: {}", maxTime);
        log.info("numRuns: {}", numRuns);
        log.info("outFile: {}", outFile);
        log.info("simParams: {}", simParams.getClass().getSimpleName());
        log.info("Processing Simulation batch ");
    }

    /**
     * Runs the main simulation loop by performing steps at each aggregated time interval. It writes the results to the
     * output file and tracks progress, updating the execution context and an external tracker (if any).
     *
     * @param sRounds
     * @param numAggr
     * @param maxTime
     * @param outFile
     * @param jobExecutionId
     * @param chunkContext
     */
    private void runSimulationSteps(
            SimRoundResultsAggregated sRounds,
            int numAggr,
            int maxTime,
            String outFile,
            Long jobExecutionId,
            ChunkContext chunkContext
    ) {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(outFile))) {
            writeTSVHeader(bw);
            long time = System.currentTimeMillis();

            for (int i = 0; i < maxTime; i += numAggr) {
                if (i % (numAggr * 2000) == 0) {
                    System.out.println("Sim run at time " + i + "/" + maxTime + " in time " + (System.currentTimeMillis() - time) + " ms.");
                    time = System.currentTimeMillis();
                }

                sRounds.computeSimStepNoMasterFixedRandomAggregated(i);
                writeSimLine(bw, sRounds, i);

                double progress = ((i / (double) maxTime) * 100);
                updateProgressInContext(chunkContext, progress, jobExecutionId);
            }
        } catch (IOException ex) {
            System.err.println("ERROR WHILE WRITING TO FILE.");
            ex.printStackTrace();
        }
    }

    /**
     * Writes the header row of the TSV output file, describing each column (e.g., gas statistics and asset/creator
     * statistics). This ensures that the data file is structured and readable.
     *
     * @param bw
     * @throws IOException
     */
    private void writeTSVHeader(BufferedWriter bw) throws IOException {
        bw.write("time\tgasTotalMean\tgasTotalStd");
        bw.write("\tgasNewCreatorMean\tgasNewCreatorStd");
        bw.write("\tgasNewAssetMean\tgasNewAssetStd");
        bw.write("\tgasHolderPolicyUpdateMean\tgasHolderPolicyUpdateStd");
        bw.write("\tgasCharacteristicUpdateMean\tgasCharacteristicUpdateStd");
        bw.write("\tgasTransferMean\tgasTransferStd");
        bw.write("\tTotalNumCreators\tmaxCreators\tminCreators\tavgCreators\tstdCreators");
        bw.write("\tTotalNumAssets\tmaxAssets\tminAssets\tavgAssets\tstdAssets");
        bw.newLine();
    }

    /**
     * Writes a single line of simulation output for the current time step. It computes averages and standard deviations
     * for each gas metric and appends creator and asset statistics.
     *
     * @param bw
     * @param sRounds
     * @param timeStep
     * @throws IOException
     */
    private void writeSimLine(BufferedWriter bw, SimRoundResultsAggregated sRounds, int timeStep) throws IOException {
        double resultMean, resultStd;
        bw.write("" + timeStep);

        resultMean = SimRoundResults.computeAvg(sRounds.gasTotal);
        resultStd = SimRoundResults.computeStd(sRounds.gasTotal, resultMean);
        bw.write("\t" + resultMean + "\t" + resultStd);

        resultMean = SimRoundResults.computeAvg(sRounds.gasNewCreator);
        resultStd = SimRoundResults.computeStd(sRounds.gasNewCreator, resultMean);
        bw.write("\t" + resultMean + "\t" + resultStd);

        resultMean = SimRoundResults.computeAvg(sRounds.gasNewAsset);
        resultStd = SimRoundResults.computeStd(sRounds.gasNewAsset, resultMean);
        bw.write("\t" + resultMean + "\t" + resultStd);

        resultMean = SimRoundResults.computeAvg(sRounds.gasHolderPolicyUpdate);
        resultStd = SimRoundResults.computeStd(sRounds.gasHolderPolicyUpdate, resultMean);
        bw.write("\t" + resultMean + "\t" + resultStd);

        resultMean = SimRoundResults.computeAvg(sRounds.gasCharacteristicUpdate);
        resultStd = SimRoundResults.computeStd(sRounds.gasCharacteristicUpdate, resultMean);
        bw.write("\t" + resultMean + "\t" + resultStd);

        resultMean = SimRoundResults.computeAvg(sRounds.gasTransfer);
        resultStd = SimRoundResults.computeStd(sRounds.gasTransfer, resultMean);
        bw.write("\t" + resultMean + "\t" + resultStd);

        bw.write(sRounds.getTSVInfoCreatorsAssetsStats());
        bw.newLine();
    }

    /**
     * Updates the job execution context with the current progress percentage. This enables external components
     * (like listeners or a frontend) to track simulation progress in real time.
     *
     * @param chunkContext
     * @param progress
     * @param jobExecutionId
     */
    private void updateProgressInContext(ChunkContext chunkContext, double progress, Long jobExecutionId) {
        StepExecution stepExecution = chunkContext.getStepContext().getStepExecution();
        stepExecution.getExecutionContext().put("progress", progress);
        tracker.update(jobExecutionId, progress); // Presumo che 'tracker' sia un componente disponibile nel contesto
    }

    /**
     * Logs the end of the simulation, including the number of runs and the total simulated days. This provides a clear
     * marker in logs to indicate completion.
     *
     * @param numRuns
     * @param numAggr
     * @param maxTime
     */
    private void logSimulationEnd(int numRuns, int numAggr, int maxTime) {
        System.out.println("Ending sim of " + numRuns + " runs.");
        System.out.println("*** DONE SIM5Scaled AGGR (" + numAggr + " seconds) " + (maxTime / 86400) + " days ***");
    }
}




