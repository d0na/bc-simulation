package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author francesco
 * @project springBoot-simulator
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class StepStatusDTO {
    private String stepName;
    private String stepStatus;
    private double progress;
}