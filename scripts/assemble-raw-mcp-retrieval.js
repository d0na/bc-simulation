#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  resolveExperimentDir,
  validateExperimentBundle,
} = require("./lib/experiment-framework");
const { updateRunManifest } = require("./update-run-manifest");

function assemble(bundle) {
  const etherscan = bundle.artifacts.etherscan_mcp_capture;
  const dune = bundle.artifacts.dune_mcp_capture;

  if (!etherscan) {
    throw new Error("Missing etherscan-mcp-capture.json");
  }
  if (!dune) {
    throw new Error("Missing dune-mcp-capture.json");
  }

  return {
    experiment_id: bundle.descriptor.experiment_id,
    contract: {
      chain: etherscan.contract.chain,
      address: etherscan.contract.address,
      label: etherscan.contract.label,
    },
    etherscan: {
      functions: etherscan.functions || [],
      events: etherscan.events || [],
    },
    dune: {
      metrics: dune.metrics || [],
    },
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/assemble-raw-mcp-retrieval.js <experiment-directory>");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot).filter(
    (issue) => !issue.includes("raw-mcp-retrieval.json")
  );

  if (issues.length > 0) {
    console.error("Refusing to assemble raw MCP retrieval because prerequisite validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const output = assemble(bundle);
  const outputPath = bundle.artifactPaths.raw_mcp_retrieval;
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  updateRunManifest(experimentDir, "generation", {
    generator: "scripts/assemble-raw-mcp-retrieval.js",
  });
  console.log(`Assembled raw MCP retrieval at ${outputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
