package it.sesame.ai_agent.dto;

import java.util.List;
import java.util.Map;

public record StudyDraftResponse(
        StudyBrief studyBrief,
        List<String> phases,
        RetrievalPlan retrievalPlan,
        ModelingDraft modelingDraft,
        ReviewPacket reviewPacket,
        LaunchPlan launchPlan
) {

    public record StudyBrief(
            String experimentId,
            String objective,
            StudyTarget target,
            StudyWindow analysisWindow,
            List<String> keyQuestions,
            String reviewer
    ) {
    }

    public record RetrievalPlan(
            String strategy,
            List<String> requiredOutputs,
            List<String> targetMetrics,
            String etherscanPrompt,
            String dunePrompt,
            Map<String, Object> rawCaptureSkeleton
    ) {
    }

    public record ModelingDraft(
            MedProposal medProposal,
            ProbabilityModelProposal probabilityModelProposal,
            SimulationBlueprint simulationBlueprint,
            SimulationInputPreview simulationInputPreview
    ) {
    }

    public record MedProposal(
            String experimentId,
            String status,
            List<MedDraft> meds
    ) {
    }

    public record MedDraft(
            String medId,
            String label,
            List<String> functions,
            List<String> events,
            long representativeGas,
            String rationale,
            List<String> evidenceRefs
    ) {
    }

    public record ProbabilityModelProposal(
            String experimentId,
            String status,
            List<ProbabilityModelDraft> models
    ) {
    }

    public record ProbabilityModelDraft(
            String modelId,
            String targetMed,
            String distributionType,
            Map<String, Object> parameters,
            List<String> evidenceRefs,
            String confidence,
            String notes
    ) {
    }

    public record SimulationBlueprint(
            String experimentId,
            SimulationMetadata simulation,
            List<SimulationEventTemplate> eventTemplates
    ) {
    }

    public record SimulationMetadata(
            String name,
            String description,
            List<String> entities,
            int numAggr,
            int maxTime,
            int numRuns
    ) {
    }

    public record SimulationEventTemplate(
            String medId,
            String eventName,
            String description,
            String instanceOf,
            long gasCostOverride,
            List<SimulationDependencyTemplate> dependencies
    ) {
    }

    public record SimulationDependencyTemplate(
            String modelId,
            String dependOn,
            String maxProbabilityMatches
    ) {
    }

    public record SimulationInputPreview(
            String name,
            String description,
            List<String> entities,
            List<SimulationEventInput> events,
            int numAggr,
            int maxTime,
            int numRuns
    ) {
    }

    public record SimulationEventInput(
            String eventName,
            String description,
            String instanceOf,
            long gasCost,
            List<SimulationDependencyInput> dependencies
    ) {
    }

    public record SimulationDependencyInput(
            String dependOn,
            String maxProbabilityMatches,
            String distributionType,
            Map<String, Object> parameters
    ) {
    }

    public record ReviewPacket(
            String experimentId,
            String reviewer,
            String status,
            List<String> checklist,
            List<String> editableArtifacts
    ) {
    }

    public record LaunchPlan(
            String simulationToolName,
            boolean simulationToolAvailable,
            List<String> availableMcpTools,
            String nextAction
    ) {
    }
}
