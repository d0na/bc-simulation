package it.sesame.mcp_server;

import it.sesame.mcp_server.config.BackendProperties;
import it.sesame.mcp_server.tools.SimulationTools;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableConfigurationProperties(BackendProperties.class)
public class McpServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(McpServerApplication.class, args);
	}

	@Bean
	public ToolCallbackProvider simulationToolsProvider(SimulationTools simulationTools) {
		return MethodToolCallbackProvider.builder().toolObjects(simulationTools).build();
	}
}
