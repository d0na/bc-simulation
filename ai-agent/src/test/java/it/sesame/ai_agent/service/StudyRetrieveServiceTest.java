package it.sesame.ai_agent.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import it.sesame.ai_agent.config.AiAgentProperties;
import it.sesame.ai_agent.dto.StudyRetrieveResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.definition.ToolDefinition;

class StudyRetrieveServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AiAgentProperties properties;

    @BeforeEach
    void setUp() {
        properties = new AiAgentProperties();
    }

    @Test
    void readsBriefAndBuildsUnifiedRetrievalResponse() throws Exception {
        Path tempRoot = Files.createTempDirectory("example-nft");
        Path experimentDir = tempRoot.resolve("example-nft");
        Files.createDirectories(experimentDir);
        Files.writeString(experimentDir.resolve("01-brief.json"), """
                {
                  "experiment_id": "example-nft",
                  "target": {
                    "domain": "nft_collection",
                    "chain": "ethereum",
                    "contract_address": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
                    "contract_label": "Bored Ape Yacht Club"
                  }
                }
                """);
        properties.setExperimentsRoot(tempRoot.toString());

        McpToolExecutorService mcpToolExecutorService = new McpToolExecutorService(
                Optional.of(new StubToolProvider(List.of(
                        tool("getContractAbi", abiResponseJson()),
                        tool("getContractSourceCode", """
                                {"status":"1","message":"OK","result":[{"SourceCode":"contract BAYC {}"}]}
                                """),
                        tool("getAddressMetadata", """
                                {"status":"0","message":"NOTOK","result":"upgrade required"}
                                """),
                        tool("searchTablesByContractAddress", """
                                {
                                  "total": 2,
                                  "results": [
                                    {"full_name":"boredape_ethereum.boredapeyachtclub_evt_transfer"},
                                    {"full_name":"boredape_ethereum.boredapeyachtclub_call_mintape"}
                                  ]
                                }
                                """)
                ))),
                properties
        );

        ExperimentBriefService experimentBriefService = new ExperimentBriefService(properties, objectMapper);
        StudyRetrieveService service = new StudyRetrieveService(experimentBriefService, mcpToolExecutorService, properties, objectMapper);

        StudyRetrieveResponse response = service.retrieve("example-nft");

        assertThat(response.target().contractLabel()).isEqualTo("Bored Ape Yacht Club");
        assertThat(response.etherscan().writeFunctions()).containsExactly("mintApe", "setApprovalForAll");
        assertThat(response.etherscan().events()).containsExactly("Transfer");
        assertThat(response.dune().tables()).containsExactly(
                "boredape_ethereum.boredapeyachtclub_evt_transfer",
                "boredape_ethereum.boredapeyachtclub_call_mintape"
        );
        assertThat(response.issues()).contains("Etherscan address metadata unavailable on current API plan or provider configuration.");
        assertThat(Files.exists(experimentDir.resolve("02-retrieval.json"))).isTrue();
        assertThat(Files.readString(experimentDir.resolve("02-retrieval.json"))).contains("mintApe");
    }

    private String abiResponseJson() throws Exception {
        String abiPayload = objectMapper.writeValueAsString(List.of(
                java.util.Map.of("type", "event", "name", "Transfer"),
                java.util.Map.of("type", "function", "name", "mintApe", "stateMutability", "payable"),
                java.util.Map.of("type", "function", "name", "setApprovalForAll", "stateMutability", "nonpayable")
        ));
        return objectMapper.writeValueAsString(java.util.Map.of(
                "status", "1",
                "message", "OK",
                "result", abiPayload
        ));
    }

    private ToolCallback tool(String name, String response) {
        return new ToolCallback() {
            @Override
            public ToolDefinition getToolDefinition() {
                return ToolDefinition.builder()
                        .name(name)
                        .description("stub")
                        .inputSchema("{}")
                        .build();
            }

            @Override
            public String call(String toolInput) {
                return response;
            }
        };
    }

    private record StubToolProvider(List<ToolCallback> callbacks) implements org.springframework.ai.tool.ToolCallbackProvider {
        @Override
        public ToolCallback[] getToolCallbacks() {
            return callbacks.toArray(ToolCallback[]::new);
        }
    }
}
