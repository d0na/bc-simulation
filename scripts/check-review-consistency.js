#!/usr/bin/env node

const path = require("path");
const {
  fileSha256,
  loadExperimentBundle,
  resolveExperimentDir,
  validateExperimentBundle,
} = require("./lib/experiment-framework");

function checkHashes(bundle) {
  const review = bundle.artifacts.review_decision;
  const mismatches = [];

  if (!review?.approved_artifact_hashes) {
    mismatches.push("review-decision.json is missing approved_artifact_hashes");
    return mismatches;
  }

  const checks = [
    ["retrieval_evidence", bundle.artifactPaths.retrieval_evidence],
    ["med_proposal", bundle.artifactPaths.med_proposal],
    ["probability_model_proposal", bundle.artifactPaths.probability_model_proposal],
  ];

  for (const [key, absolutePath] of checks) {
    const expected = review.approved_artifact_hashes[key];
    const actual = fileSha256(absolutePath);
    if (expected !== actual) {
      mismatches.push(`${key} hash drift detected: review=${expected || "missing"} current=${actual}`);
    }
  }

  return mismatches;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/check-review-consistency.js <experiment-directory>");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot);

  if (issues.length > 0) {
    console.error("Experiment validation failed before review consistency check:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const drift = checkHashes(bundle);
  if (drift.length > 0) {
    console.error("Review consistency check failed:");
    for (const issue of drift) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log(`Review consistency passed for ${experimentDir}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
