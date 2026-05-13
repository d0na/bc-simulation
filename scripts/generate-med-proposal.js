#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  resolveExperimentDir,
  validateExperimentBundle,
} = require("./lib/experiment-framework");
const { updateRunManifest } = require("./update-run-manifest");

function indexByName(items) {
  const index = new Map();
  for (const item of items || []) {
    if (item?.name) {
      index.set(item.name, item);
    }
  }
  return index;
}

function chooseGas(functions, strategy) {
  const gasValues = functions
    .map((entry) => entry.gas_estimate)
    .filter((value) => Number.isFinite(value));

  if (!gasValues.length) {
    return 0;
  }
  if (strategy === "first_function_gas") {
    return gasValues[0];
  }
  return Math.max(...gasValues);
}

function buildEvidenceRefs(rule, functionIndex, eventIndex, metricIndex) {
  const refs = [];
  for (const name of rule.function_names || []) {
    if (functionIndex.has(name)) {
      refs.push(`etherscan.functions.${name}`);
    }
  }
  for (const name of rule.event_names || []) {
    if (eventIndex.has(name)) {
      refs.push(`etherscan.events.${name}`);
    }
  }
  for (const name of rule.metric_names || []) {
    if (metricIndex.has(name)) {
      refs.push(`dune.metrics.${name}`);
    }
  }
  return refs;
}

function generateProposal(bundle) {
  const rulesArtifact = bundle.artifacts.med_aggregation_rules;
  const evidence = bundle.artifacts.retrieval_evidence;

  if (!rulesArtifact) {
    throw new Error("Missing med-aggregation-rules.json");
  }
  if (!evidence) {
    throw new Error("Missing retrieval-evidence.json");
  }

  const functionIndex = indexByName(evidence.etherscan?.functions);
  const eventIndex = indexByName(evidence.etherscan?.events);
  const metricIndex = indexByName(evidence.dune?.metrics);

  const meds = (rulesArtifact.rules || []).map((rule) => {
    const matchedFunctions = (rule.function_names || []).filter((name) => functionIndex.has(name));
    const matchedEvents = (rule.event_names || []).filter((name) => eventIndex.has(name));
    const matchedMetrics = (rule.metric_names || []).filter((name) => metricIndex.has(name));

    const resolvedFunctions = matchedFunctions.map((name) => functionIndex.get(name));
    const representativeGas = chooseGas(resolvedFunctions, rule.gas_strategy || "max_function_gas");

    return {
      med_id: rule.med_id,
      label: rule.label,
      maps_to: {
        functions: matchedFunctions,
        events: matchedEvents,
      },
      cost_model: {
        representative_gas: representativeGas,
      },
      rationale: rule.rationale_template,
      evidence_refs: buildEvidenceRefs(rule, functionIndex, eventIndex, metricIndex),
      ...(matchedMetrics.length ? { observed_metrics: matchedMetrics } : {}),
    };
  });

  return {
    experiment_id: bundle.descriptor.experiment_id,
    status: "proposed",
    meds,
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/generate-med-proposal.js <experiment-directory>");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot).filter(
    (issue) => !issue.includes("med-proposal.json")
  );

  if (issues.length > 0) {
    console.error("Refusing to generate MED proposal because prerequisite validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const proposal = generateProposal(bundle);
  const outputPath = bundle.artifactPaths.med_proposal;
  fs.writeFileSync(outputPath, `${JSON.stringify(proposal, null, 2)}\n`);
  updateRunManifest(experimentDir, "generation", {
    generator: "scripts/generate-med-proposal.js",
  });
  console.log(`Generated MED proposal at ${outputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
