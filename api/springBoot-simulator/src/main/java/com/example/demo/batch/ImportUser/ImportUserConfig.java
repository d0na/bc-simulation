package com.example.demo.batch.ImportUser;

import com.example.demo.listner.JobCompletionNotificationListener;
import com.example.demo.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.launch.support.RunIdIncrementer;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.database.BeanPropertyItemSqlParameterSourceProvider;
import org.springframework.batch.item.database.JdbcBatchItemWriter;
import org.springframework.batch.item.database.builder.JdbcBatchItemWriterBuilder;
import org.springframework.batch.item.file.FlatFileItemReader;
import org.springframework.batch.item.file.builder.FlatFileItemReaderBuilder;
import org.springframework.batch.item.file.mapping.BeanWrapperFieldSetMapper;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.context.annotation.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.batch.core.Step;

import javax.sql.DataSource;

@Configuration("importUserConfig")
@RequiredArgsConstructor
@Slf4j
public class ImportUserConfig {

    private final DataSource dataSource;

    @Bean
    public FlatFileItemReader<User> reader() {
        return new FlatFileItemReaderBuilder<User>()
                .name("userItemReader")
                .resource(new ClassPathResource("users.csv"))
                .delimited()
                .names("name", "email")
                .fieldSetMapper(new BeanWrapperFieldSetMapper<>() {{
                    setTargetType(User.class);
                }})
                .build();
    }

    @Bean
    public JdbcBatchItemWriter<User> writer() {
        return new JdbcBatchItemWriterBuilder<User>()
                .itemSqlParameterSourceProvider(new BeanPropertyItemSqlParameterSourceProvider<>())
                .sql("INSERT INTO users (name, email) VALUES (:name, :email)")
                .dataSource(dataSource)
                .build();
    }

    @Bean("importUserJob")
    public Job importUserJob(JobRepository jobRepository, Step step1, JobCompletionNotificationListener listener) {
        return new JobBuilder("importUserJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .listener(listener)
                .start(step1)
                .build();
    }

    @Bean
    public Step step1(JobRepository jobRepository, PlatformTransactionManager transactionManager, ImportUserProcessor processor) {
        return new StepBuilder("step1", jobRepository)
                .<User, User>chunk(10, transactionManager)
                .reader(reader())
                .processor(processor)
                .writer(writer())
                .build();
    }

    @Bean
    public Step stepHallo(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("stepHallo", jobRepository).tasklet((contribution, chunkContext) -> {
            System.out.println("Hello world!");
            return RepeatStatus.FINISHED;
        }, transactionManager).build();
    }

    @Bean
    public Job jobHallo(JobRepository jobRepository, Step stepHallo) {
        return new JobBuilder("jobHallo", jobRepository).start(stepHallo).build();
    }

    @Bean
    public Job jobSimulation(JobRepository jobRepository, Step stepSimulation) {
        return new JobBuilder("jobSimulation", jobRepository).start(stepSimulation).build();
    }

    @Bean
    public Step stepSimulation(JobRepository jobRepository, PlatformTransactionManager transactionManager, SimRevTasklet simTasklet) {
        log.info("step simultaion call");
        return new StepBuilder("stepSimulation", jobRepository)
//                .<User, User>chunk(10, transactionManager)
                .tasklet(simTasklet, transactionManager)
                .build();
    }
}

