package com.bcsimulator.dto.distribution;

import com.bcsimulator.dto.AbstractDistributionDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
/**
 * Represents a constant probability value, independent of simulation time.
 *
 * This class is typically used when an event has a fixed occurrence probability
 * that does not depend on when it is evaluated.
 *
 *
 *
 * Prposed name ConstantValueDistributionDTO
 */
public class UniformDistributionDTO extends AbstractDistributionDTO {
    /** Constant probability value to be returned at any time. */
    private double value;

    /**
     * Returns the constant probability value, ignoring the given time.
     *
     * @param time the discrete time step in the simulation (ignored)
     * @return the constant probability value
     */
    @Override
    public double getProb(int time){
        return this.getValue();
    }
}