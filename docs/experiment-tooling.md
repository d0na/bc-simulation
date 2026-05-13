# Experiment Tooling Guide

This document explains how to use the local tooling that supports the reproducible MCP-assisted experiment workflow in Sesame.

## Scope

The current tooling covers the local orchestration layer around an experiment:

- retrieval request preparation
- retrieval prompt rendering
- retrieval evidence normalization
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
- `raw-mcp-retrieval.json`
- `retrieval-evidence.json`
- `med-proposal.json`
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
4. Capture MCP retrieval output into `raw-mcp-retrieval.json`.
5. Normalize the retrieval evidence.
6. Validate the experiment.
7. Generate the simulation input from approved artifacts.
8. Validate again if the simulation payload changed.
9. Launch the experiment against the backend.

Example:

```bash
npm run prepare:retrieval-request -- experiments/dao-vote-costs-v1
npm run render:retrieval-prompts -- experiments/dao-vote-costs-v1
npm run normalize:retrieval-evidence -- experiments/dao-vote-costs-v1
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
