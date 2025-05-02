package com.bcsimulator.service;

import com.bcsimulator.dto.SimulationRequestDTO;
import org.springframework.batch.core.*;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private JobExplorer jobExplorer;

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


    public Map<String, Object> runSimulation(SimulationRequestDTO request) throws Exception {

        // Params retrieval from request
        JobParameters jobParameters = request.toJobParameters();

        // Job parameters
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
        response.put("numAggr", request.getNumAggr());
        response.put("maxTime", request.getMaxTime());
        response.put("numRuns",request.getNumRuns());
        response.put("outFile", jobParameters.getString("outfile"));
        response.put("configuration", request);

        return response;
    }

}