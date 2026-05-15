package it.sesame.ai_agent.dto;

import jakarta.validation.constraints.NotBlank;

public record StudyWindow(
        @NotBlank String startDate,
        @NotBlank String endDate
) {
}
