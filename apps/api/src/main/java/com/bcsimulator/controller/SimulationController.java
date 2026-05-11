package com.bcsimulator.controller;

import com.bcsimulator.dto.AbstractDistributionDTO;
import com.bcsimulator.dto.EventDTO;
import com.bcsimulator.dto.JobStatusDTO;
import com.bcsimulator.dto.SimulationRequestDTO;
import com.bcsimulator.service.JobMonitoringService;
import com.bcsimulator.service.SimulationJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParametersInvalidException;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequiredArgsConstructor
public class SimulationController {

    private final JobMonitoringService jobMonitoringService;

    @Autowired
    private SimulationJobService simulationJobService;

    @GetMapping("/jobs/status")
    public ResponseEntity<List<JobStatusDTO>> getJobStatuses() {
        List<JobStatusDTO> statuses = jobMonitoringService.getJobStatuses();
        return ResponseEntity.ok(statuses); // restituisce 200 OK con il corpo JSON
    }


    @PostMapping("jobs/stop/{executionId}")
    public ResponseEntity<String> stopJob(@PathVariable Long executionId) {
        try {
            boolean stopResult = simulationJobService.stopJob(executionId); // Metodo built-in
            if (stopResult) {
                return ResponseEntity.ok("Job STOP requested for executionId: " + executionId);
            } else {
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error during stop job: " + e.getMessage());
        }
    }


    @GetMapping("jobs/completed")
    public ResponseEntity<List<JobExecution>> getCompletedJobs() {
        List<JobExecution> completedJobs = simulationJobService.getAllJobExecutions();
        return ResponseEntity.ok(completedJobs);
    }


    // Gestisce la creazione della simulazione (salvataggio di eventi)
    @PostMapping("/simulation/params")
    public ResponseEntity<?> receiveEvents(@RequestBody List<EventDTO> request) {
        return ResponseEntity.ok(request);
    }


    @PostMapping("/newsimulation")
    public ResponseEntity<?> runNewSimulation(@RequestBody SimulationRequestDTO request) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        System.out.println("[DEBUG] Received SimulationRequest:");
        System.out.println("  name: " + request.getName());
        System.out.println("  numRuns: " + request.getNumRuns());
        System.out.println("  maxTime: " + request.getMaxTime());
        System.out.println("  events:");

        for (EventDTO event : request.getEvents()) {
            System.out.printf("    Event: %s%n", event.getEventName());
            System.out.println("    Description: " + event.getDescription());
            System.out.println("    InstanceOf: " + event.getInstanceOf());
            if (event.getDependencies() != null && !event.getDependencies().isEmpty()) {
                System.out.println("    Dependencies:");
                event.getDependencies().forEach(dep -> {
                    System.out.println("      DependOn: " + dep.getDependOn());
                    System.out.println("      MaxProbabilityMatches: " + dep.getMaxProbabilityMatches());
                    AbstractDistributionDTO dist = dep.getProbabilityDistribution();
                    System.out.println("      Distribution:");
                    System.out.println("        Type: " + dist.getType());
                    System.out.println("        Full: " + dist);
                });
            } else {
                System.out.println("    No dependencies");
            }
            System.out.println("    GasCost: " + event.getGasCost());
        }
        try {
            System.out.println("Events: " + request.getEvents()); // <-- per debug
            Map<String, Object> response = simulationJobService.runSimulation(request);
            System.out.println("Response: " + response); // <-- per debug
            return ResponseEntity.accepted().body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error occurred during simulation");
        }
    }
}