const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function resolveExperimentDir(inputPath) {
  const absolute = path.resolve(inputPath);
  const stat = fs.statSync(absolute);
  if (!stat.isDirectory()) {
    throw new Error(`Experiment path is not a directory: ${absolute}`);
  }
  return absolute;
}

function loadExperimentBundle(experimentDir) {
  const descriptorPath = path.join(experimentDir, "experiment.json");
  if (!exists(descriptorPath)) {
    throw new Error(`Missing experiment descriptor: ${descriptorPath}`);
  }

  const descriptor = readJson(descriptorPath);
  const artifactPaths = {};
  const artifacts = {};

  for (const [key, relativePath] of Object.entries(descriptor.artifacts || {})) {
    const absolutePath = path.resolve(experimentDir, relativePath);
    artifactPaths[key] = absolutePath;
    if (exists(absolutePath) && absolutePath.endsWith(".json")) {
      artifacts[key] = readJson(absolutePath);
    }
  }

  return {
    experimentDir,
    descriptorPath,
    descriptor,
    artifactPaths,
    artifacts,
  };
}

function validateExperimentBundle(bundle, repoRoot) {
  const issues = [];
  const {
    experimentDir,
    descriptor,
    descriptorPath,
    artifactPaths,
    artifacts,
  } = bundle;

  const requiredDescriptorFields = [
    "experiment_id",
    "version",
    "objective",
    "templates",
    "artifacts",
    "status",
  ];

  for (const field of requiredDescriptorFields) {
    if (!descriptor[field]) {
      issues.push(`Missing descriptor field '${field}' in ${descriptorPath}`);
    }
  }

  const templateEntries = Object.entries(descriptor.templates || {});
  for (const [, relativePath] of templateEntries) {
    const absolutePath = path.resolve(repoRoot, relativePath);
    if (!exists(absolutePath)) {
      issues.push(`Missing template file: ${relativePath}`);
    }
  }

  const requiredArtifacts = [
    "retrieval_evidence",
    "med_proposal",
    "probability_model_proposal",
    "review_decision",
    "simulation_blueprint",
    "simulation_input",
    "run_manifest",
    "validation_report",
  ];

  for (const key of requiredArtifacts) {
    if (!artifactPaths[key]) {
      issues.push(`Descriptor does not define artifact path for '${key}'`);
      continue;
    }
    if (!exists(artifactPaths[key])) {
      issues.push(`Missing artifact file '${key}': ${artifactPaths[key]}`);
    }
  }

  const experimentId = descriptor.experiment_id;
  const retrieval = artifacts.retrieval_evidence;
  const medProposal = artifacts.med_proposal;
  const probabilityProposal = artifacts.probability_model_proposal;
  const reviewDecision = artifacts.review_decision;
  const simulationBlueprint = artifacts.simulation_blueprint;
  const simulationInput = artifacts.simulation_input;
  const runManifest = artifacts.run_manifest;
  const validationReport = artifacts.validation_report;

  if (retrieval) {
    if (retrieval.experiment_id !== experimentId) {
      issues.push("retrieval-evidence.json experiment_id does not match experiment.json");
    }
    if (!retrieval.contract?.address || !retrieval.contract?.chain) {
      issues.push("retrieval-evidence.json must include contract.chain and contract.address");
    }
    if (!ensureArray(retrieval.etherscan?.functions).length) {
      issues.push("retrieval-evidence.json must include at least one Etherscan function");
    }
    if (!ensureArray(retrieval.dune?.metrics).length) {
      issues.push("retrieval-evidence.json must include at least one Dune metric");
    }
  }

  const medIds = new Set();
  if (medProposal) {
    if (medProposal.experiment_id !== experimentId) {
      issues.push("med-proposal.json experiment_id does not match experiment.json");
    }
    if (medProposal.status !== "proposed") {
      issues.push("med-proposal.json status must be 'proposed'");
    }
    for (const med of ensureArray(medProposal.meds)) {
      if (!med.med_id) {
        issues.push("Every MED must define med_id");
        continue;
      }
      medIds.add(med.med_id);
      if (!ensureArray(med.evidence_refs).length) {
        issues.push(`MED '${med.med_id}' must contain at least one evidence reference`);
      }
    }
  }

  if (probabilityProposal) {
    if (probabilityProposal.experiment_id !== experimentId) {
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

  if (reviewDecision) {
    if (reviewDecision.experiment_id !== experimentId) {
      issues.push("review-decision.json experiment_id does not match experiment.json");
    }
    if (!["approved", "approved_with_edits"].includes(reviewDecision.status)) {
      issues.push("review-decision.json status must be 'approved' or 'approved_with_edits'");
    }
    for (const [key, relativePath] of Object.entries(reviewDecision.approved_artifacts || {})) {
      const targetPath = path.resolve(experimentDir, relativePath);
      if (!exists(targetPath)) {
        issues.push(`review-decision.json references missing approved artifact '${key}': ${relativePath}`);
      }
    }
  }

  if (simulationBlueprint) {
    if (simulationBlueprint.experiment_id !== experimentId) {
      issues.push("simulation-blueprint.json experiment_id does not match experiment.json");
    }
    if (!simulationBlueprint.simulation?.name) {
      issues.push("simulation-blueprint.json must define simulation.name");
    }
    if (!ensureArray(simulationBlueprint.event_templates).length) {
      issues.push("simulation-blueprint.json must define at least one event template");
    }
  }

  if (simulationInput) {
    if (simulationInput.name !== experimentId) {
      issues.push("simulation-input.json name should match experiment_id for traceability");
    }
    if (!ensureArray(simulationInput.entities).length) {
      issues.push("simulation-input.json must include at least one entity");
    }
    if (!ensureArray(simulationInput.events).length) {
      issues.push("simulation-input.json must include at least one event");
    }
    for (const event of ensureArray(simulationInput.events)) {
      if (!event.eventName) {
        issues.push("Every simulation event must define eventName");
      }
      if (typeof event.gasCost !== "number") {
        issues.push(`Simulation event '${event.eventName || "<unnamed>"}' must define numeric gasCost`);
      }
      const dependencies = ensureArray(event.dependencies);
      if (!dependencies.length) {
        issues.push(`Simulation event '${event.eventName || "<unnamed>"}' must define at least one dependency`);
      }
      for (const dependency of dependencies) {
        if (!dependency.probabilityDistribution?.type) {
          issues.push(`Dependency in event '${event.eventName || "<unnamed>"}' must define probabilityDistribution.type`);
        }
      }
    }
  }

  if (runManifest) {
    if (runManifest.experiment_id !== experimentId) {
      issues.push("run-manifest.json experiment_id does not match experiment.json");
    }
    if (!runManifest.inputs?.simulation_input) {
      issues.push("run-manifest.json must reference the simulation input");
    }
  }

  if (validationReport) {
    if (validationReport.experiment_id !== experimentId) {
      issues.push("validation-report.json experiment_id does not match experiment.json");
    }
  }

  return issues;
}

module.exports = {
  loadExperimentBundle,
  readJson,
  resolveExperimentDir,
  validateExperimentBundle,
};
