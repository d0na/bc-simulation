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

  return issues;
}

function loadDiscoveryBrief(bundle) {
  const brief = bundle.artifacts.discovery_brief;
  return brief && typeof brief === "object" ? brief : {};
}

function inferDomainText(bundle) {
  const discoveryBrief = loadDiscoveryBrief(bundle);
  return [
    bundle.descriptor.experiment_id || "",
    bundle.descriptor.objective || "",
    discoveryBrief.target_name || "",
    discoveryBrief.target_type || "",
    discoveryBrief.goal || "",
    ...(Array.isArray(discoveryBrief.questions) ? discoveryBrief.questions : []),
    ...(Array.isArray(discoveryBrief.known_constraints) ? discoveryBrief.known_constraints : []),
    discoveryBrief.notes_for_ai || "",
  ]
    .join("\n")
    .toLowerCase();
}

function inferTargetFromText(text) {
  if (text.includes("bayc") || text.includes("bored ape yacht club")) {
    return {
      chain: "ethereum",
      contract_address: "0xBC4CA0EDA7647A8AB7C2061C2E118A18A936f13D",
      contract_label: "BoredApeYachtClub",
    };
  }

  if (text.includes("erc-721") || text.includes("erc721") || text.includes("nft")) {
    return {
      chain: "ethereum",
      contract_address: "replace-me",
      contract_label: "replace-me-nft-collection",
    };
  }

  return {
    chain: "replace-me",
    contract_address: "replace-me",
    contract_label: "replace-me",
  };
}

function inferDuneMetrics(text) {
  if (text.includes("bayc") || text.includes("nft") || text.includes("erc-721") || text.includes("erc721")) {
    return [
      "daily_transfer_count",
      "daily_sale_count",
      "daily_unique_traders",
      "daily_active_holders",
      "daily_operator_approvals",
    ];
  }

  if (text.includes("governance") || text.includes("vote") || text.includes("proposal")) {
    return [
      "daily_proposals",
      "daily_votes",
      "active_voters",
    ];
  }

  return [
    "daily_active_users",
    "daily_transaction_count",
  ];
}

function inferEtherscanOutputs(text) {
  const outputs = [
    "abi_or_interface_metadata",
    "simulation_relevant_functions",
    "simulation_relevant_events",
    "available_gas_or_cost_signals",
  ];

  if (text.includes("nft") || text.includes("erc-721") || text.includes("erc721")) {
    outputs.push("token_transfer_and_approval_events");
  }

  return outputs;
}

function buildRetrievalRequest(bundle) {
  const descriptor = bundle.descriptor;
  const retrievalEvidence = bundle.artifacts.retrieval_evidence;
  const discoveryBrief = loadDiscoveryBrief(bundle);
  const text = inferDomainText(bundle);
  const inferredTarget = inferTargetFromText(text);
  const target = {
    chain: retrievalEvidence?.contract?.chain || discoveryBrief.known_target?.chain || inferredTarget.chain,
    contract_address: retrievalEvidence?.contract?.address || discoveryBrief.known_target?.contract_address || inferredTarget.contract_address,
    contract_label: retrievalEvidence?.contract?.label || discoveryBrief.known_target?.contract_label || inferredTarget.contract_label || descriptor.experiment_id,
  };
  const targetMetrics =
    Array.isArray(discoveryBrief.preferred_metrics) && discoveryBrief.preferred_metrics.length > 0
      ? discoveryBrief.preferred_metrics
      : inferDuneMetrics(text);
  const analysisWindow = discoveryBrief.analysis_window || "last_180_days";

  return {
    experiment_id: descriptor.experiment_id,
    objective: descriptor.objective,
    target,
    discovery_goal: discoveryBrief.goal || descriptor.objective,
    etherscan_request: {
      template: descriptor.templates.etherscan,
      required_outputs: inferEtherscanOutputs(text),
    },
    dune_request: {
      template: descriptor.templates.dune,
      analysis_window: analysisWindow,
      target_metrics: targetMetrics,
    },
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
