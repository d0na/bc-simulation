package com.example.demo.controller;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


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
    public String getJobStatuses() {
        jobMonitoringService.printJobStatuses();
        return "Stato dei job stampato su console!";
    }

    @GetMapping("/jobs/hallo")
    public String getHallo() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        jobLauncher.run(jobHallo, new JobParametersBuilder()
                .toJobParameters());
        return "Lanciato il job Hello World!";
    }

    @GetMapping("/jobs/import-user")
    public String getImportUser() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        jobLauncher.run(importUserJob, new JobParametersBuilder()
                .toJobParameters());
        return "Lanciato il job Import User!";
    }

    @GetMapping("/jobs/simulation")
    public String getSimulation() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        jobLauncher.run(jobSimulation, new JobParametersBuilder()
                .toJobParameters());
        return "Lanciato il job Import User!";
    }
}