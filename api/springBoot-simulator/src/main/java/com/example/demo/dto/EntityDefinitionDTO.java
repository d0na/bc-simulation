package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Entity represantion (for instance, a Creator or an Asset)
 * @author francesco
 * @project springBoot-simulator
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EntityDefinitionDTO {
    private String name;
    private ProbabilityDefinition creationProbability;
    private List<ActionDefinitionDTO> actions;
    private long gasCost;
}