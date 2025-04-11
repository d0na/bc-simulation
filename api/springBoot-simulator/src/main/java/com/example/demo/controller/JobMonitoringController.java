package com.example.demo.controller;

import com.example.demo.dto.JobStatusDTO;
import com.example.demo.service.JobMonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.JobParametersInvalidException;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequiredArgsConstructor
public class JobMonitoringController {

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

    @GetMapping("/jobs/status")
    public ResponseEntity<List<JobStatusDTO>> getJobStatuses() {
        List<JobStatusDTO> statuses = jobMonitoringService.getJobStatuses();
        return ResponseEntity.ok(statuses); // restituisce 200 OK con il corpo JSON
    }

    @PostMapping("/jobs/hallo")
    public String postHallo() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        jobLauncher.run(jobHallo, new JobParametersBuilder()
                .toJobParameters());
        return "Lanciato il job Hello World!";
    }

    @PostMapping("/jobs/import-user")
    public String postImportUser() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        jobLauncher.run(importUserJob, new JobParametersBuilder()
                .toJobParameters());
        return "Lanciato il job Import User!";
    }

    @PostMapping("/jobs/simulation")
    public String postSimulation() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        jobLauncher.run(jobSimulation, new JobParametersBuilder()
                .toJobParameters());
        return "Lanciato il job Import User!";
    }
}