package com.bcsimulator.dto.distribution;

import com.bcsimulator.dto.AbstractDistributionDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Returns the
 *
 *
 * returns a discrete probability of having k events in a certain time interval,
 * we assume that time represents k and lambda is the parameter of the distribution.
 *
 *È una distribuzione che descrive il numero di eventi che accadono in un intervallo di tempo o spazio, dato un certo tasso medio (lambda).
 * Nel nostro caso: in media 5 CreateKitty ogni 100 blocchi.
 *
 * Se vuoi calcolare se l'evento avviene o no in un blocco:
 *
 * Calcola il numero medio di eventi per blocco (lambdaPerBlocco = totaleEventiAttesi / numBlocchi)
 *
 * Poi per ogni blocco generi il numero di eventi con Poisson(lambdaPerBlocco)
 *
 * Se il valore ≥ 1, allora l'evento
 *
 *
 * Es: 10 eventi in 86400 blcocchi
 * lambda = 10 / 86400 → media di eventi per blocco = 10/86400 = 0.00117283
 * scaling = 1 .
 */
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PoissonProbDistrDTO extends AbstractDistributionDTO {
    double lambda;
    double scalingFactor;

    @Override
    public double getProb(int time) {
        double realK = time * scalingFactor;
        double expPart = Math.exp(-lambda);
        double lambdaPowK = Math.pow(lambda, realK);
        double kFact = factorial((int) realK);
        return (lambdaPowK * expPart) / kFact;
    }

    private double factorial(int n) {
        if (n == 0)
            return 1;
        double result = 1;
        for (int i = 2; i <= n; i++)
            result *= i;
        return result;
    }
}