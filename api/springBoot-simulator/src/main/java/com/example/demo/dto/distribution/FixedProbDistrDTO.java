package com.example.demo.dto.distribution;

import com.example.demo.dto.AbstractDistributionDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * @author francesco
 * @project springBoot-simulator
 */
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FixedProbDistrDTO extends AbstractDistributionDTO {
    int fixedTime;    // Fixed time used for the probability
    int tolerance;    // Tolerable interval around the fixed time

    @Override
    public double getProb(int time) {
        return (Math.abs(time - fixedTime) <= 1) ? 1.0 : 0.0;
    }
}