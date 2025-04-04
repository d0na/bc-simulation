package com.example.demo.controller;

import com.example.demo.service.JobMonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
public class JobMonitoringController {

    private final JobMonitoringService jobMonitoringService;

    @GetMapping("/jobs/status")
    public String getJobStatuses() {
        jobMonitoringService.printJobStatuses();
        return "Stato dei job stampato su console!";
    }
}