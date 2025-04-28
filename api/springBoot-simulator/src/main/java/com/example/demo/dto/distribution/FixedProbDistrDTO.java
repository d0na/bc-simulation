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
    private int fixedTime;    // Fixed time used for the probability
    private int tolerance;    // Tolerable interval around the fixed time

    @Override
    public double getProb(int time) {
        // Calculate the distance from the fixed time
        int distance = Math.abs(time - fixedTime);

        // If the time is within the tolerance range
        if (distance <= tolerance) {
            // Generate a random value between 0 and 1 to vary the probability
            double randomFactor = Math.random(); // Random value between 0 and 1

            // Calculate the probability as a distribution that decreases with the distance,
            // while considering the random factor to introduce variability
            return (1.0 - ((double) distance / tolerance)) * randomFactor;
        } else {
            // If the time is outside the tolerance range, the probability is 0
            return 0.0;
        }
    }
}