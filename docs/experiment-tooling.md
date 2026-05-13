# Experiment Tooling Guide

This document explains how to use the local tooling that supports the reproducible MCP-assisted experiment workflow in Sesame.

For a full end-to-end walkthrough, see:

- [How To Create And Run An Experiment](</Users/francesco/workspace/git/research/sesame/docs/how-to-create-and-run-an-experiment.en.md>)
- [Come Creare E Pilotare Un Esperimento](</Users/francesco/workspace/git/research/sesame/docs/come-creare-e-pilotare-un-esperimento.it.md>)
- [Human Modeling Workflow](</Users/francesco/workspace/git/research/sesame/docs/human-modeling-workflow.en.md>)
- [Flusso Umano Di Modellazione](</Users/francesco/workspace/git/research/sesame/docs/human-modeling-workflow.it.md>)

## Scope

The current tooling covers the local orchestration layer around an experiment:

- retrieval request preparation
- retrieval prompt rendering
- raw MCP assembly from server-specific captures
- retrieval evidence normalization
- MED proposal generation
- probability model proposal generation
- review preparation and consistency checks
- experiment validation
- simulation input generation
- run manifest enrichment
- simulation launch against the existing backend

It does not yet automate live MCP retrieval or agent-authored MED generation.

## Relevant Directories

- `experiments/`: experiment descriptors and artifacts
- `prompts/`: versioned prompt templates
- `schemas/`: JSON Schemas for experiment artifacts
- `scripts/`: local orchestration scripts
- `artifacts/runs/`: destination for generated run outputs

## Experiment Artifact Model

An experiment directory should contain at least these phase-separated files:

- `experiment.json`
- `00-overview/00-objective.md`
- `00-overview/01-status-and-notes.md`
- `10-human-input/10-retrieval-request.json`
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`
- `20-rendered-prompts/20-rendered-retrieval-prompts.json`
- `30-mcp-raw/30-etherscan-mcp-capture.json`
- `30-mcp-raw/31-dune-mcp-capture.json`
- `30-mcp-raw/32-simulation-mcp-capture.json`
- `30-mcp-raw/39-raw-mcp-retrieval.json`
- `40-normalized-evidence/40-retrieval-evidence.json`
- `50-generated-proposals/50-med-proposal.json`
- `50-generated-proposals/51-probability-model-proposal.json`
- `60-human-review/60-review-decision.json`
- `70-execution/70-simulation-input.json`
- `70-execution/71-run-manifest.json`
- `70-execution/72-validation-report.json`

## Tooling Overview

### `prepare:retrieval-request`

Command:

```bash
npm run prepare:retrieval-request -- experiments/dao-vote-costs-v1
```

Purpose:

- creates or refreshes `10-human-input/10-retrieval-request.json`
- binds the experiment objective to the Etherscan and Dune templates
- materializes the contract target and requested metrics in one auditable file

This file is intended to become the stable handoff between the repository workflow and the live MCP retrieval stage.

### `render:retrieval-prompts`

Command:

```bash
npm run render:retrieval-prompts -- experiments/dao-vote-costs-v1
```

Purpose:

- reads `10-human-input/10-retrieval-request.json`
- materializes concrete Etherscan and Dune prompt payloads
- writes them to `20-rendered-prompts/20-rendered-retrieval-prompts.json`

This artifact is the last local step before using the MCP tools for live retrieval.

### `assemble:raw-mcp-retrieval`

Command:

```bash
npm run assemble:raw-mcp-retrieval -- experiments/dao-vote-costs-v1
```

Purpose:

- reads the server-specific capture files
- assembles them into `30-mcp-raw/39-raw-mcp-retrieval.json`
- updates `70-execution/71-run-manifest.json` with refreshed hashes

This step makes the raw ingestion contract explicit for Etherscan, Dune, and the simulation MCP server.

### `normalize:retrieval-evidence`

Command:

```bash
npm run normalize:retrieval-evidence -- experiments/dao-vote-costs-v1
```

Purpose:

- reads `30-mcp-raw/39-raw-mcp-retrieval.json`
- maps raw Etherscan and Dune capture fields into the canonical `40-normalized-evidence/40-retrieval-evidence.json` format
- updates `70-execution/71-run-manifest.json` with refreshed hashes

This is the current bridge between live MCP results and the repository's normalized evidence model.

### `generate:med-proposal`

Command:

```bash
npm run generate:med-proposal -- experiments/dao-vote-costs-v1
```

Purpose:

- reads `40-normalized-evidence/40-retrieval-evidence.json`
- applies `10-human-input/11-med-aggregation-rules.json`
- writes a deterministic `50-generated-proposals/50-med-proposal.json`
- updates `70-execution/71-run-manifest.json` with refreshed hashes

This is the first repository-local automation step for the agent abstraction layer.

### `generate:probability-model-proposal`

Command:

```bash
npm run generate:probability-model-proposal -- experiments/dao-vote-costs-v1
```

Purpose:

- reads `40-normalized-evidence/40-retrieval-evidence.json`
- reads `50-generated-proposals/50-med-proposal.json`
- applies `10-human-input/12-probability-model-rules.json`
- writes a deterministic `50-generated-proposals/51-probability-model-proposal.json`
- updates `70-execution/71-run-manifest.json` with refreshed hashes

### `prepare:review-decision`

Command:

```bash
npm run prepare:review-decision -- experiments/dao-vote-costs-v1
```

Purpose:

- refreshes `60-human-review/60-review-decision.json`
- records the hashes of the proposal artifacts currently under review
- preserves existing review notes and edits when possible

Use this after regenerating MED or probability proposals and before a human reviewer signs off again.

### `check:review-consistency`

Command:

```bash
npm run check:review-consistency -- experiments/dao-vote-costs-v1
```

Purpose:

- compares the hashes recorded in `60-human-review/60-review-decision.json` against the current proposal artifacts
- fails when the review no longer matches the generated artifacts

This prevents a stale approval from being reused after the upstream proposals change.

### `validate:experiment`

Command:

```bash
npm run validate:experiment -- experiments/dao-vote-costs-v1
```

Purpose:

- checks required artifact presence
- checks cross-file consistency
- checks approval gate conditions
- checks simulation payload shape at a pragmatic level
- updates `70-execution/71-run-manifest.json` with validation metadata on success

What it does not do yet:

- full JSON Schema evaluation
- live backend checks
- semantic validation of MCP source contents

### `generate:simulation-input`

Command:

```bash
npm run generate:simulation-input -- experiments/dao-vote-costs-v1
```

Purpose:

- reads approved proposals
- applies human review edits
- reads the simulation blueprint
- emits a backend-compatible `70-execution/70-simulation-input.json`
- updates `70-execution/71-run-manifest.json` with generation metadata and artifact hashes

Inputs:

- `50-generated-proposals/50-med-proposal.json`
- `50-generated-proposals/51-probability-model-proposal.json`
- `60-human-review/60-review-decision.json`
- `10-human-input/13-simulation-blueprint.json`

Output:

- `70-execution/70-simulation-input.json`

Important constraint:

The generator only supports distribution types that the current backend already understands.

### `update:run-manifest`

Command:

```bash
npm run update:run-manifest -- experiments/dao-vote-costs-v1 generation
```

Supported stages:

- `generation`
- `validation`

Purpose:

- records the current Git commit SHA when available
- computes SHA-256 hashes for tracked experiment artifacts
- stores generation metadata or validation metadata in `70-execution/71-run-manifest.json`

This command is also invoked automatically by the generator and validator.

### `launch:experiment`

Command:

```bash
npm run launch:experiment -- experiments/dao-vote-costs-v1
```

Optional custom API base URL:

```bash
npm run launch:experiment -- experiments/dao-vote-costs-v1 http://localhost:8099
```

Purpose:

- validates the experiment before launch
- loads `70-execution/70-simulation-input.json`
- submits the compatible payload to `POST /newsimulation`
- updates `70-execution/71-run-manifest.json` with launch metadata

Notes:

- the launch script sends only the backend-supported simulation fields
- it does not yet collect the final TSV path from the filesystem

## Recommended Local Workflow

1. Prepare or update the experiment artifacts.
2. Prepare or refresh the retrieval request.
3. Render retrieval prompts.
4. Capture MCP outputs into the server-specific capture files.
5. Assemble `30-mcp-raw/39-raw-mcp-retrieval.json`.
6. Normalize the retrieval evidence.
7. Generate the MED proposal.
8. Generate the probability model proposal.
9. Prepare or refresh the review decision.
10. Run the review consistency check.
11. Validate the experiment.
12. Generate the simulation input from approved artifacts.
13. Validate again if the simulation payload changed.
14. Launch the experiment against the backend.

Example:

```bash
npm run prepare:retrieval-request -- experiments/dao-vote-costs-v1
npm run render:retrieval-prompts -- experiments/dao-vote-costs-v1
npm run assemble:raw-mcp-retrieval -- experiments/dao-vote-costs-v1
npm run normalize:retrieval-evidence -- experiments/dao-vote-costs-v1
npm run generate:med-proposal -- experiments/dao-vote-costs-v1
npm run generate:probability-model-proposal -- experiments/dao-vote-costs-v1
npm run prepare:review-decision -- experiments/dao-vote-costs-v1
npm run check:review-consistency -- experiments/dao-vote-costs-v1
npm run validate:experiment -- experiments/dao-vote-costs-v1
npm run generate:simulation-input -- experiments/dao-vote-costs-v1
npm run validate:experiment -- experiments/dao-vote-costs-v1
npm run launch:experiment -- experiments/dao-vote-costs-v1
```

## Human Review Responsibilities

The tooling assumes a human reviewer is responsible for:

- confirming that the MCP evidence is sufficient
- accepting or editing MED proposals
- accepting or editing probability model proposals
- approving the simulation blueprint

Without that review gate, the generated simulation input should not be treated as a valid experiment.

## Current Limitations

- MCP retrieval is still manual from the perspective of the repository tooling.
- MED proposal generation is not yet automated inside the repo.
- Probability proposal generation is not yet automated inside the repo.
- JSON Schema files exist, but the validator is still custom and lightweight.
- The backend still uses timestamp-based output naming.

## Next Logical Extensions

- add a schema-driven validator
- add a richer launcher that discovers produced TSV outputs and records them
- add automated artifact generation for the evidence and proposal stages
