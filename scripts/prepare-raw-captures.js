#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  resolveExperimentDir,
} = require("./lib/experiment-framework");

function parseArgs(argv) {
  const args = argv.slice(2);
  const inputPath = args.find((arg) => !arg.startsWith("--"));
  return { inputPath };
}

function validatePrerequisites(bundle) {
  const issues = [];
  const descriptor = bundle.descriptor;
  const request = bundle.artifacts.retrieval_request;

  if (!descriptor.experiment_id) {
    issues.push("Missing descriptor field 'experiment_id'");
  }
  if (!bundle.artifactPaths.etherscan_mcp_capture) {
    issues.push("Descriptor does not define artifact path for 'etherscan_mcp_capture'");
  }
  if (!bundle.artifactPaths.dune_mcp_capture) {
    issues.push("Descriptor does not define artifact path for 'dune_mcp_capture'");
  }
  if (!bundle.artifactPaths.simulation_mcp_capture) {
    issues.push("Descriptor does not define artifact path for 'simulation_mcp_capture'");
  }
  if (!request) {
    issues.push("Missing retrieval-request.json");
  } else {
    if (!request.target?.chain || !request.target?.contract_address || !request.target?.contract_label) {
      issues.push("retrieval-request.json must include target.chain, target.contract_address, and target.contract_label");
    }
    if (!Array.isArray(request.dune_request?.target_metrics) || request.dune_request.target_metrics.length === 0) {
      issues.push("retrieval-request.json must include dune_request.target_metrics");
    }
  }

  return issues;
}

function buildEtherscanCapture(bundle) {
  const request = bundle.artifacts.retrieval_request;
  return {
    experiment_id: bundle.descriptor.experiment_id,
    contract: {
      chain: request.target.chain,
      address: request.target.contract_address,
      label: request.target.contract_label,
    },
    functions: [],
    events: [],
  };
}

function buildDuneCapture(bundle) {
  const request = bundle.artifacts.retrieval_request;
  return {
    experiment_id: bundle.descriptor.experiment_id,
    contract: {
      chain: request.target.chain,
      address: request.target.contract_address,
      label: request.target.contract_label,
    },
    metrics: request.dune_request.target_metrics.map((metricName) => ({
      metric_name: metricName,
      granularity: "day",
      trend_hint: "replace_me_trend_hint",
      notes: "Populate this metric with a compact interpretation of the observed trend.",
      source_ref: "replace-me",
    })),
  };
}

function buildSimulationCapture(bundle) {
  const request = bundle.artifacts.retrieval_request;
  return {
    experiment_id: bundle.descriptor.experiment_id,
    simulation_blueprint: {
      name: bundle.descriptor.experiment_id,
      description: `Placeholder simulation MCP capture for ${request.target.contract_label}.`,
      entities: [],
      notes: "Optional file for simulation-side notes, blueprint suggestions, or dry-run captures.",
    },
    notes: "Populate only if the simulation MCP server returns useful pre-blueprint artifacts.",
  };
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function main() {
  const { inputPath } = parseArgs(process.argv);
  if (!inputPath) {
    console.error("Usage: node scripts/prepare-raw-captures.js <experiment-directory>");
    process.exit(1);
  }

  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validatePrerequisites(bundle);

  if (issues.length > 0) {
    console.error("Refusing to prepare raw captures because prerequisite validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  writeJson(bundle.artifactPaths.etherscan_mcp_capture, buildEtherscanCapture(bundle));
  writeJson(bundle.artifactPaths.dune_mcp_capture, buildDuneCapture(bundle));
  writeJson(bundle.artifactPaths.simulation_mcp_capture, buildSimulationCapture(bundle));

  console.log(`Prepared: ${bundle.artifactPaths.etherscan_mcp_capture}`);
  console.log(`Prepared: ${bundle.artifactPaths.dune_mcp_capture}`);
  console.log(`Prepared: ${bundle.artifactPaths.simulation_mcp_capture}`);
  console.log("Populate these files with MCP results before assembling raw retrieval.");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
