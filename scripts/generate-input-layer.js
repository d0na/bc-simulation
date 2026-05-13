#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const {
  loadExperimentBundle,
  resolveExperimentDir,
} = require("./lib/experiment-framework");

const DEFAULT_MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are generating draft input layer files for a blockchain simulation experiment.

You will produce three consistent files:

1. med_aggregation_rules: groups contract functions, events, and metrics into Macro Event Descriptors (MEDs)
2. probability_model_rules: assigns a probability distribution to each MED based on observed metrics
3. simulation_blueprint: maps each MED to a backend simulation event, with entity types and model references

Consistency rules:
- Every target_med in probability_model_rules must match a med_id in med_aggregation_rules
- Every model_id in simulation_blueprint event_templates must match a model_id in probability_model_rules
- These are DRAFTS: mark uncertain parameters in heuristic_parameters

Distribution types to use:
- UNIFORM: stable, low-frequency activity with no strong temporal pattern
- NORMAL_SCALED: activity concentrated in identifiable windows (e.g. proposal voting periods)
- POISSON: random independent arrivals with a known average rate

Confidence levels:
- high: directly supported by observed metrics
- medium: inferred from partial evidence or structural patterns
- low: educated guess based on objective alone, no metrics available

Be parsimonious: propose only MEDs and models well-supported by the objective or evidence.
Use snake_case for all identifiers.`;

const TOOL_SCHEMA = {
  name: "write_input_layer",
  description: "Write the three input layer draft files for the experiment.",
  input_schema: {
    type: "object",
    required: ["med_aggregation_rules", "probability_model_rules", "simulation_blueprint"],
    properties: {
      med_aggregation_rules: {
        type: "object",
        required: ["rules"],
        properties: {
          rules: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["med_id", "label", "function_names", "event_names", "metric_names", "rationale_template"],
              properties: {
                med_id: { type: "string" },
                label: { type: "string" },
                function_names: { type: "array", items: { type: "string" } },
                event_names: { type: "array", items: { type: "string" } },
                metric_names: { type: "array", items: { type: "string" } },
                gas_strategy: { type: "string", enum: ["max_function_gas", "first_function_gas"] },
                rationale_template: { type: "string" },
              },
            },
          },
        },
      },
      probability_model_rules: {
        type: "object",
        required: ["rules"],
        properties: {
          rules: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["model_id", "target_med", "distribution_type", "parameters", "metric_names", "confidence", "notes"],
              properties: {
                model_id: { type: "string" },
                target_med: { type: "string" },
                distribution_type: { type: "string" },
                parameters: { type: "object" },
                heuristic_parameters: { type: "array", items: { type: "string" } },
                metric_names: { type: "array", minItems: 1, items: { type: "string" } },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      simulation_blueprint: {
        type: "object",
        required: ["simulation", "event_templates"],
        properties: {
          simulation: {
            type: "object",
            required: ["name", "description", "entities", "numAggr", "maxTime", "numRuns"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              entities: { type: "array", minItems: 1, items: { type: "string" } },
              numAggr: { type: "integer", minimum: 1 },
              maxTime: { type: "integer", minimum: 1 },
              numRuns: { type: "integer", minimum: 1 },
            },
          },
          event_templates: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["med_id", "event_name", "instance_of", "dependencies"],
              properties: {
                med_id: { type: "string" },
                event_name: { type: "string" },
                description: { type: "string" },
                instance_of: { type: ["string", "null"] },
                dependencies: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    required: ["model_id", "depend_on"],
                    properties: {
                      model_id: { type: "string" },
                      depend_on: { type: ["string", "null"] },
                      max_probability_matches: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

function validatePrerequisites(bundle) {
  const issues = [];
  if (!bundle.descriptor.experiment_id) {
    issues.push("Missing descriptor field 'experiment_id'");
  }
  if (!bundle.descriptor.objective) {
    issues.push("Missing descriptor field 'objective'");
  }
  if (!bundle.artifactPaths.med_aggregation_rules) {
    issues.push("Descriptor does not define artifact path for 'med_aggregation_rules'");
  }
  if (!bundle.artifactPaths.probability_model_rules) {
    issues.push("Descriptor does not define artifact path for 'probability_model_rules'");
  }
  if (!bundle.artifactPaths.simulation_blueprint) {
    issues.push("Descriptor does not define artifact path for 'simulation_blueprint'");
  }
  return issues;
}

function loadObjectiveText(experimentDir) {
  const objectivePath = path.join(experimentDir, "00-overview", "00-objective.md");
  if (fs.existsSync(objectivePath)) {
    return fs.readFileSync(objectivePath, "utf8").trim();
  }
  return null;
}

function buildUserMessage(bundle, objectiveText) {
  const descriptor = bundle.descriptor;
  const evidence = bundle.artifacts.retrieval_evidence;

  const parts = [];
  parts.push(`Experiment ID: ${descriptor.experiment_id}`);
  parts.push(`\nObjective:\n${objectiveText || descriptor.objective}`);

  if (evidence?.contract) {
    const { chain, address, label } = evidence.contract;
    parts.push(`\nContract: ${chain} / ${address}${label ? ` (${label})` : ""}`);
  }

  if (evidence) {
    parts.push(`\nRetrieval Evidence (use this to ground the rules):\n${JSON.stringify(evidence, null, 2)}`);
  } else {
    parts.push("\nNo retrieval evidence is available yet. Generate conservative drafts based on the objective alone.");
  }

  parts.push("\nGenerate the three input layer draft files.");
  return parts.join("\n");
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/generate-input-layer.js <experiment-directory>");
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validatePrerequisites(bundle);

  if (issues.length > 0) {
    console.error("Refusing to generate input layer because prerequisite validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const objectiveText = loadObjectiveText(experimentDir);
  const userMessage = buildUserMessage(bundle, objectiveText);
  const client = new Anthropic({ apiKey });

  console.log("Generating input layer drafts...");
  if (bundle.artifacts.retrieval_evidence) {
    console.log("Using retrieval evidence as context.");
  } else {
    console.log("No retrieval evidence found — generating from objective only.");
  }

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [TOOL_SCHEMA],
    tool_choice: { type: "tool", name: "write_input_layer" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse) {
    console.error("No tool_use block in API response");
    process.exit(1);
  }

  const { med_aggregation_rules, probability_model_rules, simulation_blueprint } = toolUse.input;
  const experimentId = bundle.descriptor.experiment_id;

  const rulesFile = { experiment_id: experimentId, ...med_aggregation_rules };
  const probFile = { experiment_id: experimentId, ...probability_model_rules };
  const blueprintFile = { experiment_id: experimentId, ...simulation_blueprint };

  fs.writeFileSync(bundle.artifactPaths.med_aggregation_rules, `${JSON.stringify(rulesFile, null, 2)}\n`);
  fs.writeFileSync(bundle.artifactPaths.probability_model_rules, `${JSON.stringify(probFile, null, 2)}\n`);
  fs.writeFileSync(bundle.artifactPaths.simulation_blueprint, `${JSON.stringify(blueprintFile, null, 2)}\n`);

  console.log(`Generated: ${bundle.artifactPaths.med_aggregation_rules}`);
  console.log(`Generated: ${bundle.artifactPaths.probability_model_rules}`);
  console.log(`Generated: ${bundle.artifactPaths.simulation_blueprint}`);
  console.log("Review and edit these files before continuing with the pipeline.");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
