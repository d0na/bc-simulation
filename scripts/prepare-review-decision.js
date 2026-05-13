#!/usr/bin/env node

const fs = require("fs");
const {
  fileSha256,
  loadExperimentBundle,
  resolveExperimentDir,
} = require("./lib/experiment-framework");
const { updateRunManifest } = require("./update-run-manifest");

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const inputPath = args.find((arg) => !arg.startsWith("--"));
  const updateManifest = args.includes("--update-manifest");

  return {
    inputPath,
    updateManifest,
  };
}

function validatePrerequisites(bundle) {
  const issues = [];
  const descriptor = bundle.descriptor;
  const retrievalEvidence = bundle.artifacts.retrieval_evidence;
  const medProposal = bundle.artifacts.med_proposal;
  const probabilityProposal = bundle.artifacts.probability_model_proposal;

  for (const key of ["retrieval_evidence", "med_proposal", "probability_model_proposal", "review_decision"]) {
    if (!bundle.artifactPaths[key]) {
      issues.push(`Descriptor does not define artifact path for '${key}'`);
    }
  }

  if (!retrievalEvidence) {
    issues.push("Missing artifact file 'retrieval_evidence'");
  } else if (retrievalEvidence.experiment_id !== descriptor.experiment_id) {
    issues.push("retrieval-evidence.json experiment_id does not match experiment.json");
  }

  const medIds = new Set();
  if (!medProposal) {
    issues.push("Missing artifact file 'med_proposal'");
  } else {
    if (medProposal.experiment_id !== descriptor.experiment_id) {
      issues.push("med-proposal.json experiment_id does not match experiment.json");
    }
    if (medProposal.status !== "proposed") {
      issues.push("med-proposal.json status must be 'proposed'");
    }
    for (const med of ensureArray(medProposal.meds)) {
      if (!med.med_id) {
        issues.push("Every MED must define med_id");
      } else {
        medIds.add(med.med_id);
      }
      if (!ensureArray(med.evidence_refs).length) {
        issues.push(`MED '${med.med_id || "<missing>"}' must contain at least one evidence reference`);
      }
    }
  }

  if (!probabilityProposal) {
    issues.push("Missing artifact file 'probability_model_proposal'");
  } else {
    if (probabilityProposal.experiment_id !== descriptor.experiment_id) {
      issues.push("probability-model-proposal.json experiment_id does not match experiment.json");
    }
    if (probabilityProposal.status !== "proposed") {
      issues.push("probability-model-proposal.json status must be 'proposed'");
    }
    for (const model of ensureArray(probabilityProposal.models)) {
      if (!medIds.has(model.target_med)) {
        issues.push(`Probability model '${model.model_id}' targets unknown MED '${model.target_med}'`);
      }
      if (!ensureArray(model.evidence_refs).length) {
        issues.push(`Probability model '${model.model_id}' must contain at least one evidence reference`);
      }
    }
  }

  return issues;
}

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
    retrieval_evidence: bundle.descriptor.artifacts.retrieval_evidence,
    med_proposal: bundle.descriptor.artifacts.med_proposal,
    probability_model_proposal: bundle.descriptor.artifacts.probability_model_proposal,
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
  const { inputPath, updateManifest } = parseArgs(process.argv);
  if (!inputPath) {
    console.error("Usage: node scripts/prepare-review-decision.js <experiment-directory> [--update-manifest]");
    process.exit(1);
  }

  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validatePrerequisites(bundle);

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
  if (updateManifest) {
    updateRunManifest(experimentDir, "generation", {
      generator: "scripts/prepare-review-decision.js",
    });
  }
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
