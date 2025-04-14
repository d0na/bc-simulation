package com.example.demo.service;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @author francesco
 * @project springBoot-simulator
 */
@Component
public class ProgressTracker {

    private final Map<Long, Double> progressMap = new ConcurrentHashMap<>();

    public void update(Long jobId, Double progress) {
        progressMap.put(jobId, progress);
    }

    public Double getProgress(Long jobId) {
        return progressMap.getOrDefault(jobId, 0.0);
    }

    public void clear(Long jobId) {
        progressMap.remove(jobId);
    }
}
