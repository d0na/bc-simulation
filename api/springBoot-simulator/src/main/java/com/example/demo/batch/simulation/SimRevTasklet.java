package com.example.demo.batch.simulation;

import com.example.demo.nmtsimulation.roundResults.SimRoundResults;
import com.example.demo.nmtsimulation.roundResults.SimRoundResultsAggregated;
import com.example.demo.nmtsimulation.simParam.SimParams;
import com.example.demo.nmtsimulation.simParam.SimParams5Scaled;
import com.example.demo.nmtsimulation.simParam.SimParams6Scaled;
import com.example.demo.service.ProgressTracker;
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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

@Component
@Slf4j
public class SimRevTasklet implements Tasklet {

    @Autowired
    private ProgressTracker tracker;

    String dir = "./";

    private SimParams getSimParams(String simType) {
        return switch (simType) {
            case "SimParams5Scaled" -> new SimParams5Scaled();
            case "SimParams6Scaled" -> new SimParams6Scaled();
            // adds other types here if necessary
            default -> throw new IllegalArgumentException("Tipo di simulazione non valido: " + simType);
        };
    }

    /**
     * Executes a simulation batch step as part of a Spring Batch job.
     *
     * This method initializes simulation parameters from job parameters,
     * prepares the output file, and iteratively performs simulation steps
     * in fixed aggregation intervals. At each step, gas and entity statistics
     * are computed and written to a TSV file. The progress is updated
     * and stored in the execution context for tracking.
     *
     * The logic is divided into helper methods to enhance readability
     * and maintainability:
     * - buildOutFileName: generates the simulation result filename
     * - logSimConfiguration: logs simulation setup details
     * - runSimulationSteps: performs the simulation loop and data writing
     * - logSimulationEnd: logs completion information
     *
     * @param contribution the contribution to a step's execution
     * @param chunkContext the context of the chunk being processed
     * @return RepeatStatus.FINISHED when the step is complete
     * @throws Exception if any error occurs during execution
     */
    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        JobExecution jobExecution = chunkContext.getStepContext().getStepExecution().getJobExecution();
        Long jobExecutionId = jobExecution.getId();
        JobParameters params = chunkContext.getStepContext().getStepExecution().getJobParameters();

        int _numAggr = params.getLong("numAggr").intValue();
        int _maxTime = params.getLong("maxTime").intValue();
        int _numRuns = params.getLong("numRuns").intValue();
        String _dir = params.getString("dir");
        String _simType = params.getString("simType");
        SimParams _simToRun = getSimParams(_simType);

        String _outFile = buildOutFileName(_dir, _simType, _maxTime, _numAggr);

        logSimConfiguration(_numAggr, _maxTime, _numRuns, _outFile, _simToRun);

        SimRoundResultsAggregated sRounds = new SimRoundResultsAggregated(_numRuns, _simToRun, _numAggr);
        runSimulationSteps(sRounds, _numAggr, _maxTime, _outFile, jobExecutionId, chunkContext);

        logSimulationEnd(_numRuns, _numAggr, _maxTime);

        return RepeatStatus.FINISHED;
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
                System.out.println("count:"+sRounds.count);
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




