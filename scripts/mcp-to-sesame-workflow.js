#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function basenameSafe(ref) {
  return path.basename(String(ref || ""));
}

function loadBundle(experimentDir) {
  const experimentPath = path.join(experimentDir, "experiment.json");
  if (!exists(experimentPath)) {
    throw new Error(`Missing experiment.json at ${experimentPath}`);
  }

  const experiment = readJson(experimentPath);
  const artifacts = Object.fromEntries(
    Object.entries(experiment.artifacts || {}).map(([key, relPath]) => [key, path.join(experimentDir, relPath)])
  );

  return { experimentDir, experimentPath, experiment, artifacts };
}

function ensureEvidenceShape(bundle) {
  const evidencePath = bundle.artifacts.mcp_evidence;
  const current = exists(evidencePath) ? readJson(evidencePath) : {};
  const next = {
    experiment_id: bundle.experiment.experiment_id,
    etherscan: {
      functions: ensureArray(current.etherscan?.functions),
      events: ensureArray(current.etherscan?.events),
      transactions: ensureArray(current.etherscan?.transactions),
      gas_signals: ensureArray(current.etherscan?.gas_signals),
      unknown_calls: ensureArray(current.etherscan?.unknown_calls),
    },
    dune: {
      metrics: ensureArray(current.dune?.metrics),
    },
    simulation_mcp: {
      notes: ensureArray(current.simulation_mcp?.notes),
    },
  };
  writeJson(evidencePath, next);
  return next;
}

function functionName(entry) {
  return entry.function_name || entry.name || entry.signature || "unknown_function";
}

function eventName(entry) {
  return entry.event_name || entry.name || "unknown_event";
}

function metricName(entry) {
  return entry.metric_name || entry.name || "unknown_metric";
}

function isWriteFunction(entry) {
  const mutability = lower(entry.state_mutability || entry.mutability);
  if (mutability) {
    return !["view", "pure"].includes(mutability);
  }
  const name = lower(functionName(entry));
  return !(
    name.startsWith("get") ||
    name.startsWith("tokenuri") ||
    name.startsWith("ownerof") ||
    name.startsWith("supportsinterface") ||
    name.includes("view")
  );
}

function isReadFunction(entry) {
  return !isWriteFunction(entry);
}

function inferDistributionModels(metric) {
  const explicit = ensureArray(metric.candidate_distribution_models);
  if (explicit.length) {
    return explicit;
  }

  const hint = lower(metric.trend_hint || metric.pattern || metric.summary);
  if (hint.includes("peak") || hint.includes("burst")) {
    return ["LOGNORMAL", "EXPONENTIAL"];
  }
  if (hint.includes("decay")) {
    return ["EXPONENTIAL"];
  }
  if (hint.includes("stable")) {
    return ["FIXED", "UNIFORM"];
  }
  if (hint.includes("adoption") || hint.includes("growth")) {
    return ["BASS", "LOGNORMAL"];
  }
  return ["LOGNORMAL"];
}

function summarizeMetric(metric) {
  return {
    name: metricName(metric),
    granularity: metric.granularity || null,
    trend_hint: metric.trend_hint || null,
    source_ref: metric.source_ref || null,
    missing_data: ensureArray(metric.missing_data),
  };
}

function buildAnalysisReport(bundle) {
  const evidence = readJson(bundle.artifacts.mcp_evidence);
  const functions = ensureArray(evidence.etherscan?.functions);
  const events = ensureArray(evidence.etherscan?.events);
  const transactions = ensureArray(evidence.etherscan?.transactions);
  const gasSignals = ensureArray(evidence.etherscan?.gas_signals);
  const unknownCalls = ensureArray(evidence.etherscan?.unknown_calls);
  const metrics = ensureArray(evidence.dune?.metrics);

  const transactionCounts = transactions.map((entry) => ({
    function_name: entry.function_name || entry.name || null,
    count: entry.count ?? entry.transaction_count ?? null,
    source_ref: entry.source_ref || null,
  }));

  const trackedMetrics = metrics.map(summarizeMetric);
  const candidateModels = unique(metrics.flatMap(inferDistributionModels)).map((name) => ({
    distribution: name,
    basis: "Inferred from Dune metric trend hints or explicit metric suggestions.",
  }));

  const peaks = [];
  const decayPhases = [];
  const stablePhases = [];
  const anomalies = [];
  const missingData = [];

  for (const metric of metrics) {
    const name = metricName(metric);
    const hint = lower(metric.trend_hint || metric.pattern || metric.summary);
    if (hint.includes("peak") || hint.includes("burst")) {
      peaks.push({ metric: name, source_ref: metric.source_ref || null, note: metric.trend_hint || metric.summary || "Peak-like behavior observed." });
    }
    if (hint.includes("decay")) {
      decayPhases.push({ metric: name, source_ref: metric.source_ref || null, note: metric.trend_hint || metric.summary || "Decay-like behavior observed." });
    }
    if (hint.includes("stable")) {
      stablePhases.push({ metric: name, source_ref: metric.source_ref || null, note: metric.trend_hint || metric.summary || "Stable usage phase observed." });
    }
    if (hint.includes("anomal")) {
      anomalies.push({ metric: name, source_ref: metric.source_ref || null, note: metric.trend_hint || metric.summary || "Potential anomaly observed." });
    }
    if (!metric.timeseries && !metric.trend_hint) {
      missingData.push(`Metric '${name}' does not include timeseries data or a trend hint.`);
    }
    for (const item of ensureArray(metric.missing_data)) {
      missingData.push(`Metric '${name}': ${item}`);
    }
  }

  if (!functions.length) {
    missingData.push("No Etherscan functions captured yet.");
  }
  if (!metrics.length) {
    missingData.push("No Dune metrics captured yet.");
  }

  return {
    experiment_id: bundle.experiment.experiment_id,
    status: functions.length || metrics.length ? "generated" : "pending_evidence",
    contract_operation_report: {
      functions: functions.map((entry) => ({
        name: functionName(entry),
        signature: entry.signature || null,
        state_mutability: entry.state_mutability || entry.mutability || null,
        write_operation: isWriteFunction(entry),
        source_ref: entry.source_ref || null,
      })),
      events: events.map((entry) => ({
        name: eventName(entry),
        source_ref: entry.source_ref || null,
      })),
      write_operations: functions.filter(isWriteFunction).map((entry) => ({
        name: functionName(entry),
        signature: entry.signature || null,
        source_ref: entry.source_ref || null,
      })),
      read_only_operations: functions.filter(isReadFunction).map((entry) => ({
        name: functionName(entry),
        signature: entry.signature || null,
        source_ref: entry.source_ref || null,
      })),
      gas_cost_statistics: gasSignals.map((entry) => ({
        function_name: entry.function_name || entry.name || null,
        avg_gas: entry.avg_gas ?? null,
        median_gas: entry.median_gas ?? null,
        samples: entry.samples ?? null,
        source_ref: entry.source_ref || null,
      })),
      transaction_counts: transactionCounts,
      unknown_or_undecoded_calls: unknownCalls,
      provenance_notes: unique([
        ...functions.map((entry) => entry.source_ref),
        ...events.map((entry) => entry.source_ref),
        ...metrics.map((entry) => entry.source_ref),
      ]).map((ref) => ({
        source_ref: ref,
        source_name: basenameSafe(ref),
      })),
    },
    trend_analysis_report: {
      tracked_metrics: trackedMetrics,
      call_frequency_over_time: metrics.map((entry) => ({
        metric: metricName(entry),
        granularity: entry.granularity || null,
        trend_hint: entry.trend_hint || entry.summary || null,
        source_ref: entry.source_ref || null,
      })),
      peaks,
      decay_phases: decayPhases,
      stable_usage_phases: stablePhases,
      anomalies,
      candidate_distribution_models: candidateModels,
      missing_data: unique(missingData),
    },
    unresolved_points: unique([
      ...(!gasSignals.length ? ["Gas-cost statistics are still incomplete or missing."] : []),
      ...(!transactions.length ? ["Transaction counts are still incomplete or missing."] : []),
      ...(!metrics.length ? ["Usage trend metrics are still incomplete or missing."] : []),
    ]),
  };
}

function groupForFunction(name) {
  const value = lower(name);
  if (value.includes("transfer")) {
    return "ownership_transfer";
  }
  if (value.includes("approve")) {
    return "approval_management";
  }
  if (value.includes("mint") || value.includes("claim")) {
    return "asset_minting";
  }
  if (value.includes("burn")) {
    return "asset_burning";
  }
  return "contract_write_operation";
}

function defaultMeaning(group) {
  if (group === "ownership_transfer") {
    return "Moves NFT ownership between accounts.";
  }
  if (group === "approval_management") {
    return "Sets or revokes approval rights for NFT transfers.";
  }
  if (group === "asset_minting") {
    return "Creates new NFTs or claims mintable NFTs.";
  }
  if (group === "asset_burning") {
    return "Destroys NFTs or removes them from circulation.";
  }
  return "Represents a contract-side write action that may carry on-chain cost.";
}

function matchingEvents(group, events) {
  const names = events.map(eventName);
  if (group === "ownership_transfer") {
    return names.filter((name) => lower(name).includes("transfer"));
  }
  if (group === "approval_management") {
    return names.filter((name) => lower(name).includes("approval"));
  }
  if (group === "asset_minting") {
    return names.filter((name) => lower(name).includes("mint") || lower(name).includes("transfer"));
  }
  if (group === "asset_burning") {
    return names.filter((name) => lower(name).includes("burn") || lower(name).includes("transfer"));
  }
  return [];
}

function matchingMetrics(group, metrics) {
  return metrics
    .filter((metric) => {
      const name = lower(metricName(metric));
      if (group === "ownership_transfer") {
        return name.includes("transfer");
      }
      if (group === "approval_management") {
        return name.includes("approval");
      }
      if (group === "asset_minting") {
        return name.includes("mint") || name.includes("claim");
      }
      if (group === "asset_burning") {
        return name.includes("burn");
      }
      return name.includes("daily_") || name.includes("count");
    })
    .map((metric) => ({
      metric: metricName(metric),
      source_ref: metric.source_ref || null,
    }));
}

function confidenceLevel(functionCount, metricCount, gasSignalCount) {
  const score = (functionCount ? 1 : 0) + (metricCount ? 1 : 0) + (gasSignalCount ? 1 : 0);
  if (score === 3) {
    return "high";
  }
  if (score === 2) {
    return "medium";
  }
  return "low";
}

function buildMedProposal(bundle) {
  const evidence = readJson(bundle.artifacts.mcp_evidence);
  const analysis = readJson(bundle.artifacts.analysis_report);
  const functions = ensureArray(evidence.etherscan?.functions).filter(isWriteFunction);
  const events = ensureArray(evidence.etherscan?.events);
  const metrics = ensureArray(evidence.dune?.metrics);
  const gasSignals = ensureArray(evidence.etherscan?.gas_signals);
  const distributionPool = ensureArray(analysis.trend_analysis_report?.candidate_distribution_models).map((entry) => entry.distribution);

  const groups = new Map();
  for (const entry of functions) {
    const group = groupForFunction(functionName(entry));
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(entry);
  }

  const meds = [...groups.entries()].map(([group, groupFunctions]) => {
    const relatedFunctionNames = unique(groupFunctions.map(functionName));
    const relatedEventNames = unique(matchingEvents(group, events));
    const matchedGas = gasSignals.filter((entry) => relatedFunctionNames.some((name) => lower(entry.function_name || entry.name) === lower(name)));
    const usageTrendSource = matchingMetrics(group, metrics);
    const candidateDistribution = distributionPool[0] || "LOGNORMAL";

    return {
      med_name: group,
      related_contract_functions: relatedFunctionNames,
      related_events: relatedEventNames,
      semantic_meaning: defaultMeaning(group),
      gas_cost_model: {
        representative_function: relatedFunctionNames[0] || null,
        avg_gas: matchedGas[0]?.avg_gas ?? null,
        median_gas: matchedGas[0]?.median_gas ?? null,
        samples: matchedGas[0]?.samples ?? null,
        source_refs: unique(matchedGas.map((entry) => entry.source_ref)),
      },
      usage_trend_source: usageTrendSource,
      candidate_probability_distribution: candidateDistribution,
      assumptions: unique([
        !relatedEventNames.length ? "Related events are incomplete or not yet decoded." : null,
        !usageTrendSource.length ? "No directly matching Dune metric was found for this MED yet." : null,
        !matchedGas.length ? "No direct gas signal was found for this MED yet." : null,
      ]),
      confidence_level: confidenceLevel(relatedFunctionNames.length, usageTrendSource.length, matchedGas.length),
      fields_requiring_human_approval: [
        "MED grouping",
        "gas-cost model",
        "candidate probability distribution",
        "assumptions",
      ],
    };
  });

  return {
    experiment_id: bundle.experiment.experiment_id,
    status: meds.length ? "generated" : "pending_analysis",
    meds,
    human_approval_required: [
      "MED grouping",
      "gas-cost model",
      "usage-trend source mapping",
      "candidate probability distribution",
      "confidence levels",
      "assumptions",
    ],
  };
}

function runCollect(bundle) {
  ensureEvidenceShape(bundle);
  bundle.experiment.status = "evidence_collection_ready";
  writeJson(bundle.experimentPath, bundle.experiment);

  const retrievalPlan = readJson(bundle.artifacts.retrieval_plan);
  console.log("COLLECT phase ready.");
  console.log("");
  console.log("Local step completed:");
  console.log(`- ensured evidence file exists at ${bundle.artifacts.mcp_evidence}`);
  console.log("");
  console.log("Agent step required:");
  console.log("- run Etherscan MCP with this prompt:");
  console.log(retrievalPlan.etherscan?.rendered_prompt || "(missing etherscan prompt)");
  console.log("");
  console.log("- run Dune MCP with this prompt:");
  console.log(retrievalPlan.dune?.rendered_prompt || "(missing dune prompt)");
  console.log("");
  console.log("Then paste the MCP results into:");
  console.log(`- ${bundle.artifacts.mcp_evidence}`);
}

function runAnalyze(bundle) {
  const report = buildAnalysisReport(bundle);
  writeJson(bundle.artifacts.analysis_report, report);
  bundle.experiment.status = report.status === "generated" ? "analysis_generated" : "analysis_pending_evidence";
  writeJson(bundle.experimentPath, bundle.experiment);
  console.log(`Generated analysis report at ${bundle.artifacts.analysis_report}`);
}

function runPropose(bundle) {
  const analysis = readJson(bundle.artifacts.analysis_report);
  if (analysis.status !== "generated") {
    console.error("Refusing to generate MED proposal because analysis-report.json is still pending evidence.");
    process.exit(1);
  }
  const proposal = buildMedProposal(bundle);
  writeJson(bundle.artifacts.med_proposal, proposal);
  bundle.experiment.status = proposal.status === "generated" ? "med_proposal_generated" : "proposal_pending_analysis";
  writeJson(bundle.experimentPath, bundle.experiment);
  console.log(`Generated MED proposal at ${bundle.artifacts.med_proposal}`);
}

function main() {
  const experimentDir = process.argv[2];
  const phase = process.argv[3];

  if (!experimentDir || !phase) {
    console.error("Usage: node scripts/mcp-to-sesame-workflow.js <experiment-directory> <collect|analyze|propose>");
    process.exit(1);
  }

  const bundle = loadBundle(path.resolve(experimentDir));

  if (phase === "collect") {
    runCollect(bundle);
    return;
  }
  if (phase === "analyze") {
    runAnalyze(bundle);
    return;
  }
  if (phase === "propose") {
    runPropose(bundle);
    return;
  }

  console.error(`Unknown phase '${phase}'. Expected one of: collect, analyze, propose.`);
  process.exit(1);
}

main();
