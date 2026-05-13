#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  resolveExperimentDir,
  validateExperimentBundle,
} = require("./lib/experiment-framework");
const { updateRunManifest } = require("./update-run-manifest");

function normalizeFunction(entry) {
  return {
    name: entry.function_name || entry.name,
    kind: "function",
    ...(Number.isFinite(entry.gas_estimate) ? { gas_estimate: entry.gas_estimate } : {}),
    ...(entry.notes ? { notes: entry.notes } : {}),
    provenance: {
      source_type: "etherscan",
      source_ref: entry.source_ref || `etherscan://unknown#function:${entry.function_name || entry.name || "unnamed"}`,
    },
  };
}

function normalizeEvent(entry) {
  return {
    name: entry.event_name || entry.name,
    kind: "event",
    ...(entry.notes ? { notes: entry.notes } : {}),
    provenance: {
      source_type: "etherscan",
      source_ref: entry.source_ref || `etherscan://unknown#event:${entry.event_name || entry.name || "unnamed"}`,
    },
  };
}

function normalizeMetric(entry) {
  return {
    name: entry.metric_name || entry.name,
    granularity: entry.granularity || "unknown",
    trend_hint: entry.trend_hint || "unspecified",
    ...(entry.notes ? { notes: entry.notes } : {}),
    provenance: {
      source_type: "dune",
      source_ref: entry.source_ref || `dune://unknown/${entry.metric_name || entry.name || "unnamed"}`,
    },
  };
}

function normalizeRawRetrieval(raw) {
  return {
    experiment_id: raw.experiment_id,
    contract: {
      chain: raw.contract.chain,
      address: raw.contract.address,
      label: raw.contract.label,
    },
    etherscan: {
      functions: (raw.etherscan.functions || []).map(normalizeFunction),
      events: (raw.etherscan.events || []).map(normalizeEvent),
    },
    dune: {
      metrics: (raw.dune.metrics || []).map(normalizeMetric),
    },
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/normalize-retrieval-evidence.js <experiment-directory>");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot).filter(
    (issue) => !issue.includes("raw-mcp-retrieval.json") && !issue.includes("retrieval-evidence.json")
  );

  if (issues.length > 0) {
    console.error("Refusing to normalize retrieval evidence because prerequisite validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const raw = bundle.artifacts.raw_mcp_retrieval;
  if (!raw) {
    console.error("Missing raw-mcp-retrieval.json");
    process.exit(1);
  }

  const normalized = normalizeRawRetrieval(raw);
  const outputPath = bundle.artifactPaths.retrieval_evidence;
  fs.writeFileSync(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);
  updateRunManifest(experimentDir, "generation", {
    generator: "scripts/normalize-retrieval-evidence.js",
  });
  console.log(`Normalized retrieval evidence at ${outputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
