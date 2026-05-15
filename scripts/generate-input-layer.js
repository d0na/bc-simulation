#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  resolveExperimentDir,
} = require("./lib/experiment-framework");

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_PROVIDER = process.env.SESAME_INPUT_LAYER_PROVIDER || "local";

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

function loadDiscoveryBrief(bundle) {
  const brief = bundle.artifacts.discovery_brief;
  return brief && typeof brief === "object" ? brief : {};
}

function buildUserMessage(bundle, discoveryBrief) {
  const descriptor = bundle.descriptor;
  const evidence = bundle.artifacts.retrieval_evidence;

  const parts = [];
  parts.push(`Experiment ID: ${descriptor.experiment_id}`);
  parts.push(`\nObjective:\n${discoveryBrief.goal || descriptor.objective}`);
  if (discoveryBrief.target_name || discoveryBrief.target_type) {
    parts.push(`\nDiscovery Brief:\n${JSON.stringify(discoveryBrief, null, 2)}`);
  }

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

function toSnakeCase(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function toTitleCase(value) {
  return String(value || "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferTrendDistribution(metric) {
  const hint = String(metric?.trend_hint || "").toLowerCase();
  if (hint.includes("burst") || hint.includes("window") || hint.includes("proposal")) {
    return {
      distribution_type: "NORMAL_SCALED",
      parameters: {
        mean: 24,
        std: 12,
        scalingFactorX: 0.1,
        scalingFactorY: 0.35,
      },
      heuristic_parameters: ["mean", "std", "scalingFactorX", "scalingFactorY"],
      confidence: "low",
      notes: "Windowed concentration inferred from trend hints; parameters remain heuristic until reviewed.",
    };
  }
  if (hint.includes("random") || hint.includes("sporadic")) {
    return {
      distribution_type: "POISSON",
      parameters: { lambda: 1 },
      heuristic_parameters: ["lambda"],
      confidence: "low",
      notes: "Poisson draft used as a neutral random-arrival baseline.",
    };
  }
  return {
    distribution_type: "UNIFORM",
    parameters: { value: 0.001 },
    heuristic_parameters: ["value"],
    confidence: hint ? "medium" : "low",
    notes: "Uniform draft used as a conservative baseline for low or stable activity.",
  };
}

function inferEntities(medRules) {
  const entities = new Set(["user"]);
  for (const rule of medRules) {
    if (rule.med_id.includes("proposal")) entities.add("proposal");
    else if (rule.med_id.includes("vote")) entities.add("vote");
    else if (rule.med_id.includes("mint")) entities.add("token");
    else if (rule.med_id.includes("sale")) entities.add("sale");
    else if (rule.med_id.includes("transfer")) entities.add("transfer");
    else if (rule.med_id.includes("auction")) entities.add("auction");
    else entities.add("activity");
  }
  return Array.from(entities);
}

function defaultInstanceOf(medId) {
  if (medId.includes("proposal")) return "proposal";
  if (medId.includes("vote")) return "vote";
  if (medId.includes("mint")) return "token";
  if (medId.includes("sale")) return "sale";
  if (medId.includes("transfer")) return "transfer";
  if (medId.includes("auction")) return "auction";
  return "activity";
}

function defaultDependOn(index, medId, medRules) {
  if (index === 0) return "user";
  const prior = medRules[index - 1];
  if (medId.includes("vote") && medRules.some((rule) => rule.med_id.includes("proposal"))) {
    return "proposal";
  }
  if (medId.includes("sale") && medRules.some((rule) => rule.med_id.includes("mint"))) {
    return "token";
  }
  return defaultInstanceOf(prior.med_id);
}

function buildLocalDraft(bundle, discoveryBrief) {
  const descriptor = bundle.descriptor;
  const evidence = bundle.artifacts.retrieval_evidence || {};
  const functions = Array.isArray(evidence.etherscan?.functions) ? evidence.etherscan.functions : [];
  const events = Array.isArray(evidence.etherscan?.events) ? evidence.etherscan.events : [];
  const metrics = Array.isArray(evidence.dune?.metrics) ? evidence.dune.metrics : [];

  const medRules = [];

  if (functions.length > 0 || events.length > 0) {
    const items = Math.max(functions.length, events.length, 1);
    for (let index = 0; index < items; index += 1) {
      const fn = functions[index] || null;
      const ev = events[index] || null;
      const metric = metrics[index] || metrics[0] || null;
      const baseName = fn?.name || ev?.name || `activity_${index + 1}`;
      const medId = toSnakeCase(baseName);
      medRules.push({
        med_id: medId,
        label: toTitleCase(medId),
        function_names: fn?.name ? [fn.name] : [],
        event_names: ev?.name ? [ev.name] : [],
        metric_names: metric?.name ? [metric.name] : [],
        gas_strategy: "max_function_gas",
        rationale_template: `Draft MED for ${baseName} derived from available retrieval evidence and experiment objective.`,
      });
    }
  } else {
    const objectiveSeed = toSnakeCase(descriptor.experiment_id || discoveryBrief.goal || descriptor.objective || "core_activity");
    medRules.push({
      med_id: `${objectiveSeed}_activity`,
      label: toTitleCase(`${objectiveSeed}_activity`),
      function_names: [],
      event_names: [],
      metric_names: metrics[0]?.name ? [metrics[0].name] : [],
      gas_strategy: "max_function_gas",
      rationale_template: "Conservative draft MED generated from the experiment objective without grounded contract evidence.",
    });
  }

  const probabilityRules = medRules.map((rule, index) => {
    const metric = metrics.find((item) => rule.metric_names.includes(item.name)) || metrics[index] || metrics[0] || null;
    const distribution = inferTrendDistribution(metric);
    const suffix = toSnakeCase(distribution.distribution_type.toLowerCase());
    return {
      model_id: `${rule.med_id}_${suffix}`,
      target_med: rule.med_id,
      distribution_type: distribution.distribution_type,
      parameters: distribution.parameters,
      heuristic_parameters: distribution.heuristic_parameters,
      metric_names: rule.metric_names.length ? rule.metric_names : metrics.map((item) => item.name).slice(0, 1),
      confidence: distribution.confidence,
      notes: distribution.notes,
    };
  });

  const entities = inferEntities(medRules);
  const eventTemplates = medRules.map((rule, index) => {
    const model = probabilityRules[index];
    const instanceOf = defaultInstanceOf(rule.med_id);
    return {
      med_id: rule.med_id,
      event_name: rule.med_id,
      description: `Draft event generated from MED ${rule.med_id}`,
      instance_of: instanceOf,
      dependencies: [
        {
          model_id: model.model_id,
          depend_on: defaultDependOn(index, rule.med_id, medRules),
          max_probability_matches: index === 0 ? null : "#user",
        },
      ],
    };
  });

  return {
    med_aggregation_rules: {
      rules: medRules,
    },
    probability_model_rules: {
      rules: probabilityRules,
    },
    simulation_blueprint: {
      simulation: {
        name: descriptor.experiment_id,
        description: `Draft simulation blueprint for ${descriptor.experiment_id}, generated from objective and available evidence.`,
        entities,
        numAggr: 3600,
        maxTime: 1209600,
        numRuns: 5,
      },
      event_templates: eventTemplates,
    },
  };
}

function writeDraftFiles(bundle, draft) {
  const experimentId = bundle.descriptor.experiment_id;
  const rulesFile = { experiment_id: experimentId, ...draft.med_aggregation_rules };
  const probFile = { experiment_id: experimentId, ...draft.probability_model_rules };
  const blueprintFile = { experiment_id: experimentId, ...draft.simulation_blueprint };

  fs.writeFileSync(bundle.artifactPaths.med_aggregation_rules, `${JSON.stringify(rulesFile, null, 2)}\n`);
  fs.writeFileSync(bundle.artifactPaths.probability_model_rules, `${JSON.stringify(probFile, null, 2)}\n`);
  fs.writeFileSync(bundle.artifactPaths.simulation_blueprint, `${JSON.stringify(blueprintFile, null, 2)}\n`);

  console.log(`Generated: ${bundle.artifactPaths.med_aggregation_rules}`);
  console.log(`Generated: ${bundle.artifactPaths.probability_model_rules}`);
  console.log(`Generated: ${bundle.artifactPaths.simulation_blueprint}`);
  console.log("Review and edit these files before continuing with the pipeline.");
}

async function generateWithAnthropic(bundle, discoveryBrief, apiKey) {
  let Anthropic;
  try {
    Anthropic = require("@anthropic-ai/sdk");
  } catch (_) {
    throw new Error("Anthropic provider requested but '@anthropic-ai/sdk' is not installed");
  }

  const client = new Anthropic({ apiKey });
  const userMessage = buildUserMessage(bundle, discoveryBrief);

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [TOOL_SCHEMA],
    tool_choice: { type: "tool", name: "write_input_layer" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse) {
    throw new Error("No tool_use block in API response");
  }

  return toolUse.input;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/generate-input-layer.js <experiment-directory>");
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

  const discoveryBrief = loadDiscoveryBrief(bundle);
  const provider = DEFAULT_PROVIDER;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  console.log("Generating input layer drafts...");
  if (bundle.artifacts.retrieval_evidence) {
    console.log("Using retrieval evidence as context.");
  } else {
    console.log("No retrieval evidence found — generating from objective only.");
  }

  let draft;
  if (provider === "anthropic") {
    if (!anthropicApiKey) {
      throw new Error("SESAME_INPUT_LAYER_PROVIDER=anthropic requires ANTHROPIC_API_KEY");
    }
    console.log(`Using AI provider: anthropic (${DEFAULT_MODEL})`);
    draft = await generateWithAnthropic(bundle, discoveryBrief, anthropicApiKey);
  } else {
    console.log("Using local deterministic draft generator.");
    draft = buildLocalDraft(bundle, discoveryBrief);
  }

  writeDraftFiles(bundle, draft);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
