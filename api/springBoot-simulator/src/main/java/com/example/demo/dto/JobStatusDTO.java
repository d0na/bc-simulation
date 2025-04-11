package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * @author francesco
 * @project springBoot-simulator
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobStatusDTO {
    private String jobName;
    private Long jobInstanceId;
    private Long jobExecutionId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String exitStatus;
    private List<StepStatusDTO> steps;
    private double progress;
}