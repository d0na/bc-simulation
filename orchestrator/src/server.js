"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const EXPERIMENTS_DIR = path.join(REPO_ROOT, "experiments");
const PROMPTS_DIR = path.join(__dirname, "..", "prompts");
const PORT = Number(process.env.ORCHESTRATOR_PORT || 8090);
const HOST = process.env.ORCHESTRATOR_HOST || "127.0.0.1";
const DUNE_API_KEY = process.env.DUNE_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const SESAME_API_BASE_URL = process.env.SESAME_API_BASE_URL || "http://localhost:8099";

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, data) {
  fs.writeFileSync(filePath, `${data.trimEnd()}\n`);
}

function getExperimentPaths(experimentId) {
  const experimentDir = path.join(EXPERIMENTS_DIR, experimentId);
  return {
    experimentDir,
    briefPath: path.join(experimentDir, "01-brief.json"),
    retrievalPath: path.join(experimentDir, "02-retrieval.json"),
    etherscanPromptPath: path.join(experimentDir, "02a-etherscan-prompt.md"),
    dunePromptPath: path.join(experimentDir, "02b-dune-prompt.md"),
    medsPath: path.join(experimentDir, "03-meds.json"),
    medsPromptPath: path.join(experimentDir, "03a-med-prompt.md"),
    simulationDraftPath: path.join(experimentDir, "04-simulation-draft.json"),
    reviewPath: path.join(experimentDir, "05-review.json"),
    simulationInputPath: path.join(experimentDir, "06-simulation-input.json"),
    launchPath: path.join(experimentDir, "07-launch.json"),
  };
}

function loadPromptTemplate(fileName) {
  const templatePath = path.join(PROMPTS_DIR, fileName);
  return fs.readFileSync(templatePath, "utf8");
}

function renderPromptTemplate(template, variables) {
  return Object.entries(variables).reduce((accumulator, [key, value]) => {
    const replacement =
      typeof value === "string" ? value : JSON.stringify(value, null, 2);
    return accumulator.replaceAll(`{{${key}}}`, replacement);
  }, template);
}

function briefPromptVariables(experimentId, brief) {
  const target = brief.target || {};
  return {
    experiment_id: experimentId,
    objective: brief.objective || "",
    questions_json: brief.questions || [],
    domain: target.domain || "",
    chain: target.chain || "",
    contract_address: target.contract_address || "",
    contract_label: target.contract_label || "",
  };
}

function renderAndWriteEtherscanPrompt(experimentId, brief, providerEvidence) {
  const { etherscanPromptPath } = getExperimentPaths(experimentId);
  const template = loadPromptTemplate("etherscan-retrieval.md");
  const prompt = renderPromptTemplate(template, {
    ...briefPromptVariables(experimentId, brief),
    abi_available: providerEvidence.abiAvailable,
    source_code_available: providerEvidence.sourceCodeAvailable,
    raw_abi_summary_json: providerEvidence.rawAbiSummary,
    raw_source_summary_json: providerEvidence.rawSourceSummary,
  });
  writeText(etherscanPromptPath, prompt);
  return { path: "02a-etherscan-prompt.md", content: prompt };
}

function renderAndWriteDunePrompt(experimentId, brief, providerEvidence) {
  const { dunePromptPath } = getExperimentPaths(experimentId);
  const template = loadPromptTemplate("dune-retrieval.md");
  const prompt = renderPromptTemplate(template, {
    ...briefPromptVariables(experimentId, brief),
    decoded_tables_json: providerEvidence.decodedTables,
    provider_issues_json: providerEvidence.providerIssues,
  });
  writeText(dunePromptPath, prompt);
  return { path: "02b-dune-prompt.md", content: prompt };
}

function renderAndWriteMedPrompt(experimentId, brief, retrieval) {
  const { medsPromptPath } = getExperimentPaths(experimentId);
  const template = loadPromptTemplate("med-generation.md");
  const prompt = renderPromptTemplate(template, {
    ...briefPromptVariables(experimentId, brief),
    etherscan_evidence_json: retrieval.etherscan,
    dune_evidence_json: retrieval.dune,
  });
  writeText(medsPromptPath, prompt);
  return { path: "03a-med-prompt.md", content: prompt };
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required value: ${label}`);
  }
  return value.trim();
}

function chainToEtherscanId(chain) {
  switch (chain) {
    case "ethereum":
      return 1;
    case "base":
      return 8453;
    case "arbitrum":
      return 42161;
    default:
      return 1;
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch (_) {
    parsed = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} for ${url}`);
    error.response = parsed;
    throw error;
  }

  return parsed;
}

async function retrieveEtherscan(contractAddress, chain) {
  const issues = [];
  const chainId = chainToEtherscanId(chain);
  const result = {
    status: "ok",
    totalFunctions: 0,
    totalEvents: 0,
    writeFunctions: [],
    events: [],
    sourceCodeAvailable: false,
    metadataStatus: "not_requested",
  };

  if (!ETHERSCAN_API_KEY) {
    issues.push("Missing ETHERSCAN_API_KEY.");
    result.status = "skipped";
    return { result, issues };
  }

  const abiUrl = new URL("https://api.etherscan.io/v2/api");
  abiUrl.searchParams.set("chainid", String(chainId));
  abiUrl.searchParams.set("module", "contract");
  abiUrl.searchParams.set("action", "getabi");
  abiUrl.searchParams.set("address", contractAddress);
  abiUrl.searchParams.set("apikey", ETHERSCAN_API_KEY);

  const sourceUrl = new URL("https://api.etherscan.io/v2/api");
  sourceUrl.searchParams.set("chainid", String(chainId));
  sourceUrl.searchParams.set("module", "contract");
  sourceUrl.searchParams.set("action", "getsourcecode");
  sourceUrl.searchParams.set("address", contractAddress);
  sourceUrl.searchParams.set("apikey", ETHERSCAN_API_KEY);

  try {
    const abiResponse = await fetchJson(abiUrl);
    if (abiResponse.status !== "1") {
      throw new Error(abiResponse.result || "Etherscan ABI request failed.");
    }
    const abi = JSON.parse(abiResponse.result);
    const writeFunctions = abi
      .filter((item) => item.type === "function" && ["nonpayable", "payable"].includes(item.stateMutability))
      .map((item) => item.name)
      .filter(Boolean)
      .sort();
    const events = abi
      .filter((item) => item.type === "event")
      .map((item) => item.name)
      .filter(Boolean)
      .sort();

    result.totalFunctions = abi.filter((item) => item.type === "function").length;
    result.totalEvents = abi.filter((item) => item.type === "event").length;
    result.writeFunctions = [...new Set(writeFunctions)];
    result.events = [...new Set(events)];
  } catch (error) {
    result.status = "provider_error";
    issues.push(`Etherscan ABI retrieval failed: ${error.message}`);
  }

  try {
    const sourceResponse = await fetchJson(sourceUrl);
    const sourceEntry = Array.isArray(sourceResponse.result) ? sourceResponse.result[0] : null;
    result.sourceCodeAvailable = Boolean(sourceEntry && sourceEntry.SourceCode);
  } catch (error) {
    issues.push(`Etherscan source retrieval failed: ${error.message}`);
  }

  try {
    const metadataResponse = await fetchJson("https://mcp.etherscan.io/mcp", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ETHERSCAN_API_KEY}`,
      },
    });
    result.metadataStatus = metadataResponse && metadataResponse.error ? "provider_error" : "unknown";
    issues.push("Etherscan metadata endpoint is not used directly by the Node orchestrator yet.");
  } catch (_) {
    result.metadataStatus = "unavailable";
    issues.push("Etherscan metadata remains unavailable or requires MCP session handling.");
  }

  return { result, issues };
}

async function retrieveDune(contractAddress, chain) {
  const issues = [];
  const result = {
    status: "ok",
    totalTables: 0,
    tables: [],
  };

  if (!DUNE_API_KEY) {
    issues.push("Missing DUNE_API_KEY.");
    result.status = "skipped";
    return { result, issues };
  }

  try {
    const response = await fetchJson("https://api.dune.com/api/v1/datasets/search-by-contract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dune-Api-Key": DUNE_API_KEY,
      },
      body: JSON.stringify({
        contract_address: contractAddress,
        blockchains: [chain],
        include_schema: false,
        limit: 10,
        offset: 0,
      }),
    });

    const tables = Array.isArray(response.results)
      ? response.results.map((item) => item.full_name).filter(Boolean)
      : [];

    result.totalTables = Number.isInteger(response.total) ? response.total : tables.length;
    result.tables = tables;
    if (!tables.length) {
      result.status = "empty";
      issues.push("Dune returned no decoded tables for the contract.");
    }
  } catch (error) {
    result.status = "provider_error";
    issues.push(`Dune retrieval failed: ${error.message}`);
  }

  return { result, issues };
}

async function buildRetrieval(experimentId) {
  const { briefPath, retrievalPath } = getExperimentPaths(experimentId);
  if (!fs.existsSync(briefPath)) {
    const error = new Error(`Experiment brief not found: ${briefPath}`);
    error.statusCode = 404;
    throw error;
  }

  const brief = readJson(briefPath);
  const target = brief.target || {};
  const contractAddress = requireString(target.contract_address, "target.contract_address");
  const chain = requireString(target.chain, "target.chain");
  const contractLabel = requireString(target.contract_label, "target.contract_label");
  const domain = requireString(target.domain, "target.domain");

  renderAndWriteEtherscanPrompt(experimentId, brief, {
    abiAvailable: ETHERSCAN_API_KEY !== "",
    sourceCodeAvailable: ETHERSCAN_API_KEY !== "",
    rawAbiSummary: {
      chainId: chainToEtherscanId(chain),
      module: "contract",
      action: "getabi",
      address: contractAddress,
    },
    rawSourceSummary: {
      chainId: chainToEtherscanId(chain),
      module: "contract",
      action: "getsourcecode",
      address: contractAddress,
    },
  });

  renderAndWriteDunePrompt(experimentId, brief, {
    decodedTables: [],
    providerIssues: [],
  });

  const etherscan = await retrieveEtherscan(contractAddress, chain);
  const dune = await retrieveDune(contractAddress, chain);

  const retrieval = {
    experimentId,
    target: {
      domain,
      chain,
      contractAddress,
      contractLabel,
    },
    etherscan: etherscan.result,
    dune: dune.result,
    issues: [...etherscan.issues, ...dune.issues],
    prompts: {
      etherscan: "02a-etherscan-prompt.md",
      dune: "02b-dune-prompt.md",
    },
    generatedAt: new Date().toISOString(),
  };

  writeJson(retrievalPath, retrieval);
  renderAndWriteDunePrompt(experimentId, brief, {
    decodedTables: retrieval.dune.tables,
    providerIssues: retrieval.issues,
  });
  return retrieval;
}

function hasAnyValue(values, expected) {
  return expected.some((value) => values.includes(value));
}

function buildMedEntries(retrieval) {
  const writeFunctions = Array.isArray(retrieval.etherscan?.writeFunctions) ? retrieval.etherscan.writeFunctions : [];
  const events = Array.isArray(retrieval.etherscan?.events) ? retrieval.etherscan.events : [];
  const tables = Array.isArray(retrieval.dune?.tables) ? retrieval.dune.tables : [];

  const meds = [];

  if (hasAnyValue(writeFunctions, ["mintApe"]) || tables.some((table) => table.includes("_call_mint"))) {
    meds.push({
      medId: "nft_primary_mint",
      label: "Primary Mint",
      intent: "Model how new NFTs enter circulation during the primary sale.",
      contractSignals: {
        writeFunctions: writeFunctions.filter((name) => ["mintApe"].includes(name)),
        events: events.filter((name) => name === "Transfer"),
      },
      dataSignals: tables.filter((table) => table.includes("_call_mint") || table.includes("_evt_transfer")),
      rationale: "Mint is the first creation event and sets the initial user acquisition path.",
    });
  }

  if (hasAnyValue(writeFunctions, ["transferFrom", "safeTransferFrom", "approve", "setApprovalForAll"]) || events.includes("Transfer")) {
    meds.push({
      medId: "nft_secondary_transfer",
      label: "Secondary Transfer",
      intent: "Model holder-to-holder movement and transfer intensity after mint.",
      contractSignals: {
        writeFunctions: writeFunctions.filter((name) =>
          ["transferFrom", "safeTransferFrom", "approve", "setApprovalForAll"].includes(name)
        ),
        events: events.filter((name) => ["Transfer", "Approval", "ApprovalForAll"].includes(name)),
      },
      dataSignals: tables.filter((table) => table.includes("_evt_transfer") || table.includes("_evt_approval")),
      rationale: "Transfers and approvals are the minimum on-chain signals for ownership circulation.",
    });
  }

  if (tables.some((table) => table.includes("_call_balanceof") || table.includes("_call_totalsupply") || table.includes("_call_ownerof"))) {
    meds.push({
      medId: "nft_holder_state",
      label: "Holder State",
      intent: "Track the standing state of holders, supply, and token ownership concentration.",
      contractSignals: {
        writeFunctions: [],
        events: [],
      },
      dataSignals: tables.filter((table) =>
        table.includes("_call_balanceof") || table.includes("_call_totalsupply") || table.includes("_call_ownerof")
      ),
      rationale: "A simple state layer helps convert transfers into holder distributions and concentration metrics.",
    });
  }

  return meds;
}

function summarizeOpenQuestions(retrieval, meds) {
  const questions = [];

  if (retrieval.etherscan?.metadataStatus !== "ok") {
    questions.push("Address metadata and labels are still missing from Etherscan and may require a separate MCP step.");
  }

  if (!meds.some((med) => med.medId === "nft_secondary_transfer")) {
    questions.push("The retrieval evidence does not yet support a clean secondary transfer MED.");
  }

  if (!retrieval.dune?.tables?.some((table) => table.includes("_evt_transfer"))) {
    questions.push("No transfer event table was found in Dune, so temporal activity modeling may be weak.");
  }

  questions.push("Human review should decide whether to keep the scope minimal with 2-3 MEDs or split marketplace behavior later.");
  return questions;
}

function buildMeds(experimentId) {
  const { briefPath, retrievalPath, medsPath } = getExperimentPaths(experimentId);
  if (!fs.existsSync(briefPath)) {
    const error = new Error(`Experiment brief not found: ${briefPath}`);
    error.statusCode = 404;
    throw error;
  }

  if (!fs.existsSync(retrievalPath)) {
    const error = new Error(`Retrieval artifact not found: ${retrievalPath}`);
    error.statusCode = 404;
    throw error;
  }

  const brief = readJson(briefPath);
  const retrieval = readJson(retrievalPath);
  renderAndWriteMedPrompt(experimentId, brief, retrieval);
  const meds = buildMedEntries(retrieval);

  const proposal = {
    experimentId,
    objective: brief.objective || null,
    target: retrieval.target,
    proposalStyle: "deterministic-minimal",
    meds,
    recommendedScope: {
      keepCountBetween: [2, 3],
      currentCount: meds.length,
      recommendation:
        meds.length <= 3
          ? "Current MED split is still lean enough for the running example."
          : "Reduce MED count before moving to simulation drafting.",
    },
    reviewStatus: "pending_human_review",
    openQuestions: summarizeOpenQuestions(retrieval, meds),
    generatedFrom: {
      briefFile: "01-brief.json",
      retrievalFile: "02-retrieval.json",
      medPromptFile: "03a-med-prompt.md",
    },
    generatedAt: new Date().toISOString(),
  };

  writeJson(medsPath, proposal);
  return proposal;
}

function buildSimulationModules(meds) {
  return meds.map((med) => {
    switch (med.medId) {
      case "nft_primary_mint":
        return {
          moduleId: "primary_mint_flow",
          sourceMedId: med.medId,
          behavior: "creation",
          description: "Generate newly minted NFTs and assign them to entrant holders.",
          entities: ["collection", "entrant_holder", "token"],
          eventTypes: ["mint"],
          parameters: {
            arrivalRate: "to_calibrate",
            maxSupply: "to_calibrate",
            mintWindow: "to_calibrate",
          },
        };
      case "nft_secondary_transfer":
        return {
          moduleId: "secondary_transfer_flow",
          sourceMedId: med.medId,
          behavior: "circulation",
          description: "Move tokens between holders after mint and track transfer activity.",
          entities: ["holder", "token"],
          eventTypes: ["transfer", "approval"],
          parameters: {
            transferRate: "to_calibrate",
            approvalRate: "optional",
            activeHolderShare: "to_calibrate",
          },
        };
      case "nft_holder_state":
        return {
          moduleId: "holder_state_snapshot",
          sourceMedId: med.medId,
          behavior: "state",
          description: "Keep the standing ownership distribution and supply-related state.",
          entities: ["holder", "token", "collection"],
          eventTypes: ["state_update"],
          parameters: {
            concentrationBuckets: "to_define",
            snapshotFrequency: "daily",
          },
        };
      default:
        return {
          moduleId: med.medId,
          sourceMedId: med.medId,
          behavior: "custom",
          description: med.intent,
          entities: [],
          eventTypes: [],
          parameters: {},
        };
    }
  });
}

function inferSimulationGoals(brief, meds) {
  const goals = [];
  const questions = Array.isArray(brief.questions) ? brief.questions : [];

  if (meds.some((med) => med.medId === "nft_primary_mint")) {
    goals.push("Estimate the minimum mint dynamics needed to initialize the collection state.");
  }

  if (meds.some((med) => med.medId === "nft_secondary_transfer")) {
    goals.push("Estimate how frequently tokens circulate between holders after mint.");
  }

  if (meds.some((med) => med.medId === "nft_holder_state")) {
    goals.push("Observe how ownership concentration evolves over time.");
  }

  return goals.concat(questions.slice(0, 2));
}

function buildSimulationDraft(experimentId) {
  const { briefPath, retrievalPath, medsPath, simulationDraftPath } = getExperimentPaths(experimentId);
  if (!fs.existsSync(briefPath)) {
    const error = new Error(`Experiment brief not found: ${briefPath}`);
    error.statusCode = 404;
    throw error;
  }

  if (!fs.existsSync(retrievalPath)) {
    const error = new Error(`Retrieval artifact not found: ${retrievalPath}`);
    error.statusCode = 404;
    throw error;
  }

  if (!fs.existsSync(medsPath)) {
    const error = new Error(`MED artifact not found: ${medsPath}`);
    error.statusCode = 404;
    throw error;
  }

  const brief = readJson(briefPath);
  const retrieval = readJson(retrievalPath);
  const medsProposal = readJson(medsPath);
  const meds = Array.isArray(medsProposal.meds) ? medsProposal.meds : [];
  const modules = buildSimulationModules(meds);

  const draft = {
    experimentId,
    target: retrieval.target,
    draftStyle: "deterministic-minimal",
    simulation: {
      label: `${retrieval.target.contractLabel} minimal simulation draft`,
      scope: "prototype",
      goals: inferSimulationGoals(brief, meds),
      entities: ["collection", "holder", "token"],
      modules,
      observables: [
        "minted_tokens_over_time",
        "transfer_count_over_time",
        "holder_count_over_time",
        "ownership_concentration",
      ],
      assumptions: [
        "Marketplace-specific sale mechanics are not modeled yet.",
        "Primary mint and secondary transfer are treated as the minimum useful lifecycle.",
        "Calibration values remain placeholders until human review or extra Dune queries.",
      ],
      calibrationInputs: {
        duneTables: retrieval.dune?.tables || [],
        writeFunctions: retrieval.etherscan?.writeFunctions || [],
        events: retrieval.etherscan?.events || [],
      },
    },
    reviewStatus: "pending_human_review",
    nextAction: "Confirm, trim, or edit modules before wiring this draft to Sesame simulation launch.",
    generatedFrom: {
      briefFile: "01-brief.json",
      retrievalFile: "02-retrieval.json",
      medsFile: "03-meds.json",
    },
    generatedAt: new Date().toISOString(),
  };

  writeJson(simulationDraftPath, draft);
  return draft;
}

function buildReviewTemplate(experimentId) {
  const { medsPath, simulationDraftPath, reviewPath } = getExperimentPaths(experimentId);
  if (!fs.existsSync(medsPath)) {
    const error = new Error(`MED artifact not found: ${medsPath}`);
    error.statusCode = 404;
    throw error;
  }

  if (!fs.existsSync(simulationDraftPath)) {
    const error = new Error(`Simulation draft artifact not found: ${simulationDraftPath}`);
    error.statusCode = 404;
    throw error;
  }

  const medsProposal = readJson(medsPath);
  const simulationDraft = readJson(simulationDraftPath);
  const meds = Array.isArray(medsProposal.meds) ? medsProposal.meds : [];
  const modules = Array.isArray(simulationDraft.simulation?.modules) ? simulationDraft.simulation.modules : [];

  const review = {
    experimentId,
    decision: "pending",
    notes: "",
    approvedMeds: meds.map((med) => med.medId),
    simulationChanges: [],
    approvedModules: modules.map((module) => module.moduleId),
    readyForLaunch: false,
    checklist: [
      "Confirm that retrieval evidence is sufficient for the study goal.",
      "Trim or edit MEDs if the scope is still too wide.",
      "Review placeholder parameters before any launch step.",
    ],
    generatedFrom: {
      medsFile: "03-meds.json",
      simulationDraftFile: "04-simulation-draft.json",
    },
    generatedAt: new Date().toISOString(),
  };

  writeJson(reviewPath, review);
  return review;
}

async function prepareStudy(experimentId) {
  const retrieval = await buildRetrieval(experimentId);
  const meds = buildMeds(experimentId);
  const simulationDraft = buildSimulationDraft(experimentId);
  const review = buildReviewTemplate(experimentId);

  return {
    experimentId,
    status: "prepared_for_review",
    generatedArtifacts: [
      "02-retrieval.json",
      "03-meds.json",
      "04-simulation-draft.json",
      "05-review.json",
    ],
    retrieval,
    meds,
    simulationDraft,
    review,
  };
}

function buildEventDefinitions(approvedModules) {
  const events = [];

  if (approvedModules.some((module) => module.moduleId === "primary_mint_flow")) {
    events.push({
      eventName: "mint",
      description: "Minimal primary mint event derived from nft_primary_mint.",
      instanceOf: "token",
      dependencies: [
        {
          dependOn: "holder",
          maxProbabilityMatches: null,
          probabilityDistribution: {
            type: "UNIFORM",
            value: 0.001,
          },
        },
      ],
      gasCost: 250000,
    });
  }

  if (approvedModules.some((module) => module.moduleId === "secondary_transfer_flow")) {
    events.push({
      eventName: "transfer",
      description: "Minimal transfer event derived from nft_secondary_transfer.",
      instanceOf: "token",
      dependencies: [
        {
          dependOn: "token",
          maxProbabilityMatches: "#holder",
          probabilityDistribution: {
            type: "NORMAL_SCALED",
            mean: 24,
            std: 12,
            scalingFactorX: 0.1,
            scalingFactorY: 0.2,
          },
        },
      ],
      gasCost: 180000,
    });
    events.push({
      eventName: "approval",
      description: "Optional approval event paired with transfer readiness.",
      instanceOf: "token",
      dependencies: [
        {
          dependOn: "token",
          maxProbabilityMatches: "#holder",
          probabilityDistribution: {
            type: "UNIFORM",
            value: 0.0004,
          },
        },
      ],
      gasCost: 80000,
    });
  }

  return events;
}

function buildSimulationInput(experimentId) {
  const { reviewPath, simulationDraftPath, simulationInputPath } = getExperimentPaths(experimentId);
  if (!fs.existsSync(reviewPath)) {
    const error = new Error(`Review artifact not found: ${reviewPath}`);
    error.statusCode = 404;
    throw error;
  }

  if (!fs.existsSync(simulationDraftPath)) {
    const error = new Error(`Simulation draft artifact not found: ${simulationDraftPath}`);
    error.statusCode = 404;
    throw error;
  }

  const review = readJson(reviewPath);
  if (review.decision !== "confirm" || review.readyForLaunch !== true) {
    const error = new Error("Launch blocked: review must be confirmed and readyForLaunch must be true.");
    error.statusCode = 409;
    throw error;
  }

  const draft = readJson(simulationDraftPath);
  const approvedModuleIds = Array.isArray(review.approvedModules) ? review.approvedModules : [];
  const approvedModules = (draft.simulation?.modules || []).filter((module) => approvedModuleIds.includes(module.moduleId));
  const events = buildEventDefinitions(approvedModules);

  if (!events.length) {
    const error = new Error("Launch blocked: no executable events remain after review filtering.");
    error.statusCode = 409;
    throw error;
  }

  const simulationInput = {
    name: `${experimentId}-minimal`,
    description: `Launchable minimal simulation input for ${draft.target.contractLabel}.`,
    entities: ["holder", "token", "collection"],
    events,
    numAggr: 3600,
    maxTime: 1209600,
    numRuns: 3,
    generatedFrom: {
      reviewFile: "05-review.json",
      simulationDraftFile: "04-simulation-draft.json",
    },
    generatedAt: new Date().toISOString(),
  };

  writeJson(simulationInputPath, simulationInput);
  return simulationInput;
}

async function launchStudy(experimentId) {
  const { launchPath } = getExperimentPaths(experimentId);
  const simulationInput = buildSimulationInput(experimentId);
  const endpoint = `${SESAME_API_BASE_URL.replace(/\/$/, "")}/newsimulation`;

  let response;
  let responseBody;
  let ok = false;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entities: simulationInput.entities,
        events: simulationInput.events,
        name: simulationInput.name,
        description: simulationInput.description,
        numAggr: simulationInput.numAggr,
        maxTime: simulationInput.maxTime,
        numRuns: simulationInput.numRuns,
      }),
    });

    const text = await response.text();
    try {
      responseBody = text ? JSON.parse(text) : {};
    } catch (_) {
      responseBody = { raw: text };
    }
    ok = response.ok;
  } catch (error) {
    responseBody = { error: error.message };
  }

  const launchArtifact = {
    experimentId,
    endpoint,
    status: ok ? "launched" : "launch_failed",
    simulationInputFile: "06-simulation-input.json",
    httpStatus: response ? response.status : null,
    response: responseBody,
    launchedAt: new Date().toISOString(),
  };

  writeJson(launchPath, launchArtifact);

  if (!ok) {
    const error = new Error("Sesame launch failed. See 07-launch.json for details.");
    error.statusCode = 502;
    throw error;
  }

  return launchArtifact;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (req.method === "POST" && req.url === "/studies/retrieve") {
      const body = await parseBody(req);
      const experimentId = requireString(body.experimentId, "experimentId");
      const retrieval = await buildRetrieval(experimentId);
      sendJson(res, 200, retrieval);
      return;
    }

    if (req.method === "POST" && req.url === "/studies/prepare") {
      const body = await parseBody(req);
      const experimentId = requireString(body.experimentId, "experimentId");
      const prepared = await prepareStudy(experimentId);
      sendJson(res, 200, prepared);
      return;
    }

    if (req.method === "POST" && req.url === "/studies/meds") {
      const body = await parseBody(req);
      const experimentId = requireString(body.experimentId, "experimentId");
      const proposal = buildMeds(experimentId);
      sendJson(res, 200, proposal);
      return;
    }

    if (req.method === "POST" && req.url === "/studies/simulation-draft") {
      const body = await parseBody(req);
      const experimentId = requireString(body.experimentId, "experimentId");
      const draft = buildSimulationDraft(experimentId);
      sendJson(res, 200, draft);
      return;
    }

    if (req.method === "POST" && req.url === "/studies/review-template") {
      const body = await parseBody(req);
      const experimentId = requireString(body.experimentId, "experimentId");
      const review = buildReviewTemplate(experimentId);
      sendJson(res, 200, review);
      return;
    }

    if (req.method === "POST" && req.url === "/studies/launch") {
      const body = await parseBody(req);
      const experimentId = requireString(body.experimentId, "experimentId");
      const launch = await launchStudy(experimentId);
      sendJson(res, 200, launch);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    sendJson(res, statusCode, { error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`orchestrator listening on http://${HOST}:${PORT}`);
});
