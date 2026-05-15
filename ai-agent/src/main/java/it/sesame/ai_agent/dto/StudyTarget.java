package it.sesame.ai_agent.dto;

import jakarta.validation.constraints.NotBlank;

public record StudyTarget(
        @NotBlank String chain,
        @NotBlank String contractAddress,
        @NotBlank String contractLabel
) {
}
