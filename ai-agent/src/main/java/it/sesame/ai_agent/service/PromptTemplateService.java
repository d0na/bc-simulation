package it.sesame.ai_agent.service;

import it.sesame.ai_agent.config.AiAgentProperties;
import it.sesame.ai_agent.dto.StudyDraftRequest;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PromptTemplateService {

    private final AiAgentProperties properties;

    public PromptTemplateService(AiAgentProperties properties) {
        this.properties = properties;
    }

    public List<String> resolveMetrics(StudyDraftRequest request) {
        if (request.requestedMetrics() != null && !request.requestedMetrics().isEmpty()) {
            return request.requestedMetrics();
        }
        return properties.getDefaults().getDuneMetrics();
    }

    public String buildEtherscanPrompt(StudyDraftRequest request) {
        return """
                You are collecting contract-level evidence for a Sesame study.
                Study objective: %s
                Chain: %s
                Contract address: %s
                Contract label: %s

                Use the same retrieval structure used across all experiments.
                Return only the evidence needed to support MED decomposition:
                - verified write functions
                - relevant read functions
                - emitted events
                - transaction counts by function
                - gas statistics by function

                Also highlight ambiguous or unknown calls that may affect the simulation model.
                """.formatted(
                request.objective(),
                request.target().chain(),
                request.target().contractAddress(),
                request.target().contractLabel()
        ).trim();
    }

    public String buildDunePrompt(StudyDraftRequest request, List<String> metrics) {
        String keyQuestions = request.keyQuestions() == null || request.keyQuestions().isEmpty()
                ? "- Derive the key behavioral trend needed by the simulation."
                : request.keyQuestions().stream().map(question -> "- " + question).reduce((left, right) -> left + "\n" + right).orElse("");

        String metricList = metrics.stream().map(metric -> "- " + metric).reduce((left, right) -> left + "\n" + right).orElse("");

        return """
                You are collecting time-series evidence for a Sesame study.
                Study objective: %s
                Contract label: %s
                Analysis window: %s to %s

                Follow the same Dune prompt structure for every experiment.
                Answer these study questions:
                %s

                Return normalized metrics for:
                %s

                Include short trend hints for peaks, decay phases, stable periods, and anomalies.
                """.formatted(
                request.objective(),
                request.target().contractLabel(),
                request.analysisWindow().startDate(),
                request.analysisWindow().endDate(),
                keyQuestions,
                metricList
        ).trim();
    }
}
