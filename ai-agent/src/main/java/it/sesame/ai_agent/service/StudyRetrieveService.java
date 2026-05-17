package it.sesame.ai_agent.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import it.sesame.ai_agent.config.AiAgentProperties;
import it.sesame.ai_agent.dto.StudyRetrieveResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class StudyRetrieveService {

    private final ExperimentBriefService experimentBriefService;
    private final McpToolExecutorService mcpToolExecutorService;
    private final AiAgentProperties properties;
    private final ObjectMapper objectMapper;

    public StudyRetrieveService(
            ExperimentBriefService experimentBriefService,
            McpToolExecutorService mcpToolExecutorService,
            AiAgentProperties properties,
            ObjectMapper objectMapper
    ) {
        this.experimentBriefService = experimentBriefService;
        this.mcpToolExecutorService = mcpToolExecutorService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public StudyRetrieveResponse retrieve(String experimentId) {
        JsonNode brief = experimentBriefService.loadBrief(experimentId);
        JsonNode target = brief.path("target");
        String contractAddress = requiredText(target, "contract_address");
        String chain = requiredText(target, "chain");
        String contractLabel = requiredText(target, "contract_label");
        String domain = text(target, "domain");

        List<String> issues = new ArrayList<>();

        JsonNode abiResponse = invokeTool(
                properties.getToolNames().getEtherscanAbi(),
                Map.of("address", contractAddress, "chainid", toChainId(chain))
        );
        JsonNode abiItems = parseEmbeddedJsonArray(abiResponse.path("result").asText("[]"), issues, "etherscan abi");
        List<String> writeFunctions = abiItems.findValuesAsText("name").isEmpty()
                ? List.of()
                : abiItems.findParents("type").stream()
                .filter(item -> "function".equals(item.path("type").asText())
                        && ("nonpayable".equals(item.path("stateMutability").asText())
                        || "payable".equals(item.path("stateMutability").asText())))
                .map(item -> item.path("name").asText())
                .distinct()
                .sorted()
                .toList();
        List<String> events = abiItems.findParents("type").stream()
                .filter(item -> "event".equals(item.path("type").asText()))
                .map(item -> item.path("name").asText())
                .distinct()
                .sorted()
                .toList();

        JsonNode sourceResponse = invokeTool(
                properties.getToolNames().getEtherscanSourceCode(),
                Map.of("address", contractAddress, "chainid", toChainId(chain))
        );
        boolean sourceCodeAvailable = sourceResponse.path("result").isArray()
                && sourceResponse.path("result").size() > 0
                && !sourceResponse.path("result").get(0).path("SourceCode").asText("").isBlank();

        String metadataStatus = "not_requested";
        try {
            JsonNode metadataResponse = invokeTool(
                    properties.getToolNames().getEtherscanAddressMetadata(),
                    Map.of("address", contractAddress, "chainid", toChainId(chain))
            );
            metadataStatus = normalizeToolStatus(metadataResponse);
            if (!"ok".equals(metadataStatus)) {
                issues.add("Etherscan address metadata unavailable on current API plan or provider configuration.");
            }
        } catch (IllegalStateException exception) {
            metadataStatus = "unavailable";
            issues.add("Etherscan address metadata unavailable on current API plan or provider configuration.");
        }

        JsonNode duneResponse = invokeTool(
                properties.getToolNames().getDuneSearchTablesByContract(),
                Map.of(
                        "contractAddress", contractAddress,
                        "blockchains", List.of(chain),
                        "includeSchema", false,
                        "limit", 10,
                        "offset", 0
                )
        );
        List<String> duneTables = duneResponse.path("results").isArray()
                ? toTextList(duneResponse.path("results"), "full_name")
                : List.of();

        StudyRetrieveResponse response = new StudyRetrieveResponse(
                experimentId,
                new StudyRetrieveResponse.Target(domain, chain, contractAddress, contractLabel),
                new StudyRetrieveResponse.EtherscanResult(
                        normalizeToolStatus(abiResponse),
                        countByType(abiItems, "function"),
                        countByType(abiItems, "event"),
                        writeFunctions,
                        events,
                        sourceCodeAvailable,
                        metadataStatus
                ),
                new StudyRetrieveResponse.DuneResult(
                        duneTables.isEmpty() ? "empty" : "ok",
                        duneResponse.path("total").isInt() ? duneResponse.path("total").asInt() : duneTables.size(),
                        duneTables
                ),
                issues
        );

        writeRetrievalArtifact(experimentId, response);
        return response;
    }

    private JsonNode invokeTool(String toolName, Map<String, Object> arguments) {
        try {
            String rawResponse = mcpToolExecutorService.invokeTool(toolName, objectMapper.writeValueAsString(arguments));
            return objectMapper.readTree(rawResponse);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize or parse MCP tool call for " + toolName, exception);
        }
    }

    private JsonNode parseEmbeddedJsonArray(String rawJson, List<String> issues, String label) {
        try {
            return objectMapper.readTree(rawJson);
        } catch (JsonProcessingException exception) {
            issues.add("Failed to parse " + label + " payload.");
            return objectMapper.createArrayNode();
        }
    }

    private Integer countByType(JsonNode items, String type) {
        if (!items.isArray()) {
            return 0;
        }
        int count = 0;
        for (JsonNode item : items) {
            if (type.equals(item.path("type").asText())) {
                count += 1;
            }
        }
        return count;
    }

    private List<String> toTextList(JsonNode arrayNode, String fieldName) {
        List<String> values = new ArrayList<>();
        for (JsonNode item : arrayNode) {
            String value = item.path(fieldName).asText();
            if (!value.isBlank()) {
                values.add(value);
            }
        }
        return values;
    }

    private String normalizeToolStatus(JsonNode response) {
        if (response.path("status").asText().equals("1")) {
            return "ok";
        }
        if (response.path("status").asText().equals("0")) {
            return "provider_error";
        }
        return response.path("results").isArray() ? "ok" : "unknown";
    }

    private int toChainId(String chain) {
        return switch (chain) {
            case "ethereum" -> 1;
            case "base" -> 8453;
            case "arbitrum" -> 42161;
            default -> 1;
        };
    }

    private String requiredText(JsonNode node, String fieldName) {
        String value = text(node, fieldName);
        if (value == null || value.isBlank() || "null".equals(value)) {
            throw new IllegalArgumentException("Missing required brief field target." + fieldName);
        }
        return value;
    }

    private String text(JsonNode node, String fieldName) {
        JsonNode valueNode = node.path(fieldName);
        return valueNode.isMissingNode() || valueNode.isNull() ? null : valueNode.asText();
    }

    private void writeRetrievalArtifact(String experimentId, StudyRetrieveResponse response) {
        Path retrievalPath = experimentBriefService.resolveRetrievalPath(experimentId);
        try {
            Files.writeString(retrievalPath, objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(response) + "\n");
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to write retrieval artifact at " + retrievalPath.toAbsolutePath(), exception);
        }
    }
}
