#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  resolveExperimentDir,
  validateExperimentBundle,
} = require("./lib/experiment-framework");
const { updateRunManifest } = require("./update-run-manifest");

const SUPPORTED_DISTRIBUTION_TYPES = new Set([
  "UNIFORM",
  "NORMAL",
  "NORMAL_SCALED",
  "LOGNORMAL",
  "LOGNORMAL_SCALED",
  "EXPONENTIAL",
  "EXPONENTIAL_SCALED",
  "FIXED",
  "BASS",
  "BASS_CUMULATIVE",
  "GARTNER_SASAKI",
]);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function findById(collection, idKey, idValue) {
  return (Array.isArray(collection) ? collection : []).find((item) => item?.[idKey] === idValue);
}

function parsePathSegment(segment) {
  const match = /^([a-zA-Z0-9_]+)(?:\[([^\]]+)])?$/.exec(segment);
  if (!match) {
    throw new Error(`Unsupported review edit path segment: ${segment}`);
  }
  return {
    property: match[1],
    selector: match[2] || null,
  };
}

function applyReviewEdits(reviewDecision, medProposal, probabilityProposal) {
  const medProposalCopy = deepClone(medProposal);
  const probabilityProposalCopy = deepClone(probabilityProposal);

  for (const edit of reviewDecision.edits || []) {
    const segments = String(edit.target || "").split(".").filter(Boolean).map(parsePathSegment);
    if (!segments.length) {
      continue;
    }

    let root;
    if (segments[0].property === "meds") {
      root = medProposalCopy;
    } else if (segments[0].property === "models") {
      root = probabilityProposalCopy;
    } else {
      throw new Error(`Unsupported review edit root in target: ${edit.target}`);
    }

    let current = root;
    for (let index = 0; index < segments.length - 1; index += 1) {
      const { property, selector } = segments[index];
      current = current[property];
      if (selector !== null) {
        const idKey = property === "meds" ? "med_id" : "model_id";
        current = findById(current, idKey, selector);
      }
      if (current === undefined) {
        throw new Error(`Review edit target could not be resolved: ${edit.target}`);
      }
    }

    const last = segments[segments.length - 1];
    if (last.selector !== null) {
      const idKey = last.property === "meds" ? "med_id" : "model_id";
      const targetItem = findById(current[last.property], idKey, last.selector);
      if (!targetItem) {
        throw new Error(`Review edit target could not be resolved: ${edit.target}`);
      }
      Object.assign(targetItem, edit.new);
    } else {
      current[last.property] = edit.new;
    }
  }

  return {
    medProposal: medProposalCopy,
    probabilityProposal: probabilityProposalCopy,
  };
}

function buildSimulationInput(bundle) {
  const blueprint = bundle.artifacts.simulation_blueprint;
  const reviewDecision = bundle.artifacts.review_decision;
  const medProposal = bundle.artifacts.med_proposal;
  const probabilityProposal = bundle.artifacts.probability_model_proposal;

  if (!blueprint) {
    throw new Error("Missing simulation_blueprint artifact.");
  }
  if (!reviewDecision) {
    throw new Error("Missing review_decision artifact.");
  }
  if (!["approved", "approved_with_edits"].includes(reviewDecision.status)) {
    throw new Error(`Review status '${reviewDecision.status}' does not allow simulation generation.`);
  }

  const reviewedArtifacts = applyReviewEdits(reviewDecision, medProposal, probabilityProposal);
  const reviewedMeds = reviewedArtifacts.medProposal.meds || [];
  const reviewedModels = reviewedArtifacts.probabilityProposal.models || [];

  const events = (blueprint.event_templates || []).map((template) => {
    const med = findById(reviewedMeds, "med_id", template.med_id);
    if (!med) {
      throw new Error(`Blueprint references unknown MED '${template.med_id}'.`);
    }

    const dependencies = (template.dependencies || []).map((dependencyTemplate) => {
      const model = findById(reviewedModels, "model_id", dependencyTemplate.model_id);
      if (!model) {
        throw new Error(`Blueprint references unknown probability model '${dependencyTemplate.model_id}'.`);
      }
      if (!SUPPORTED_DISTRIBUTION_TYPES.has(model.distribution_type)) {
        throw new Error(
          `Probability model '${model.model_id}' uses unsupported distribution type '${model.distribution_type}'.`
        );
      }

      return {
        dependOn: dependencyTemplate.depend_on,
        maxProbabilityMatches: dependencyTemplate.max_probability_matches ?? null,
        probabilityDistribution: {
          type: model.distribution_type,
          ...deepClone(model.parameters || {}),
        },
      };
    });

    return {
      eventName: template.event_name,
      description: template.description || `Derived from MED ${med.med_id}`,
      instanceOf: template.instance_of,
      dependencies,
      gasCost: template.gas_cost_override ?? med.cost_model.representative_gas,
    };
  });

  return {
    name: blueprint.simulation.name,
    description: blueprint.simulation.description,
    entities: blueprint.simulation.entities,
    events,
    numAggr: blueprint.simulation.numAggr,
    maxTime: blueprint.simulation.maxTime,
    numRuns: blueprint.simulation.numRuns,
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/generate-simulation-input.js <experiment-directory>");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot);

  if (issues.length > 0) {
    console.error("Refusing to generate simulation input because validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const simulationInput = buildSimulationInput(bundle);
  const outputPath = bundle.artifactPaths.simulation_input;
  fs.writeFileSync(outputPath, `${JSON.stringify(simulationInput, null, 2)}\n`);
  updateRunManifest(experimentDir, "generation", {
    generator: "scripts/generate-simulation-input.js",
  });
  console.log(`Generated simulation input at ${outputPath}`);
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
  applyReviewEdits,
  buildSimulationInput,
};
