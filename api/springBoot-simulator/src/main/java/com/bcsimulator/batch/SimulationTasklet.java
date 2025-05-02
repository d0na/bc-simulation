package com.bcsimulator.batch;

import com.bcsimulator.model.CsvFile;
import com.bcsimulator.service.ProgressTracker;
import com.bcsimulator.dto.SimulationRequestDTO;
import com.bcsimulator.repository.CsvFileRepository;
import com.bcsimulator.simulator.ResultsAggregated;
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
import java.util.Objects;
import java.util.stream.Stream;

@Component
@Slf4j
public class SimulationTasklet implements Tasklet {

    @Autowired
    private ProgressTracker tracker;

    @Autowired
    private CsvFileRepository csvFileRepository;


    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        long time = System.currentTimeMillis();
        String separator = "\t";

        JobExecution jobExecution = chunkContext.getStepContext().getStepExecution().getJobExecution();
        Long jobExecutionId = jobExecution.getId();
        JobParameters params = chunkContext.getStepContext().getStepExecution().getJobParameters();
        SimulationRequestDTO simParams = SimulationRequestDTO.fromJobParameters(params);
        ResultsAggregated resultsAggregated = new ResultsAggregated(simParams);

        try (BufferedWriter bw = new BufferedWriter(new FileWriter(Objects.requireNonNull(params.getString("outfile"))))) {

            for (int t = 0; t < simParams.getMaxTime(); t = t + simParams.getNumAggr()) {

                // Only print every 2000 steps for log reasons and update time every 2000 steps per aggregation
                if (t % (simParams.getNumAggr() * 2000) == 0) {
                    log.info("Sim run at time " + t + "/" + simParams.getMaxTime() + " in time " + (System.currentTimeMillis() - time) + " ms.");
                    time = System.currentTimeMillis();
                }

                // Run the simulation step
                resultsAggregated.compute(t);
                String s = resultsAggregated.generateCSVComputationStats(separator);
                bw.write(t + separator + s);
                bw.newLine();
                double progress = ((t / (double) simParams.getMaxTime()) * 100);
                updateProgressInContext(chunkContext, progress, jobExecutionId);
            }
            log.info("Ending sim of " + simParams.getNumRuns() + " runs.");
            CsvFile savedFile = registerCsvFile(simParams.getName(), params.getString("outfile"));
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
            log.error("Error reading CSV file: {}", e.getMessage(), e);
            throw new RuntimeException("Error reading CSV file", e);
        }
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


}




