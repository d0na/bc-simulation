package it.sesame.ai_agent.controller;

import it.sesame.ai_agent.dto.SimulationLaunchRequest;
import it.sesame.ai_agent.dto.SimulationLaunchResponse;
import it.sesame.ai_agent.dto.StudyDraftRequest;
import it.sesame.ai_agent.dto.StudyDraftResponse;
import it.sesame.ai_agent.dto.StudyRetrieveRequest;
import it.sesame.ai_agent.dto.StudyRetrieveResponse;
import it.sesame.ai_agent.service.McpToolExecutorService;
import it.sesame.ai_agent.service.StudyDraftService;
import it.sesame.ai_agent.service.StudyRetrieveService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/studies")
public class StudyOrchestrationController {

    private final StudyDraftService studyDraftService;
    private final StudyRetrieveService studyRetrieveService;
    private final McpToolExecutorService mcpToolExecutorService;

    public StudyOrchestrationController(
            StudyDraftService studyDraftService,
            StudyRetrieveService studyRetrieveService,
            McpToolExecutorService mcpToolExecutorService
    ) {
        this.studyDraftService = studyDraftService;
        this.studyRetrieveService = studyRetrieveService;
        this.mcpToolExecutorService = mcpToolExecutorService;
    }

    @PostMapping("/retrieve")
    public StudyRetrieveResponse retrieve(@Valid @RequestBody StudyRetrieveRequest request) {
        return studyRetrieveService.retrieve(request.experimentId());
    }

    @PostMapping("/draft")
    public StudyDraftResponse draft(@Valid @RequestBody StudyDraftRequest request) {
        return studyDraftService.createDraft(request);
    }

    @PostMapping("/launch")
    public SimulationLaunchResponse launch(@Valid @RequestBody SimulationLaunchRequest request) {
        return studyDraftService.launchSimulation(request);
    }

    @GetMapping("/mcp-tools")
    public Map<String, List<String>> listMcpTools() {
        return Map.of("tools", mcpToolExecutorService.listToolNames());
    }
}
