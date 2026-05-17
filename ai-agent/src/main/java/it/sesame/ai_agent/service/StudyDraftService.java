package it.sesame.ai_agent.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import it.sesame.ai_agent.config.AiAgentProperties;
import it.sesame.ai_agent.dto.SimulationLaunchRequest;
import it.sesame.ai_agent.dto.SimulationLaunchResponse;
import it.sesame.ai_agent.dto.StudyDraftRequest;
import it.sesame.ai_agent.dto.StudyDraftResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class StudyDraftService {

    private final PromptTemplateService promptTemplateService;
    private final McpToolExecutorService mcpToolExecutorService;
    private final AiAgentProperties properties;
    private final ObjectMapper objectMapper;

    public StudyDraftService(
            PromptTemplateService promptTemplateService,
            McpToolExecutorService mcpToolExecutorService,
            AiAgentProperties properties,
            ObjectMapper objectMapper
    ) {
        this.promptTemplateService = promptTemplateService;
        this.mcpToolExecutorService = mcpToolExecutorService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public StudyDraftResponse createDraft(StudyDraftRequest request) {
        List<String> metrics = promptTemplateService.resolveMetrics(request);
        String etherscanPrompt = promptTemplateService.buildEtherscanPrompt(request);
        String dunePrompt = promptTemplateService.buildDunePrompt(request, metrics);

        StudyDraftResponse.MedProposal medProposal = buildMedProposal(request);
        StudyDraftResponse.ProbabilityModelProposal probabilityModelProposal = buildProbabilityModels(request, medProposal);
        StudyDraftResponse.SimulationBlueprint simulationBlueprint = buildSimulationBlueprint(request, medProposal, probabilityModelProposal);
        StudyDraftResponse.SimulationInputPreview simulationInputPreview = buildSimulationInputPreview(simulationBlueprint, probabilityModelProposal);

        return new StudyDraftResponse(
                new StudyDraftResponse.StudyBrief(
                        request.experimentId(),
                        request.objective(),
                        request.target(),
                        request.analysisWindow(),
                        safeList(request.keyQuestions()),
                        resolveReviewer(request.reviewer())
                ),
                List.of(
                        "define-study",
                        "retrieve-mcp",
                        "propose-med-and-simulation",
                        "human-review"
                ),
                new StudyDraftResponse.RetrievalPlan(
                        "Fixed prompts reused across experiments and parameterized by study objective, contract target, and time window.",
                        properties.getDefaults().getEtherscanOutputs(),
                        metrics,
                        etherscanPrompt,
                        dunePrompt,
                        buildCaptureSkeleton(request, metrics)
                ),
                new StudyDraftResponse.ModelingDraft(
                        medProposal,
                        probabilityModelProposal,
                        simulationBlueprint,
                        simulationInputPreview
                ),
                new StudyDraftResponse.ReviewPacket(
                        request.experimentId(),
                        resolveReviewer(request.reviewer()),
                        "pending_review",
                        properties.getDefaults().getReviewChecklist(),
                        List.of("retrieval evidence", "MED proposal", "probability models", "simulation payload")
                ),
                new StudyDraftResponse.LaunchPlan(
                        properties.getToolNames().getSimulationLaunch(),
                        mcpToolExecutorService.isSimulationLaunchAvailable(),
                        mcpToolExecutorService.listToolNames(),
                        mcpToolExecutorService.isSimulationLaunchAvailable()
                                ? "Complete or edit the human review, then call POST /api/studies/launch."
                                : "Configure the simulation MCP connection, complete human review, then call POST /api/studies/launch."
                )
        );
    }

    public SimulationLaunchResponse launchSimulation(SimulationLaunchRequest request) {
        Map<String, Object> simulationPayload = new LinkedHashMap<>();
        simulationPayload.put("name", request.name());
        simulationPayload.put("description", request.description());
        simulationPayload.put("entities", request.entities());
        simulationPayload.put("events", request.events().stream().map(this::toEventPayload).toList());
        simulationPayload.put("numAggr", request.numAggr());
        simulationPayload.put("maxTime", request.maxTime());
        simulationPayload.put("numRuns", request.numRuns());

        try {
            String simulationJson = objectMapper.writeValueAsString(simulationPayload);
            String toolInput = objectMapper.writeValueAsString(Map.of("simulationRequestJson", simulationJson));
            String rawResponse = mcpToolExecutorService.invokeSimulationLaunch(toolInput);
            return new SimulationLaunchResponse(
                    request.experimentId(),
                    properties.getToolNames().getSimulationLaunch(),
                    simulationJson,
                    rawResponse
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize simulation launch payload", exception);
        }
    }

    private Map<String, Object> toEventPayload(SimulationLaunchRequest.SimulationEventRequest event) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventName", event.eventName());
        payload.put("description", event.description());
        payload.put("instanceOf", event.instanceOf());
        payload.put("gasCost", event.gasCost());
        payload.put("dependencies", event.dependencies().stream().map(this::toDependencyPayload).toList());
        return payload;
    }

    private Map<String, Object> toDependencyPayload(SimulationLaunchRequest.SimulationDependencyRequest dependency) {
        Map<String, Object> probabilityDistribution = new LinkedHashMap<>();
        probabilityDistribution.put("type", dependency.distributionType());
        probabilityDistribution.putAll(dependency.parameters());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("dependOn", dependency.dependOn());
        payload.put("maxProbabilityMatches", dependency.maxProbabilityMatches());
        payload.put("probabilityDistribution", probabilityDistribution);
        return payload;
    }

    private StudyDraftResponse.MedProposal buildMedProposal(StudyDraftRequest request) {
        List<StudyDraftResponse.MedDraft> meds = new ArrayList<>();
        meds.add(new StudyDraftResponse.MedDraft(
                "med_core_write",
                "Core contract write operations",
                List.of("primary_write_function"),
                List.of("primary_state_change_event"),
                150_000L,
                "Covers the contract action most directly tied to the study objective.",
                List.of("etherscan:functions", "etherscan:gas_signals")
        ));

        meds.add(new StudyDraftResponse.MedDraft(
                "med_user_activity",
                "User activity and repeated interactions",
                List.of("repeat_user_action"),
                List.of("activity_event"),
                90_000L,
                "Separates recurrent user behavior from setup or one-off actions so the simulation can model cadence.",
                List.of("dune:metrics", "dune:trend_hints")
        ));

        if (shouldIncludeTerminalMed(request) && meds.size() < properties.getDefaults().getMaxMeds()) {
            meds.add(new StudyDraftResponse.MedDraft(
                    "med_terminal_action",
                    "Terminal or settlement action",
                    List.of("terminal_action"),
                    List.of("terminal_event"),
                    110_000L,
                    "Captures the closing action of a lifecycle such as transfer, vote finalization, settlement, or exit.",
                    List.of("etherscan:events", "dune:metrics")
            ));
        }

        return new StudyDraftResponse.MedProposal(request.experimentId(), "proposed", meds);
    }

    private StudyDraftResponse.ProbabilityModelProposal buildProbabilityModels(
            StudyDraftRequest request,
            StudyDraftResponse.MedProposal medProposal
    ) {
        List<StudyDraftResponse.ProbabilityModelDraft> models = medProposal.meds().stream()
                .map(med -> new StudyDraftResponse.ProbabilityModelDraft(
                        med.medId() + "_model",
                        med.medId(),
                        inferDistributionType(request),
                        inferDistributionParameters(request),
                        med.evidenceRefs(),
                        inferConfidence(request),
                        "Draft heuristic generated from the study objective and requested Dune metrics."
                ))
                .toList();

        return new StudyDraftResponse.ProbabilityModelProposal(request.experimentId(), "proposed", models);
    }

    private StudyDraftResponse.SimulationBlueprint buildSimulationBlueprint(
            StudyDraftRequest request,
            StudyDraftResponse.MedProposal medProposal,
            StudyDraftResponse.ProbabilityModelProposal probabilityModelProposal
    ) {
        List<String> entities = request.seedEntities() == null || request.seedEntities().isEmpty()
                ? List.of("user")
                : request.seedEntities();

        List<StudyDraftResponse.SimulationEventTemplate> events = medProposal.meds().stream()
                .map(med -> new StudyDraftResponse.SimulationEventTemplate(
                        med.medId(),
                        med.medId().replace("med_", "") + "_event",
                        "Draft event generated from " + med.label().toLowerCase(Locale.ROOT) + ".",
                        "user",
                        med.representativeGas(),
                        List.of(new StudyDraftResponse.SimulationDependencyTemplate(
                                med.medId() + "_model",
                                entities.getFirst(),
                                "#%s".formatted(entities.getFirst())
                        ))
                ))
                .toList();

        return new StudyDraftResponse.SimulationBlueprint(
                request.experimentId(),
                new StudyDraftResponse.SimulationMetadata(
                        request.target().contractLabel() + "-study",
                        "Draft simulation for " + request.objective(),
                        entities,
                        properties.getDefaults().getDefaultNumAggr(),
                        properties.getDefaults().getDefaultMaxTime(),
                        properties.getDefaults().getDefaultNumRuns()
                ),
                events
        );
    }

    private StudyDraftResponse.SimulationInputPreview buildSimulationInputPreview(
            StudyDraftResponse.SimulationBlueprint simulationBlueprint,
            StudyDraftResponse.ProbabilityModelProposal probabilityModelProposal
    ) {
        Map<String, StudyDraftResponse.ProbabilityModelDraft> modelsById = probabilityModelProposal.models().stream()
                .collect(LinkedHashMap::new, (map, model) -> map.put(model.modelId(), model), LinkedHashMap::putAll);

        List<StudyDraftResponse.SimulationEventInput> events = simulationBlueprint.eventTemplates().stream()
                .map(template -> new StudyDraftResponse.SimulationEventInput(
                        template.eventName(),
                        template.description(),
                        template.instanceOf(),
                        template.gasCostOverride(),
                        template.dependencies().stream().map(dependency -> {
                            StudyDraftResponse.ProbabilityModelDraft model = modelsById.get(dependency.modelId());
                            return new StudyDraftResponse.SimulationDependencyInput(
                                    dependency.dependOn(),
                                    dependency.maxProbabilityMatches(),
                                    model.distributionType(),
                                    model.parameters()
                            );
                        }).toList()
                ))
                .toList();

        return new StudyDraftResponse.SimulationInputPreview(
                simulationBlueprint.simulation().name(),
                simulationBlueprint.simulation().description(),
                simulationBlueprint.simulation().entities(),
                events,
                simulationBlueprint.simulation().numAggr(),
                simulationBlueprint.simulation().maxTime(),
                simulationBlueprint.simulation().numRuns()
        );
    }

    private Map<String, Object> buildCaptureSkeleton(StudyDraftRequest request, List<String> metrics) {
        Map<String, Object> skeleton = new LinkedHashMap<>();
        skeleton.put("experiment_id", request.experimentId());
        skeleton.put("etherscan", Map.of(
                "functions", List.of(),
                "events", List.of(),
                "transactions", List.of(),
                "gas_signals", List.of()
        ));
        skeleton.put("dune", Map.of(
                "metrics", metrics,
                "time_window", Map.of(
                        "start_date", request.analysisWindow().startDate(),
                        "end_date", request.analysisWindow().endDate()
                )
        ));
        skeleton.put("simulation_mcp", Map.of(
                "notes", List.of("Optional place to store MCP-side simulation observations before launch.")
        ));
        return skeleton;
    }

    private boolean shouldIncludeTerminalMed(StudyDraftRequest request) {
        String text = (request.objective() + " " + String.join(" ", safeList(request.keyQuestions()))).toLowerCase(Locale.ROOT);
        return text.contains("transfer")
                || text.contains("vote")
                || text.contains("proposal")
                || text.contains("settlement")
                || text.contains("mint")
                || text.contains("burn")
                || text.contains("exit");
    }

    private String inferDistributionType(StudyDraftRequest request) {
        String text = (request.objective() + " " + String.join(" ", safeList(request.requestedMetrics()))).toLowerCase(Locale.ROOT);
        if (text.contains("adoption") || text.contains("growth")) {
            return "BASS";
        }
        if (text.contains("peak") || text.contains("burst") || text.contains("launch")) {
            return "LOGNORMAL";
        }
        if (text.contains("stable") || text.contains("steady")) {
            return "UNIFORM";
        }
        return "EXPONENTIAL";
    }

    private Map<String, Object> inferDistributionParameters(StudyDraftRequest request) {
        return switch (inferDistributionType(request)) {
            case "BASS" -> Map.of("p", 0.03, "q", 0.38, "scalingFactor", 1.0);
            case "LOGNORMAL" -> Map.of("mean", 1.2, "std", 0.8, "scalingFactor", 1.0);
            case "UNIFORM" -> Map.of("value", 0.1);
            default -> Map.of("rate", 0.08, "scalingFactor", 1.0);
        };
    }

    private String inferConfidence(StudyDraftRequest request) {
        return safeList(request.keyQuestions()).size() >= 3 ? "medium" : "low";
    }

    private String resolveReviewer(String reviewer) {
        return (reviewer == null || reviewer.isBlank()) ? "human-reviewer-required" : reviewer;
    }

    private List<String> safeList(List<String> values) {
        return values == null ? List.of() : values;
    }
}
