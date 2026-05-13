#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  fileSha256,
  loadExperimentBundle,
  resolveExperimentDir,
  validateExperimentBundle,
} = require("./lib/experiment-framework");
const { updateRunManifest } = require("./update-run-manifest");

function buildApprovedArtifactHashes(bundle) {
  return {
    retrieval_evidence: fileSha256(bundle.artifactPaths.retrieval_evidence),
    med_proposal: fileSha256(bundle.artifactPaths.med_proposal),
    probability_model_proposal: fileSha256(bundle.artifactPaths.probability_model_proposal),
  };
}

function buildReviewDecision(bundle) {
  const existing = bundle.artifacts.review_decision || {};
  const approvedArtifacts = {
    retrieval_evidence: "retrieval-evidence.json",
    med_proposal: "med-proposal.json",
    probability_model_proposal: "probability-model-proposal.json",
  };

  const status =
    existing.status && existing.status !== "approved" && existing.status !== "approved_with_edits"
      ? existing.status
      : existing.status || "pending_review";

  return {
    experiment_id: bundle.descriptor.experiment_id,
    reviewer: existing.reviewer || "pending-human-review",
    status,
    approved_artifacts: approvedArtifacts,
    approved_artifact_hashes: buildApprovedArtifactHashes(bundle),
    edits: existing.edits || [],
    notes:
      existing.notes ||
      "Review pending. Confirm or edit the generated MED and probability proposals before simulation input generation.",
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/prepare-review-decision.js <experiment-directory>");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot).filter(
    (issue) => !issue.includes("review-decision.json")
  );

  if (issues.length > 0) {
    console.error("Refusing to prepare review decision because prerequisite validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const reviewDecision = buildReviewDecision(bundle);
  const outputPath = bundle.artifactPaths.review_decision;
  fs.writeFileSync(outputPath, `${JSON.stringify(reviewDecision, null, 2)}\n`);
  updateRunManifest(experimentDir, "generation", {
    generator: "scripts/prepare-review-decision.js",
  });
  console.log(`Prepared review decision at ${outputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
