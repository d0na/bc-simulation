package com.bcsimulator.service;

import com.bcsimulator.dto.SimTaskletJobRequestDTO;
import com.bcsimulator.dto.SimulationRequestDTO;
import com.bcsimulator.nmtsimulation.helper.AggregationGranularity;
import com.bcsimulator.nmtsimulation.helper.SimulationDuration;
import com.bcsimulator.nmtsimulation.simParam.SimParams;
import com.bcsimulator.nmtsimulation.simParam.SimParams5Scaled;
import com.bcsimulator.nmtsimulation.simParam.SimParams6Scaled;
import org.springframework.batch.core.*;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * @author francesco
 * @project springBoot-simulator
 */
@Service
public class SimulationJobService {

    @Autowired
    private JobLauncher jobLauncher;

    @Autowired
    private Job jobSimulation;
    @Autowired
    private Job jobNewSimulation;

    @Autowired
    private JobExplorer jobExplorer;  // Per esplorare i job eseguiti

    @Autowired
    private JobOperator jobOperator;

    public boolean stopJob(Long executionId) {
        try {
            JobExecution jobExecution = jobExplorer.getJobExecution(executionId);

            if (jobExecution.getStatus() == BatchStatus.STARTED) {
                System.out.println("Job with ID " + executionId + " has been stopped.");
                return jobOperator.stop(executionId);
            } else {
                System.out.println("Job with ID " + executionId + " is not running.");
                return false;
            }
        } catch (Exception e) {
            System.err.println("Error stopping job with ID " + executionId);
            e.printStackTrace();
            return false;
        }
    }

    public Map<String, Object> runSimulation(SimTaskletJobRequestDTO request) throws Exception {
        // Fall-back ai valori di default se null o 0
        int numAggr = (request.getNumAggr() != null && request.getNumAggr() > 0)
                ? request.getNumAggr()
                : AggregationGranularity.MINUTES.getSeconds();

        int maxTime = (request.getMaxTime() != null && request.getMaxTime() > 0)
                ? request.getMaxTime()
                : SimulationDuration.TWO_WEEKS.getSeconds();

        int numRuns = (request.getNumRuns() != null && request.getNumRuns() > 0)
                ? request.getNumRuns()
                : 10;

        String dir = (request.getDir() != null && !request.getDir().isEmpty()) ? request.getDir() : "./";

        // Crea la directory se non esiste
        File outputDir = new File(dir);
        if (!outputDir.exists()) {
            boolean created = outputDir.mkdirs(); // Crea la directory (e le eventuali sottodirectory)
            if (created) {
                System.out.println("Directory created: " + dir);
            } else {
                System.err.println("Directory creation failed: " + dir);
            }
        }

        String outFile = dir + "simResultsTest5Scaledt" + maxTime + "a" + numAggr + ".tsv";

        // Tipo di simulazione dinamico
        SimParams simParams = switch (request.getSimType()) {
            case "SimParams5Scaled" -> new SimParams5Scaled();
            case "SimParams6Scaled" -> new SimParams6Scaled();
            // aggiungi altro tipo se necessario
            default -> new SimParams5Scaled(); // fallback
        };

        // Crea i parametri del job usando i valori ricevuti dal DTO
        JobParameters jobParameters = new JobParametersBuilder()
                .addLong("timestamp", System.currentTimeMillis(), true) // per unicità job
                .addLong("numAggr", (long) numAggr)
                .addLong("maxTime", (long) maxTime)
                .addLong("numRuns", (long) numRuns)
                .addString("dir", dir)
                .addString("simType", request.getSimType())
                .addString("uuid", UUID.randomUUID().toString())
                .toJobParameters();

        CompletableFuture.runAsync(() -> {
            try {
                jobLauncher.run(jobSimulation, jobParameters);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        // Puoi eventualmente restituire l'output come risultato del metodo
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Launching simulation");
        response.put("numAggr", numAggr);
        response.put("maxTime", maxTime);
        response.put("numRuns", numRuns);
        response.put("outFile", outFile);
        response.put("simParams", simParams.getClass().getSimpleName());

        return response;
    }


    // Metodo per ottenere i job completati
    public List<JobExecution> getAllJobExecutions() {
        List<String> jobNames = jobExplorer.getJobNames();
        List<JobExecution> allExecutions = new ArrayList<>();

        for (String jobName : jobNames) {
            List<JobInstance> jobInstances = jobExplorer.getJobInstances(jobName, 0, Integer.MAX_VALUE);
            for (JobInstance jobInstance : jobInstances) {
                allExecutions.addAll(jobExplorer.getJobExecutions(jobInstance));
            }
        }

        return allExecutions;
    }


    public Map<String, Object> runNewSimulation(SimulationRequestDTO request) throws Exception {

        // Params retrieval from request
        JobParameters jobParameters = request.toJobParameters();

        // Job parameters
        CompletableFuture.runAsync(() -> {
            try {
                jobLauncher.run(jobNewSimulation, jobParameters);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        // Puoi eventualmente restituire l'output come risultato del metodo
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Launching simulation");
        response.put("numAggr", request.getNumAggr());
        response.put("maxTime", request.getMaxTime());
        response.put("numRuns",request.getNumRuns());
        response.put("outFile", jobParameters.getString("outfile"));
        response.put("configuration", request);

        return response;
    }

}