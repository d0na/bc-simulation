#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  loadExperimentBundle,
  readJson,
  resolveExperimentDir,
  validateExperimentBundle,
} = require("./lib/experiment-framework");

async function main() {
  const inputPath = process.argv[2];
  const baseUrl = process.argv[3] || process.env.SESAME_API_BASE_URL || "http://localhost:8099";

  if (!inputPath) {
    console.error("Usage: node scripts/launch-experiment.js <experiment-directory> [api-base-url]");
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const experimentDir = resolveExperimentDir(inputPath);
  const bundle = loadExperimentBundle(experimentDir);
  const issues = validateExperimentBundle(bundle, repoRoot);

  if (issues.length > 0) {
    console.error("Refusing to launch experiment because validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  const simulationInputPath = bundle.artifactPaths.simulation_input;
  const simulationInput = readJson(simulationInputPath);
  const payload = {
    entities: simulationInput.entities,
    events: simulationInput.events,
    name: simulationInput.name,
    description: simulationInput.description,
    numAggr: simulationInput.numAggr,
    maxTime: simulationInput.maxTime,
    numRuns: simulationInput.numRuns,
  };
  const endpoint = `${baseUrl.replace(/\/$/, "")}/newsimulation`;

  console.log(`Launching ${bundle.descriptor.experiment_id} against ${endpoint}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let responseBody = responseText;
  try {
    responseBody = JSON.parse(responseText);
  } catch (_) {
    // Keep plain text if the backend does not return valid JSON.
  }

  const runManifestPath = bundle.artifactPaths.run_manifest;
  const runManifest = readJson(runManifestPath);
  const nextManifest = {
    ...runManifest,
    status: response.ok ? "launched" : "launch_failed",
    launch: {
      endpoint,
      launched_at: new Date().toISOString(),
      http_status: response.status,
      response: responseBody,
    },
  };

  fs.writeFileSync(runManifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);

  if (!response.ok) {
    console.error(`Launch failed with HTTP ${response.status}`);
    console.error(typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody, null, 2));
    process.exit(1);
  }

  console.log("Launch accepted by backend.");
  console.log(JSON.stringify(responseBody, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
