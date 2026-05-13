# Experiment Tooling Guide

This document explains how to use the local tooling that supports the reproducible MCP-assisted experiment workflow in Sesame.

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

An experiment directory should contain at least these files:

- `experiment.json`
- `retrieval-request.json`
- `rendered-retrieval-prompts.json`
- `etherscan-mcp-capture.json`
- `dune-mcp-capture.json`
- `simulation-mcp-capture.json`
- `raw-mcp-retrieval.json`
- `retrieval-evidence.json`
- `med-aggregation-rules.json`
- `med-proposal.json`
- `probability-model-rules.json`
- `probability-model-proposal.json`
- `review-decision.json`
- `simulation-blueprint.json`
- `simulation-input.json`
- `run-manifest.json`
- `validation-report.json`

## Tooling Overview

### `prepare:retrieval-request`

Command:

```bash
npm run prepare:retrieval-request -- experiments/dao-vote-costs-v1
```

Purpose:

- creates or refreshes `retrieval-request.json`
- binds the experiment objective to the Etherscan and Dune templates
- materializes the contract target and requested metrics in one auditable file

This file is intended to become the stable handoff between the repository workflow and the live MCP retrieval stage.

### `render:retrieval-prompts`

Command:

```bash
npm run render:retrieval-prompts -- experiments/dao-vote-costs-v1
```

Purpose:

- reads `retrieval-request.json`
- materializes concrete Etherscan and Dune prompt payloads
- writes them to `rendered-retrieval-prompts.json`

This artifact is the last local step before using the MCP tools for live retrieval.

### `assemble:raw-mcp-retrieval`

Command:

```bash
npm run assemble:raw-mcp-retrieval -- experiments/dao-vote-costs-v1
```

Purpose:

- reads the server-specific capture files
- assembles them into the repository-wide `raw-mcp-retrieval.json`
- updates `run-manifest.json` with refreshed hashes

This step makes the raw ingestion contract explicit for Etherscan, Dune, and the simulation MCP server.

### `normalize:retrieval-evidence`

Command:

```bash
npm run normalize:retrieval-evidence -- experiments/dao-vote-costs-v1
```

Purpose:

- reads `raw-mcp-retrieval.json`
- maps raw Etherscan and Dune capture fields into the canonical `retrieval-evidence.json` format
- updates `run-manifest.json` with refreshed hashes

This is the current bridge between live MCP results and the repository's normalized evidence model.

### `generate:med-proposal`

Command:

```bash
npm run generate:med-proposal -- experiments/dao-vote-costs-v1
```

Purpose:

- reads `retrieval-evidence.json`
- applies `med-aggregation-rules.json`
- writes a deterministic `med-proposal.json`
- updates `run-manifest.json` with refreshed hashes

This is the first repository-local automation step for the agent abstraction layer.

### `generate:probability-model-proposal`

Command:

```bash
npm run generate:probability-model-proposal -- experiments/dao-vote-costs-v1
```

Purpose:

- reads `retrieval-evidence.json`
- reads `med-proposal.json`
- applies `probability-model-rules.json`
- writes a deterministic `probability-model-proposal.json`
- updates `run-manifest.json` with refreshed hashes

### `prepare:review-decision`

Command:

```bash
npm run prepare:review-decision -- experiments/dao-vote-costs-v1
```

Purpose:

- refreshes `review-decision.json`
- records the hashes of the proposal artifacts currently under review
- preserves existing review notes and edits when possible

Use this after regenerating MED or probability proposals and before a human reviewer signs off again.

### `check:review-consistency`

Command:

```bash
npm run check:review-consistency -- experiments/dao-vote-costs-v1
```

Purpose:

- compares the hashes recorded in `review-decision.json` against the current proposal artifacts
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
- updates `run-manifest.json` with validation metadata on success

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
- emits a backend-compatible `simulation-input.json`
- updates `run-manifest.json` with generation metadata and artifact hashes

Inputs:

- `med-proposal.json`
- `probability-model-proposal.json`
- `review-decision.json`
- `simulation-blueprint.json`

Output:

- `simulation-input.json`

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
- stores generation metadata or validation metadata in `run-manifest.json`

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
- loads `simulation-input.json`
- submits the compatible payload to `POST /newsimulation`
- updates `run-manifest.json` with launch metadata

Notes:

- the launch script sends only the backend-supported simulation fields
- it does not yet collect the final TSV path from the filesystem

## Recommended Local Workflow

1. Prepare or update the experiment artifacts.
2. Prepare or refresh the retrieval request.
3. Render retrieval prompts.
4. Capture MCP outputs into the server-specific capture files.
5. Assemble `raw-mcp-retrieval.json`.
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
