package it.sesame.ai_agent.service;

import it.sesame.ai_agent.config.AiAgentProperties;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.stereotype.Service;

@Service
public class McpToolExecutorService {

    private final ToolCallbackProvider toolCallbackProvider;
    private final AiAgentProperties properties;

    public McpToolExecutorService(Optional<ToolCallbackProvider> toolCallbackProvider, AiAgentProperties properties) {
        this.toolCallbackProvider = toolCallbackProvider.orElse(null);
        this.properties = properties;
    }

    public List<String> listToolNames() {
        if (toolCallbackProvider == null) {
            return List.of();
        }
        return Arrays.stream(toolCallbackProvider.getToolCallbacks())
                .map(callback -> callback.getToolDefinition().name())
                .sorted()
                .toList();
    }

    public boolean isSimulationLaunchAvailable() {
        return findTool(properties.getToolNames().getSimulationLaunch()).isPresent();
    }

    public String invokeSimulationLaunch(String toolInputJson) {
        return invokeTool(properties.getToolNames().getSimulationLaunch(), toolInputJson);
    }

    public String invokeTool(String configuredName, String toolInputJson) {
        ToolCallback toolCallback = findTool(configuredName)
                .orElseThrow(() -> new IllegalStateException("MCP tool is not available: " + configuredName));
        return toolCallback.call(toolInputJson);
    }

    public boolean hasTool(String configuredName) {
        return findTool(configuredName).isPresent();
    }

    private Optional<ToolCallback> findTool(String configuredName) {
        if (toolCallbackProvider == null) {
            return Optional.empty();
        }

        return Arrays.stream(toolCallbackProvider.getToolCallbacks())
                .filter(callback -> {
                    String toolName = callback.getToolDefinition().name();
                    return toolName.equals(configuredName) || toolName.endsWith(configuredName);
                })
                .findFirst();
    }
}
