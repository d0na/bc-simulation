package com.bcsimulator.dto.distribution;

import com.bcsimulator.dto.AbstractDistributionDTO;
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
public class BassProbDistrDTO extends AbstractDistributionDTO {
    double p;
    double q;
    double scalingFactor;

    @Override
    public double getProb(int time) {
        double t = time * scalingFactor;
        double expTerm = Math.exp(-(p + q) * t);
        double numerator = (p + q) * (p / (p + q)) * expTerm;
        double denominator = Math.pow(1 + (q / p) * expTerm, 2);
        return numerator / denominator;
    }
}