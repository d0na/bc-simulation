package com.example.demo;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.explore.support.JobExplorerFactoryBean;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@SpringBootApplication
public class DemoApplication implements CommandLineRunner {

    @Autowired
    private JobLauncher jobLauncher;

    @Autowired
    private Job importUserJob;

//    @Bean
//    public JobExplorer jobExplorer(DataSource dataSource) throws Exception {
//        JobExplorerFactoryBean factoryBean = new JobExplorerFactoryBean();
//        factoryBean.setDataSource(dataSource);
//        factoryBean.setJdbcOperations(new JdbcTemplate(dataSource));
//        factoryBean.afterPropertiesSet();
//        return factoryBean.getObject();
//    }

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        jobLauncher.run(importUserJob, new JobParametersBuilder()
                .addLong("time", System.currentTimeMillis())
                .toJobParameters());
    }
}
