package it.sesame.ai_agent.dto;

import java.util.List;

public record StudyRetrieveResponse(
        String experimentId,
        Target target,
        EtherscanResult etherscan,
        DuneResult dune,
        List<String> issues
) {

    public record Target(
            String domain,
            String chain,
            String contractAddress,
            String contractLabel
    ) {
    }

    public record EtherscanResult(
            String status,
            Integer totalFunctions,
            Integer totalEvents,
            List<String> writeFunctions,
            List<String> events,
            Boolean sourceCodeAvailable,
            String metadataStatus
    ) {
    }

    public record DuneResult(
            String status,
            Integer totalTables,
            List<String> tables
    ) {
    }
}
