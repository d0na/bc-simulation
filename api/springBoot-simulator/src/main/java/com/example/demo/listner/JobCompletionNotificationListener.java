package com.example.demo.listner;

import org.springframework.batch.core.*;
import org.springframework.batch.core.listener.JobExecutionListenerSupport;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
public class JobCompletionNotificationListener extends JobExecutionListenerSupport {

    @Override
    public void beforeJob(JobExecution jobExecution) {
        System.out.println("🔄 Job iniziato: " + jobExecution.getJobInstance().getJobName());
    }

    @Override
    public void afterJob(JobExecution jobExecution) {
        if (jobExecution.getStatus() == BatchStatus.COMPLETED) {
            LocalDateTime start = jobExecution.getStartTime();
            LocalDateTime end = jobExecution.getEndTime();
            Duration duration = Duration.between(start, end);
            System.out.println("✅ Job completato in " + duration.getSeconds()  + " secondi.");
        } else {
            System.out.println("❌ Job fallito con stato: " + jobExecution.getStatus());
        }
    }
}
