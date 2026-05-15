package it.sesame.ai_agent.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record StudyDraftRequest(
        @NotBlank String experimentId,
        @NotBlank String objective,
        @Valid StudyTarget target,
        @Valid StudyWindow analysisWindow,
        List<String> keyQuestions,
        List<String> requestedMetrics,
        List<String> seedEntities,
        String reviewer
) {
}
