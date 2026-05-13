#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  fileSha256,
  getGitHead,
  loadExperimentBundle,
  readJson,
  relativeToRepo,
  resolveExperimentDir,
  validateExperimentBundle,
} = require("./lib/experiment-framework");

function buildArtifactHashes(bundle, repoRoot) {
  const hashes = {};
  for (const [key, absolutePath] of Object.entries(bundle.artifactPaths)) {
    if (key !== "run_manifest" && absolutePath.endsWith(".json") && fs.existsSync(absolutePath)) {
      hashes[key] = {
        path: relativeToRepo(repoRoot, absolutePath),
        sha256: fileSha256(absolutePath),
      };
    }
  }
  return hashes;
}

function buildManifestInputs(descriptor) {
  const inputs = {
    experiment_descriptor: "experiment.json",
  };

  for (const [key, relativePath] of Object.entries(descriptor.artifacts || {})) {
    if (key === "run_manifest" || key === "validation_report") {
      continue;
    }
    inputs[key] = relativePath;
  }

  return inputs;
}

function updateRunManifest(experimentDir, stage, options = {}) {
  const repoRoot = path.resolve(__dirname, "..");
  const resolvedExperimentDir = resolveExperimentDir(experimentDir);
  const bundle = loadExperimentBundle(resolvedExperimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot);

  if (issues.length > 0) {
    throw new Error(`Refusing to update run manifest because validation failed:\n- ${issues.join("\n- ")}`);
  }

  const runManifestPath = bundle.artifactPaths.run_manifest;
  const runManifest = readJson(runManifestPath);
  const gitHead = getGitHead(repoRoot);
  const artifactHashes = buildArtifactHashes(bundle, repoRoot);
  const now = new Date().toISOString();

  const nextManifest = {
    ...runManifest,
    code_version: gitHead ? `git:${gitHead}` : runManifest.code_version || "git:unresolved",
    artifact_hashes: artifactHashes,
    inputs: buildManifestInputs(bundle.descriptor),
  };

  if (stage === "generation") {
    nextManifest.generation = {
      generated_at: now,
      generator: options.generator || "scripts/generate-simulation-input.js",
      source_artifacts: {
        retrieval_request: artifactHashes.retrieval_request,
        rendered_retrieval_prompts: artifactHashes.rendered_retrieval_prompts,
        raw_mcp_retrieval: artifactHashes.raw_mcp_retrieval,
        med_aggregation_rules: artifactHashes.med_aggregation_rules,
        med_proposal: artifactHashes.med_proposal,
        probability_model_rules: artifactHashes.probability_model_rules,
        probability_model_proposal: artifactHashes.probability_model_proposal,
        review_decision: artifactHashes.review_decision,
        simulation_blueprint: artifactHashes.simulation_blueprint,
      },
      output_artifact: artifactHashes.simulation_input,
    };
  } else if (stage === "validation") {
    nextManifest.validation = {
      validated_at: now,
      validator: "scripts/validate-experiment.js",
      result: "pass",
    };
  } else {
    throw new Error(`Unsupported stage '${stage}'. Use 'generation' or 'validation'.`);
  }

  fs.writeFileSync(runManifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);
  return runManifestPath;
}

function main() {
  const experimentDir = process.argv[2];
  const stage = process.argv[3] || "generation";
  if (!experimentDir) {
    console.error("Usage: node scripts/update-run-manifest.js <experiment-directory> [generation|validation]");
    process.exit(1);
  }

  const runManifestPath = updateRunManifest(experimentDir, stage);
  console.log(`Updated run manifest at ${runManifestPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  updateRunManifest,
};
