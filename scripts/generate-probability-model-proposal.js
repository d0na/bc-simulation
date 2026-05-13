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

function generateProposal(bundle) {
  const rulesArtifact = bundle.artifacts.probability_model_rules;
  const medProposal = bundle.artifacts.med_proposal;
  const evidence = bundle.artifacts.retrieval_evidence;

  if (!rulesArtifact) {
    throw new Error("Missing probability-model-rules.json");
  }
  if (!medProposal) {
    throw new Error("Missing med-proposal.json");
  }
  if (!evidence) {
    throw new Error("Missing retrieval-evidence.json");
  }

  const medIds = new Set((medProposal.meds || []).map((med) => med.med_id));
  const metricIndex = indexByName(evidence.dune?.metrics);

  const models = (rulesArtifact.rules || []).map((rule) => {
    if (!medIds.has(rule.target_med)) {
      throw new Error(`Probability model rule '${rule.model_id}' targets unknown MED '${rule.target_med}'.`);
    }

    const evidenceRefs = (rule.metric_names || [])
      .filter((name) => metricIndex.has(name))
      .map((name) => `dune.metrics.${name}`);

    return {
      model_id: rule.model_id,
      target_med: rule.target_med,
      distribution_type: rule.distribution_type,
      parameters: rule.parameters,
      ...(rule.heuristic_parameters?.length ? { heuristic_parameters: rule.heuristic_parameters } : {}),
      evidence_refs: evidenceRefs,
      confidence: rule.confidence,
      notes: rule.notes,
    };
  });

  return {
    experiment_id: bundle.descriptor.experiment_id,
    status: "proposed",
    models,
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/generate-probability-model-proposal.js <experiment-directory>");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot).filter(
    (issue) => !issue.includes("probability-model-proposal.json")
  );

  if (issues.length > 0) {
    console.error("Refusing to generate probability model proposal because prerequisite validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const proposal = generateProposal(bundle);
  const outputPath = bundle.artifactPaths.probability_model_proposal;
  fs.writeFileSync(outputPath, `${JSON.stringify(proposal, null, 2)}\n`);
  updateRunManifest(experimentDir, "generation", {
    generator: "scripts/generate-probability-model-proposal.js",
  });
  console.log(`Generated probability model proposal at ${outputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
