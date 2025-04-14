package com.example.demo.batch.ImportUser;

import com.example.demo.listner.JobCompletionNotificationListener;
import com.example.demo.model.User;
import com.example.demo.nmtsimulation.SimRoundResults;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.configuration.annotation.StepBuilderFactory;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.launch.support.RunIdIncrementer;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.ItemWriter;
import org.springframework.batch.item.database.BeanPropertyItemSqlParameterSourceProvider;
import org.springframework.batch.item.database.JdbcBatchItemWriter;
import org.springframework.batch.item.database.builder.JdbcBatchItemWriterBuilder;
import org.springframework.batch.item.file.FlatFileItemReader;
import org.springframework.batch.item.file.FlatFileItemWriter;
import org.springframework.batch.item.file.builder.FlatFileItemReaderBuilder;
import org.springframework.batch.item.file.mapping.BeanWrapperFieldSetMapper;
import org.springframework.batch.item.file.transform.BeanWrapperFieldExtractor;
import org.springframework.batch.item.file.transform.DelimitedLineAggregator;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.context.annotation.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.batch.core.Step;

import javax.sql.DataSource;

@Configuration("importUserConfig")
@RequiredArgsConstructor
@Slf4j
public class ImportUserConfig {

    private final DataSource dataSource;

    //*** Import USER **/

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


    //*** Batch for HALLO **/


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

    //*** Batch for SImulation with Tasklet **/

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

    //*** Batch for SImulation with Proccesor **/


//    @Bean
//    public FlatFileItemReader<User> simReader() {
//        return new FlatFileItemReaderBuilder<User>()
//                .name("simReader")
//                .resource(new ClassPathResource("users.csv"))
//                .delimited()
//                .names("name", "email")
//                .fieldSetMapper(new BeanWrapperFieldSetMapper<>() {{
//                    setTargetType(User.class);
//                }})
//                .build();
//    }
//
//    @Bean
//    public Step writeStep(StepBuilderFactory stepBuilderFactory, ItemReader<SimRoundResults> reader, ItemWriter<SimRoundResults> writer) {
//        return stepBuilderFactory.get("writeStep")
//                .<SimRoundResults, SimRoundResults>chunk(1) // Elaboriamo un record alla volta
//                .reader(reader)  // Usa un reader che fornisce SimRoundResults
//                .writer(writer)  // Usa il writer per scrivere SimRoundResults in CSV
//                .build();
//    }
//
//    @Bean
//    public ItemWriter<SimRoundResults> csvFileWriter() {
//        FlatFileItemWriter<SimRoundResults> writer = new FlatFileItemWriter<>();
//
//        // Definisce il percorso del file di output CSV
//        writer.setResource(new FileSystemResource("output_simulation_results.csv"));
//
//        // Definisce l'aggregatore per il formato CSV
//        DelimitedLineAggregator<SimRoundResults> aggregator = new DelimitedLineAggregator<>();
//        aggregator.setDelimiter(","); // Usa la virgola come delimitatore
//
//        // Estrae i dati necessari dal SimRoundResults
//        BeanWrapperFieldExtractor<SimRoundResults> fieldExtractor = new BeanWrapperFieldExtractor<>();
//
//        // Aggiungiamo i metodi della classe SimRoundResults che vogliamo scrivere nel CSV
//        fieldExtractor.setNames(new String[] {
//                "numCreators", "maxCreators", "minCreators", "avgCreators", "stdCreators",
//                "numAssets", "maxAssets", "minAssets", "avgAssets", "stdAssets"
//        });
//
//        aggregator.setFieldExtractor(fieldExtractor);
//        writer.setLineAggregator(aggregator);
//
//        return writer;
//    }
}

