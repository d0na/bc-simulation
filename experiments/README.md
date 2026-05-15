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
  example-template/
  dao-vote-costs-v1/
artifacts/
  runs/
```

## Artifact Types

- `retrieval-evidence.json`: raw structured evidence collected through MCP tools.
- `med-proposal.json`: agent proposal for Macro Event Descriptors derived from the evidence.
- `probability-model-proposal.json`: agent proposal for trend and probability models.
- `review-decision.json`: human review outcome, required before simulation.
- `simulation-blueprint.json`: human-approved binding from MEDs and probability models to backend simulation events.
- `simulation-input.json`: normalized simulation request derived from approved proposals.
- `run-manifest.json`: execution metadata for a concrete run.
- `validation-report.json`: validation outcome for the experiment and its outputs.

## Human Review Requirement

No simulation should be launched from agent output alone.

The minimum rule is:

- `review-decision.json.status` must be `approved` or `approved_with_edits`
- `simulation-blueprint.json` must exist and define the backend-facing event mapping
- `run-manifest.json` must record the exact approved artifacts used for the run

## Relationship With Existing Sesame Code

The existing backend already accepts a simulation payload shaped like `SimulationRequestDTO` in `apps/api`.
This framework adds the missing reproducibility layer around that payload:

- prompt versioning
- evidence preservation
- MED abstraction
- human approval
- simulation blueprinting
- run traceability
- validation reporting

## What Still Needs To Be Developed

- Full JSON Schema validation for all experiment artifacts.
- A stronger generator that can infer more of `simulation-blueprint.json` from agent outputs, with less manual binding.
- A manifest enricher that captures code version, hashes, run location, and validation status in a stronger way.
- Optional backend changes to support deterministic output names instead of timestamp-only naming.

## Local Commands

Validate an experiment directory:

```bash
npm run validate:experiment -- experiments/dao-vote-costs-v1
```

Generate `simulation-input.json` from the approved proposals plus the simulation blueprint:

```bash
npm run generate:simulation-input -- experiments/dao-vote-costs-v1
```

Refresh the run manifest hashes and metadata explicitly:

```bash
npm run update:run-manifest -- experiments/dao-vote-costs-v1 generation
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
It also updates the run manifest with a validation timestamp when validation succeeds.

## Example

Use [example-template](</Users/francesco/workspace/git/research/sesame/experiments/example-template>) as the clean starting structure for a new experiment.
See [dao-vote-costs-v1](</Users/francesco/workspace/git/research/sesame/experiments/dao-vote-costs-v1>) for a populated end-to-end example.
See [docs/experiment-tooling.md](/Users/francesco/workspace/git/research/sesame/docs/experiment-tooling.md) for the command-level usage guide.
See [docs/human-modeling-workflow.en.md](/Users/francesco/workspace/git/research/sesame/docs/human-modeling-workflow.en.md) for the human decision flow.
See [docs/human-modeling-workflow.it.md](/Users/francesco/workspace/git/research/sesame/docs/human-modeling-workflow.it.md) for the same flow in Italian.
