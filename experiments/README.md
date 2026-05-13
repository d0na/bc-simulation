# Reproducible Experiment Framework

This directory contains the versioned artifacts required to reproduce an MCP-assisted smart-contract simulation experiment.

## Goals

- Replace free-form prompting with versioned prompt templates.
- Preserve the agent contribution as structured files instead of chat history.
- Require a human review gate before launching simulations.
- Make every simulation run traceable to the exact evidence, abstractions, and approved assumptions that produced it.

## Workflow

1. Retrieve contract and trend evidence through MCP servers.
2. Produce a structured MED proposal from the retrieved evidence.
3. Produce a structured probabilistic model proposal from the same evidence.
4. Let a human reviewer approve or modify the proposals.
5. Generate a simulation input compatible with the existing Sesame backend.
6. Run the simulation and write a run manifest plus a validation report.

## Directory Layout

```text
prompts/
  etherscan/
  dune/
  agent/
schemas/
experiments/
  dao-vote-costs-v1/
artifacts/
  runs/
```

## Artifact Types

- `retrieval-evidence.json`: raw structured evidence collected through MCP tools.
- `med-proposal.json`: agent proposal for Macro Event Descriptors derived from the evidence.
- `probability-model-proposal.json`: agent proposal for trend and probability models.
- `review-decision.json`: human review outcome, required before simulation.
- `simulation-input.json`: normalized simulation request derived from approved proposals.
- `run-manifest.json`: execution metadata for a concrete run.
- `validation-report.json`: validation outcome for the experiment and its outputs.

## Human Review Requirement

No simulation should be launched from agent output alone.

The minimum rule is:

- `review-decision.json.status` must be `approved` or `approved_with_edits`
- `simulation-input.json` must reference the approved review artifact
- `run-manifest.json` must record the exact approved artifacts used for the run

## Relationship With Existing Sesame Code

The existing backend already accepts a simulation payload shaped like `SimulationRequestDTO` in `apps/api`.
This framework adds the missing reproducibility layer around that payload:

- prompt versioning
- evidence preservation
- MED abstraction
- human approval
- run traceability
- validation reporting

## What Still Needs To Be Developed

- Full JSON Schema validation for all experiment artifacts.
- A generator that converts approved proposals into `simulation-input.json`.
- A manifest enricher that captures code version, hashes, run location, and validation status in a stronger way.
- Optional backend changes to support deterministic output names instead of timestamp-only naming.

## Local Commands

Validate an experiment directory:

```bash
npm run validate:experiment -- experiments/dao-vote-costs-v1
```

Launch an approved experiment against the existing backend:

```bash
npm run launch:experiment -- experiments/dao-vote-costs-v1
```

Override the backend base URL when needed:

```bash
npm run launch:experiment -- experiments/dao-vote-costs-v1 http://localhost:8099
```

The validator is intentionally lightweight and dependency-free. It checks artifact presence and cross-file consistency, but it is not yet a full JSON Schema engine.

## Example

See [dao-vote-costs-v1](</Users/francesco/workspace/git/research/sesame/experiments/dao-vote-costs-v1>) for a minimal end-to-end example.
