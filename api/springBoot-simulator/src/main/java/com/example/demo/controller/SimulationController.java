package com.example.demo.controller;

import com.example.demo.dto.EventDTO;
import com.example.demo.dto.JobStatusDTO;
import com.example.demo.dto.SimTaskletJobRequestDTO;
import com.example.demo.service.JobMonitoringService;
import com.example.demo.service.SimulationJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.JobParametersInvalidException;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
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
    private JobLauncher jobLauncher;

    @Autowired
    @Qualifier("importUserJob")
    private Job importUserJob;

    @Autowired
    @Qualifier("jobHallo")
    private Job jobHallo;

    @Autowired
    @Qualifier("jobSimulation")
    private Job jobSimulation;

    @Autowired
    private SimulationJobService simulationJobService;

    @GetMapping("/jobs/status")
    public ResponseEntity<List<JobStatusDTO>> getJobStatuses() {
        List<JobStatusDTO> statuses = jobMonitoringService.getJobStatuses();
        return ResponseEntity.ok(statuses); // restituisce 200 OK con il corpo JSON
    }

    @PostMapping("/jobs/hallo")
    public String postHallo() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        jobLauncher.run(jobHallo, new JobParametersBuilder().toJobParameters());
        return "Lanciato il job Hello World!";
    }

    @PostMapping("/jobs/import-user")
    public String postImportUser() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        jobLauncher.run(importUserJob, new JobParametersBuilder().toJobParameters());
        return "Lanciato il job Import User!";
    }

    @PostMapping("/jobs/simulation")
    public String postSimulation() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        jobLauncher.run(jobSimulation, new JobParametersBuilder().toJobParameters());
        return "Lanciato il job Import User!";
    }

    @PostMapping("/simulate-rev")
    public ResponseEntity<?> runSimulation(@RequestBody SimTaskletJobRequestDTO request) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {

        try {
            Map<String, Object> response = simulationJobService.runSimulation(request);
            return ResponseEntity.accepted().body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error occurred during simulation");
        }
    }


    @PostMapping("jobs/stop/{executionId}")
    public ResponseEntity<String> stopJob(@PathVariable Long executionId) {
        try {
            boolean stopResult = simulationJobService.stopJob(executionId); // Metodo built-in
            if (stopResult) {
                return ResponseEntity.ok("Job STOP richiesto per executionId: " + executionId);
            } else {
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Errore durante lo stop del job: " + e.getMessage());
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

    // Gestisce l'ottenimento degli eventi di simulazione
//    @GetMapping("/simulation/events")
//    public ResponseEntity<List<EventDTO>> getSimulationEvents() {
//        // In un caso reale, questi eventi verrebbero recuperati dal database o da un altro servizio
//        List<EventDTO> events = List.of(
//                new EventDTO("GASnewAssetsCreation", DistributionType.NORMAL, Map.of("mean", 100, "stdDev", 10, "scale", 0.04, "shape", 4), 1025897L),
//                new EventDTO("PROBnewCreatorCreation", DistributionType.UNIFORM, Map.of("probability", 0.0001), null)
//        );
//
//        return ResponseEntity.ok(events);
//    }
}