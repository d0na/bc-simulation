#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  resolveExperimentDir,
  validateExperimentBundle,
} = require("./lib/experiment-framework");
const { updateRunManifest } = require("./update-run-manifest");

function buildRetrievalRequest(bundle) {
  const descriptor = bundle.descriptor;
  const retrievalEvidence = bundle.artifacts.retrieval_evidence;

  if (!retrievalEvidence?.contract?.chain || !retrievalEvidence?.contract?.address) {
    throw new Error("retrieval-evidence.json must include contract chain and address to prepare a retrieval request.");
  }

  return {
    experiment_id: descriptor.experiment_id,
    objective: descriptor.objective,
    target: {
      chain: retrievalEvidence.contract.chain,
      contract_address: retrievalEvidence.contract.address,
      contract_label: retrievalEvidence.contract.label || descriptor.experiment_id,
    },
    etherscan_request: {
      template: descriptor.templates.etherscan,
      required_outputs: [
        "abi_or_interface_metadata",
        "simulation_relevant_functions",
        "simulation_relevant_events",
        "available_gas_or_cost_signals"
      ]
    },
    dune_request: {
      template: descriptor.templates.dune,
      analysis_window: "last_180_days",
      target_metrics: [
        "daily_proposals",
        "daily_votes",
        "active_voters"
      ]
    }
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/prepare-retrieval-request.js <experiment-directory>");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot).filter(
    (issue) => !issue.includes("retrieval-request.json")
  );

  if (issues.length > 0) {
    console.error("Refusing to prepare retrieval request because prerequisite validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const retrievalRequest = buildRetrievalRequest(bundle);
  const outputPath = bundle.artifactPaths.retrieval_request;
  fs.writeFileSync(outputPath, `${JSON.stringify(retrievalRequest, null, 2)}\n`);
  updateRunManifest(experimentDir, "generation");
  console.log(`Prepared retrieval request at ${outputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
