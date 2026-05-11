package com.bcsimulator.service;

import com.bcsimulator.dto.JobStatusDTO;
import com.bcsimulator.dto.StepStatusDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.*;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobMonitoringService {

    private final JobExplorer jobExplorer;
    @Autowired
    private ProgressTracker tracker;
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

    public List<JobStatusDTO> getJobStatuses() {
        List<JobStatusDTO> jobStatusList = new ArrayList<>();

        for (String jobName : jobExplorer.getJobNames()) {
            List<JobInstance> instances = jobExplorer.getJobInstances(jobName, 0, 10);
            for (JobInstance instance : instances) {
                List<JobExecution> executions = jobExplorer.getJobExecutions(instance);
                for (JobExecution execution : executions) {
                    List<StepStatusDTO> stepStatuses = new ArrayList<>();
                    double jobProgress = tracker.getProgress(execution.getJobId());

                    for (StepExecution step : execution.getStepExecutions()) {
                        // Prova a leggere il progress dal contesto di esecuzione dello step
                        Object progressObj = step.getExecutionContext().get("progress");

                        double stepProgress = 0;
                        if (progressObj instanceof Double) {
                            stepProgress = (Double) progressObj;
                        } else if (progressObj instanceof String) {
                            try {
                                stepProgress = Double.parseDouble((String) progressObj);
                            } catch (NumberFormatException e) {
                                stepProgress = 0;
                            }
                        }

                        // Prendiamo il massimo valore di progress tra gli step
                        if (stepProgress > jobProgress) {
                            jobProgress = stepProgress;
                        }

                        // Aggiungiamo comunque gli step, anche se il progress non è usato direttamente
                        stepStatuses.add(new StepStatusDTO(
                                step.getStepName(),
                                step.getStatus().toString(),
                                stepProgress
                        ));
                    }

                    JobStatusDTO dto = new JobStatusDTO(
                            jobName,
                            instance.getInstanceId(),
                            execution.getId(),
                            execution.getStartTime(),
                            execution.getEndTime(),
                            execution.getStatus().toString(),
                            execution.getExitStatus().getExitCode(),
                            stepStatuses,
                            jobProgress // <-- qui il vero avanzamento da mostrare
                    );

                    jobStatusList.add(dto);
                }
            }
        }

        return jobStatusList;
    }
    }
