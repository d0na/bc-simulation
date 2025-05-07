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
 * La probabilità che una variabile casuale assuma un qualsiasi valore all’interno di un intervallo è costante.
 * Questo tipo di distribuzione è utile per simulare variabili casuali che non hanno una distribuzione normale.
 * Esempio:
 * Se un evento può avvenire in qualsiasi momento tra 0 e 10 secondi, e la probabilità di accadimento è costante in quell’intervallo → stiamo parlando di distribuzione uniforme.
 *
 * Lo scalingFactor?
 * È un moltiplicatore che trasforma il valore time in un valore reale continuo.
 *
 * Esempio:
 * Se il tuo simulatore lavora a passi di 1 blocco, ma vuoi che ogni blocco valga 0.5 secondi, allora scalingFactor = 0.5
 *
 * Così se time = 4 blocchi → realTime = 2 secondi
 *
 * La UniformProbDistrDTO rappresenta una funzione di densità di probabilità uniforme continua su [min, max], e restituisce:
 *
 * 0 fuori dall’intervallo
 *
 * costante all’interno
 */


/**
 * Represents a continuous uniform probability distribution over a specified time interval.
 * The probability density is constant between [min, max] and zero outside this range.
 *
 * This class is typically used to model events that can occur with equal likelihood
 * within a certain time window in a simulation.
 */
public class UniformContinuousProbDistrScaledDTO extends AbstractDistributionDTO {
    /** The lower bound of the time interval. */
    double min;

    /** The upper bound of the time interval. */
    double max;

    /** Scaling factor to convert discrete time steps into real-time values. */
    double scalingFactor;

    /**
     * Returns the probability density at the given simulation time.
     *
     * @param time the discrete time step in the simulation
     * @return the probability density value at the given time
     */
    @Override
    public double getProb(int time) {
        double realTime = time * scalingFactor;
        if (realTime < min || realTime > max)
            return 0;
        return 1.0 / (max - min);
    }
}
