package it.sesame.ai_agent.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "sesame.ai-agent")
public class AiAgentProperties {

    private ToolNames toolNames = new ToolNames();
    private Defaults defaults = new Defaults();
    @NotBlank
    private String experimentsRoot = "../experiments";
    private String etherscanApiKey = "";

    public ToolNames getToolNames() {
        return toolNames;
    }

    public void setToolNames(ToolNames toolNames) {
        this.toolNames = toolNames;
    }

    public Defaults getDefaults() {
        return defaults;
    }

    public void setDefaults(Defaults defaults) {
        this.defaults = defaults;
    }

    public String getExperimentsRoot() {
        return experimentsRoot;
    }

    public void setExperimentsRoot(String experimentsRoot) {
        this.experimentsRoot = experimentsRoot;
    }

    public String getEtherscanApiKey() {
        return etherscanApiKey;
    }

    public void setEtherscanApiKey(String etherscanApiKey) {
        this.etherscanApiKey = etherscanApiKey;
    }

    public static class ToolNames {

        @NotBlank
        private String simulationLaunch = "runSimulation";
        @NotBlank
        private String etherscanAbi = "getContractAbi";
        @NotBlank
        private String etherscanSourceCode = "getContractSourceCode";
        @NotBlank
        private String etherscanAddressMetadata = "getAddressMetadata";
        @NotBlank
        private String duneSearchTablesByContract = "searchTablesByContractAddress";

        public String getSimulationLaunch() {
            return simulationLaunch;
        }

        public void setSimulationLaunch(String simulationLaunch) {
            this.simulationLaunch = simulationLaunch;
        }

        public String getEtherscanAbi() {
            return etherscanAbi;
        }

        public void setEtherscanAbi(String etherscanAbi) {
            this.etherscanAbi = etherscanAbi;
        }

        public String getEtherscanSourceCode() {
            return etherscanSourceCode;
        }

        public void setEtherscanSourceCode(String etherscanSourceCode) {
            this.etherscanSourceCode = etherscanSourceCode;
        }

        public String getEtherscanAddressMetadata() {
            return etherscanAddressMetadata;
        }

        public void setEtherscanAddressMetadata(String etherscanAddressMetadata) {
            this.etherscanAddressMetadata = etherscanAddressMetadata;
        }

        public String getDuneSearchTablesByContract() {
            return duneSearchTablesByContract;
        }

        public void setDuneSearchTablesByContract(String duneSearchTablesByContract) {
            this.duneSearchTablesByContract = duneSearchTablesByContract;
        }
    }

    public static class Defaults {

        private List<String> etherscanOutputs = List.of(
                "verified-contract-functions",
                "verified-contract-events",
                "transaction-count-by-function",
                "gas-cost-by-function"
        );

        private List<String> duneMetrics = List.of(
                "daily-active-users",
                "transactions-per-day",
                "gas-used-per-day",
                "event-frequency-over-time"
        );

        private List<String> reviewChecklist = List.of(
                "Confermare che le metriche richieste rispondano davvero alla domanda di studio.",
                "Verificare che la suddivisione in MED non accorpi operazioni semanticamente diverse.",
                "Correggere i parametri delle distribuzioni se i trend osservati non coincidono con l'ipotesi proposta.",
                "Confermare o modificare il payload finale prima del launch."
        );

        @Min(1)
        private int defaultNumRuns = 5;

        @Min(60)
        private int defaultNumAggr = 3600;

        @Min(3600)
        private int defaultMaxTime = 1209600;

        @Min(1)
        @Max(10)
        private int maxMeds = 3;

        public List<String> getEtherscanOutputs() {
            return etherscanOutputs;
        }

        public void setEtherscanOutputs(List<String> etherscanOutputs) {
            this.etherscanOutputs = etherscanOutputs;
        }

        public List<String> getDuneMetrics() {
            return duneMetrics;
        }

        public void setDuneMetrics(List<String> duneMetrics) {
            this.duneMetrics = duneMetrics;
        }

        public List<String> getReviewChecklist() {
            return reviewChecklist;
        }

        public void setReviewChecklist(List<String> reviewChecklist) {
            this.reviewChecklist = reviewChecklist;
        }

        public int getDefaultNumRuns() {
            return defaultNumRuns;
        }

        public void setDefaultNumRuns(int defaultNumRuns) {
            this.defaultNumRuns = defaultNumRuns;
        }

        public int getDefaultNumAggr() {
            return defaultNumAggr;
        }

        public void setDefaultNumAggr(int defaultNumAggr) {
            this.defaultNumAggr = defaultNumAggr;
        }

        public int getDefaultMaxTime() {
            return defaultMaxTime;
        }

        public void setDefaultMaxTime(int defaultMaxTime) {
            this.defaultMaxTime = defaultMaxTime;
        }

        public int getMaxMeds() {
            return maxMeds;
        }

        public void setMaxMeds(int maxMeds) {
            this.maxMeds = maxMeds;
        }
    }
}
