package com.bcsimulator.dto.distribution;

import com.bcsimulator.dto.AbstractDistributionDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GartnerSasakiProbDistrDTO extends AbstractDistributionDTO {

    @JsonProperty("A")
    private double A;
    @JsonProperty("B")
    private double B;
    @JsonProperty("C")
    private double C;
    @JsonProperty("D")
    private double D;
    @JsonProperty("E")
    private double E;
    @JsonProperty("F")
    private double F;
    @JsonProperty("G")
    private double G;
    @JsonProperty("H")
    private double H;
    @JsonProperty("I")
    private double I;
    @JsonProperty("scalingFactor")
    private double scalingFactor;


    @Override
    public double getProb(int time) {

        double t = time * scalingFactor;
        double gompertz = A * Math.exp(-B * Math.exp(-C * t));
        double logisticDrop = D / (1 + Math.exp(-E * (t - F)));
        double recovery = G / (1 + Math.exp(-H * (t - I)));
        return Math.max(gompertz - logisticDrop + recovery, 0);
    }
}