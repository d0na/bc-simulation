package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.*;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobMonitoringService {

    private final JobExplorer jobExplorer;

    public void printJobStatuses() {
        List<String> jobNames = jobExplorer.getJobNames();

        for (String jobName : jobNames) {
            List<JobInstance> instances = jobExplorer.getJobInstances(jobName, 0, 10);
            for (JobInstance instance : instances) {
                List<JobExecution> executions = jobExplorer.getJobExecutions(instance);
                for (JobExecution execution : executions) {
                    System.out.println("Job Name: " + jobName);
                    System.out.println("Job Instance ID: " + instance.getInstanceId());
                    System.out.println("Job Execution ID: " + execution.getId());
                    System.out.println("Start Time: " + execution.getStartTime());
                    System.out.println("End Time: " + execution.getEndTime());
                    System.out.println("Status: " + execution.getStatus());
                    System.out.println("Exit Status: " + execution.getExitStatus().getExitCode());
                    System.out.println("Steps:");
                    for (StepExecution step : execution.getStepExecutions()) {
                        System.out.println(" - " + step.getStepName() + ": " + step.getStatus());
                    }
                    System.out.println("-----------");
                }
            }
        }
    }
}