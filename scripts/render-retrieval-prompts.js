#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  resolveExperimentDir,
} = require("./lib/experiment-framework");
const { updateRunManifest } = require("./update-run-manifest");

function parseArgs(argv) {
  const args = argv.slice(2);
  const inputPath = args.find((arg) => !arg.startsWith("--"));
  const updateManifest = args.includes("--update-manifest");
  return { inputPath, updateManifest };
}

function validatePrerequisites(bundle, repoRoot) {
  const issues = [];
  const descriptor = bundle.descriptor;
  const request = bundle.artifacts.retrieval_request;

  if (!descriptor.experiment_id) {
    issues.push("Missing descriptor field 'experiment_id'");
  }
  if (!descriptor.templates?.etherscan) {
    issues.push("Missing descriptor template 'etherscan'");
  }
  if (!descriptor.templates?.dune) {
    issues.push("Missing descriptor template 'dune'");
  }
  for (const templatePath of [descriptor.templates?.etherscan, descriptor.templates?.dune].filter(Boolean)) {
    if (!fs.existsSync(path.resolve(repoRoot, templatePath))) {
      issues.push(`Missing template file: ${templatePath}`);
    }
  }
  if (!bundle.artifactPaths.rendered_retrieval_prompts) {
    issues.push("Descriptor does not define artifact path for 'rendered_retrieval_prompts'");
  }
  if (!request) {
    issues.push("Missing retrieval-request.json");
  } else {
    if (!request.target?.chain || !request.target?.contract_address) {
      issues.push("retrieval-request.json must include target.chain and target.contract_address");
    }
    if (!request.etherscan_request?.template) {
      issues.push("retrieval-request.json must include etherscan_request.template");
    }
    if (!request.dune_request?.template) {
      issues.push("retrieval-request.json must include dune_request.template");
    }
  }

  return issues;
}

function renderEtherscanPrompt(request) {
  const inputs = {
    chain: request.target.chain,
    contract_address: request.target.contract_address,
    contract_label: request.target.contract_label,
  };

  return {
    template: request.etherscan_request.template,
    inputs,
    rendered_text: `Retrieve contract-level evidence for the ${inputs.chain} contract ${inputs.contract_address} labeled ${inputs.contract_label}. Return simulation-relevant functions, emitted events, and any available gas or cost signals as structured JSON.`,
  };
}

function renderDunePrompt(request) {
  const inputs = {
    chain: request.target.chain,
    contract_address: request.target.contract_address,
    analysis_window: request.dune_request.analysis_window,
    target_metrics: request.dune_request.target_metrics,
  };

  return {
    template: request.dune_request.template,
    inputs,
    rendered_text: `Retrieve Dune-compatible adoption trends for the ${inputs.chain} contract ${inputs.contract_address} over the ${inputs.analysis_window} window. Focus on ${inputs.target_metrics.join(", ")}, and return structured JSON with provenance and compact trend hints.`,
  };
}

function main() {
  const { inputPath, updateManifest } = parseArgs(process.argv);
  if (!inputPath) {
    console.error("Usage: node scripts/render-retrieval-prompts.js <experiment-directory> [--update-manifest]");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validatePrerequisites(bundle, repoRoot);

  if (issues.length > 0) {
    console.error("Refusing to render retrieval prompts because prerequisite validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const request = bundle.artifacts.retrieval_request;
  if (!request) {
    console.error("Missing retrieval-request.json");
    process.exit(1);
  }

  const rendered = {
    experiment_id: request.experiment_id,
    etherscan_prompt: renderEtherscanPrompt(request),
    dune_prompt: renderDunePrompt(request),
  };

  const outputPath = bundle.artifactPaths.rendered_retrieval_prompts;
  fs.writeFileSync(outputPath, `${JSON.stringify(rendered, null, 2)}\n`);
  if (updateManifest) {
    updateRunManifest(experimentDir, "generation", {
      generator: "scripts/render-retrieval-prompts.js",
    });
  }
  console.log(`Rendered retrieval prompts at ${outputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
