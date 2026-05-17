package it.sesame.ai_agent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import it.sesame.ai_agent.config.AiAgentProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.stereotype.Service;

@Service
public class ExperimentBriefService {

    private final AiAgentProperties properties;
    private final ObjectMapper objectMapper;

    public ExperimentBriefService(AiAgentProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public JsonNode loadBrief(String experimentId) {
        Path briefPath = resolveBriefPath(experimentId);
        if (!Files.exists(briefPath)) {
            throw new IllegalArgumentException("Experiment brief not found: " + briefPath.toAbsolutePath());
        }

        try {
            return objectMapper.readTree(Files.readString(briefPath));
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read experiment brief at " + briefPath.toAbsolutePath(), exception);
        }
    }

    public Path resolveBriefPath(String experimentId) {
        return Path.of(properties.getExperimentsRoot(), experimentId, "01-brief.json").normalize();
    }

    public Path resolveRetrievalPath(String experimentId) {
        return Path.of(properties.getExperimentsRoot(), experimentId, "02-retrieval.json").normalize();
    }
}
