package it.sesame.ai_agent.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import it.sesame.ai_agent.config.AiAgentProperties;
import it.sesame.ai_agent.dto.StudyDraftRequest;
import it.sesame.ai_agent.dto.StudyDraftResponse;
import it.sesame.ai_agent.dto.StudyTarget;
import it.sesame.ai_agent.dto.StudyWindow;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class StudyDraftServiceTest {

    private StudyDraftService studyDraftService;

    @BeforeEach
    void setUp() {
        AiAgentProperties properties = new AiAgentProperties();
        PromptTemplateService promptTemplateService = new PromptTemplateService(properties);
        McpToolExecutorService mcpToolExecutorService = new McpToolExecutorService(java.util.Optional.empty(), properties);
        studyDraftService = new StudyDraftService(promptTemplateService, mcpToolExecutorService, properties, new ObjectMapper());
    }

    @Test
    void createsCompactFourPhaseDraft() {
        StudyDraftRequest request = new StudyDraftRequest(
                "dao-vote-costs-v2",
                "Study governance participation and adoption growth.",
                new StudyTarget("ethereum", "0x123", "DAO Governor"),
                new StudyWindow("2025-01-01", "2025-12-31"),
                List.of("When do users vote?", "Is there a burst near proposals?"),
                List.of("votes-per-day", "proposal-creation-rate"),
                List.of("user"),
                "francesco"
        );

        StudyDraftResponse response = studyDraftService.createDraft(request);

        assertThat(response.phases()).containsExactly(
                "define-study",
                "retrieve-mcp",
                "propose-med-and-simulation",
                "human-review"
        );
        assertThat(response.retrievalPlan().etherscanPrompt()).contains("DAO Governor");
        assertThat(response.modelingDraft().medProposal().meds()).isNotEmpty();
        assertThat(response.modelingDraft().probabilityModelProposal().models())
                .allMatch(model -> model.distributionType().equals("BASS"));
        assertThat(response.reviewPacket().status()).isEqualTo("pending_review");
    }
}
