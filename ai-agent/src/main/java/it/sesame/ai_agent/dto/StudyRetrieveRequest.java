package it.sesame.ai_agent.dto;

import jakarta.validation.constraints.NotBlank;

public record StudyRetrieveRequest(@NotBlank String experimentId) {
}
