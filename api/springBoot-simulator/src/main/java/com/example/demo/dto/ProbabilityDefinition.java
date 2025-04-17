package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Handles the probabilities related to the behavior of entities and their actions (fixed, time-dependent, or conditional on the creation of other entities).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProbabilityDefinition {
    private String type; // "fixed", "time-dependent", "from-creator", etc.
    private Map<Integer, Double> values;
    private Double value; // used for "fixed"
}
