package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents an action that an entity can perform. (for instance, update policy or transfer)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActionDefinitionDTO {
    private String name;
    private ProbabilityDefinition probability;
    private long gasCost;
}
