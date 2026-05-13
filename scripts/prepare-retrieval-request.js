#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  resolveExperimentDir,
} = require("./lib/experiment-framework");
const { updateRunManifest } = require("./update-run-manifest");

function parseArgs(argv) {
  const args = argv.slice(2);
  const inputPath = args.find((arg) => !arg.startsWith("--"));
  const updateManifest = args.includes("--update-manifest");

  return {
    inputPath,
    updateManifest,
  };
}

function validatePrerequisites(bundle, repoRoot) {
  const issues = [];
  const descriptor = bundle.descriptor;

  if (!descriptor.experiment_id) {
    issues.push("Missing descriptor field 'experiment_id'");
  }
  if (!descriptor.objective) {
    issues.push("Missing descriptor field 'objective'");
  }
  if (!descriptor.templates?.etherscan) {
    issues.push("Missing descriptor template 'etherscan'");
  }
  if (!descriptor.templates?.dune) {
    issues.push("Missing descriptor template 'dune'");
  }
  for (const templatePath of [descriptor.templates?.etherscan, descriptor.templates?.dune].filter(Boolean)) {
    if (!fs.existsSync(path.resolve(repoRoot, templatePath))) {
      issues.push(`Missing template file: ${templatePath}`);
    }
  }
  if (!bundle.artifactPaths.retrieval_request) {
    issues.push("Descriptor does not define artifact path for 'retrieval_request'");
  }
  if (!bundle.artifactPaths.retrieval_evidence) {
    issues.push("Descriptor does not define artifact path for 'retrieval_evidence'");
  }

  const retrievalEvidence = bundle.artifacts.retrieval_evidence;
  if (!retrievalEvidence) {
    issues.push("Missing artifact file 'retrieval_evidence'");
  } else {
    if (retrievalEvidence.experiment_id !== descriptor.experiment_id) {
      issues.push("retrieval-evidence.json experiment_id does not match experiment.json");
    }
    if (!retrievalEvidence.contract?.chain || !retrievalEvidence.contract?.address) {
      issues.push("retrieval-evidence.json must include contract.chain and contract.address");
    }
  }

  return issues;
}

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
  const { inputPath, updateManifest } = parseArgs(process.argv);
  if (!inputPath) {
    console.error("Usage: node scripts/prepare-retrieval-request.js <experiment-directory> [--update-manifest]");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validatePrerequisites(bundle, repoRoot);

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
  if (updateManifest) {
    updateRunManifest(experimentDir, "generation", {
      generator: "scripts/prepare-retrieval-request.js",
    });
  }
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
