package com.example.demo.batch.simulation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.PlatformTransactionManager;

@EnableAsync
@Configuration("importUserConfig")
@RequiredArgsConstructor
@Slf4j
public class SimulationConfig {

    @Bean
    public Job jobSimulation(JobRepository jobRepository, Step stepSimulation) {
        return new JobBuilder("jobSimulation", jobRepository).start(stepSimulation).build();
    }

    @Bean
    public Job jobNewSimulation(JobRepository jobRepository, Step stepNewSimulation) {
        return new JobBuilder("jobNewSimulation", jobRepository).start(stepNewSimulation).build();
    }

    @Bean
    public Step stepNewSimulation(JobRepository jobRepository, PlatformTransactionManager transactionManager, SimulationTasklet newSimTasklet) {
        log.info("step simulation call");
        return new StepBuilder("newSimulation", jobRepository)
//                .<User, User>chunk(10, transactionManager)
                .tasklet(newSimTasklet, transactionManager)
                .build();
    }
}

