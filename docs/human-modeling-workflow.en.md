# Human Modeling Workflow

This guide explains the human-in-the-loop workflow for modeling and running a reproducible experiment in Sesame.

It is intentionally different from the tooling guide:

- the tooling guide explains what each script does
- this guide explains what the user should decide, when to run commands, which files are produced, and when to revise upstream assumptions

## Core Principle

The workflow is not:

1. ask the AI for a simulation
2. launch it immediately

The workflow is:

1. define the experiment scope
2. collect evidence
3. let the system propose abstractions
4. review those abstractions as a human modeler
5. approve or edit the assumptions
6. generate the backend payload
7. validate and launch

The human is responsible for the modeling judgment.
The local tooling is responsible for preserving traceability.

## File Categories

Before looking at the step-by-step flow, distinguish three categories of files.

### Human-authored source files

These are the files that are normally authored directly by the user and should be treated as source of truth:

- `experiment.json`
- `00-overview/00-objective.md`
- `00-overview/01-status-and-notes.md`

### AI-proposed or script-prepared, then human-reviewed files

These are initialized by AI or scripts, but they still require human review and may be manually edited afterward:

- `10-human-input/10-retrieval-request.json`
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`
- `60-human-review/60-review-decision.json`

### Generated or derived files

These should normally not be manually edited:

- `20-rendered-prompts/20-rendered-retrieval-prompts.json`
- `30-mcp-raw/39-raw-mcp-retrieval.json`
- `40-normalized-evidence/40-retrieval-evidence.json`
- `50-generated-proposals/50-med-proposal.json`
- `50-generated-proposals/51-probability-model-proposal.json`
- `70-execution/70-simulation-input.json`
- `70-execution/71-run-manifest.json`
- `70-execution/72-validation-report.json`

### Raw capture files

These are repository-tracked copies of MCP outputs. They are structured, but they still represent captured upstream data:

- `30-mcp-raw/30-etherscan-mcp-capture.json`
- `30-mcp-raw/31-dune-mcp-capture.json`
- `30-mcp-raw/32-simulation-mcp-capture.json`

When generated outputs look wrong, the normal fix is:

1. correct the human-authored input or the raw capture
2. regenerate downstream files

Do not treat generated proposal files as the main editing surface.

## End-To-End Human Flow

## Step 1: Define The Experiment

You define:

- the experiment name
- the objective
- the contract and chain you care about
- the broad phenomenon to simulate

Files to create or review:

- `experiment.json`
- `00-overview/00-objective.md`
- `00-overview/01-status-and-notes.md`

Questions to answer:

- What behavior am I trying to understand?
- Which contract or protocol slice is in scope?
- Which business or research question am I testing?

You should not launch anything yet.

## Step 2: Define The Human Input Layer

You define:

- what evidence should be retrieved
- how evidence should be grouped into MEDs
- how probability models should be proposed
- how approved abstractions will map into backend simulation events

Files to define:

- `10-human-input/10-retrieval-request.json`
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`

Notes:

- `10-retrieval-request.json` is script-prepared first, then reviewed and possibly edited by the human
- `11`, `12`, and `13` are AI-proposed first, then reviewed and possibly edited by the human

## Step 3: Prepare The Retrieval Request

Run:

```bash
npm run prepare:retrieval-request -- experiments/my-new-experiment
```

Produced or refreshed file:

- `10-human-input/10-retrieval-request.json`

Lifecycle of this file:

1. the script prepares or refreshes it
2. the user reviews it
3. the user edits it when needed

You then review:

- target contract address
- chain
- Dune window
- requested metrics
- retrieval focus

If this file is wrong, downstream evidence will be wrong.

## Step 4: Render MCP Prompt Payloads

Run:

```bash
npm run render:retrieval-prompts -- experiments/my-new-experiment
```

Produced file:

- `20-rendered-prompts/20-rendered-retrieval-prompts.json`

You use this as the repository-backed prompt source for live MCP usage.

At this stage you do not yet have evidence.
You only have the prepared request that will drive evidence collection.

## Step 5: Capture Raw MCP Outputs

You now collect data from the MCP servers and store the results in:

- `30-mcp-raw/30-etherscan-mcp-capture.json`
- `30-mcp-raw/31-dune-mcp-capture.json`
- `30-mcp-raw/32-simulation-mcp-capture.json` when relevant

Human responsibility at this stage:

- confirm that the contract-level data is about the intended contract
- confirm that the Dune results match the intended metric and time window
- preserve provenance references when available
- avoid copying irrelevant or noisy material

This is still a pre-modeling stage.
You are collecting evidence, not yet approving abstractions.

## Step 6: Assemble The Unified Raw Bundle

Run:

```bash
npm run assemble:raw-mcp-retrieval -- experiments/my-new-experiment
```

Produced file:

- `30-mcp-raw/39-raw-mcp-retrieval.json`

This freezes the raw MCP state into one repository artifact.

## Step 7: Normalize Evidence

Run:

```bash
npm run normalize:retrieval-evidence -- experiments/my-new-experiment
```

Produced file:

- `40-normalized-evidence/40-retrieval-evidence.json`

Human review at this stage:

- are the important functions present?
- are the important events present?
- are the trend metrics present?
- is the evidence traceable back to the raw captures?
- is there anything obviously missing or mislabeled?

If the evidence is wrong:

- revise the raw capture files or the retrieval request
- regenerate

Do not normally patch normalized evidence by hand.

## Step 8: Generate The MED Proposal

Run:

```bash
npm run generate:med-proposal -- experiments/my-new-experiment
```

Produced file:

- `50-generated-proposals/50-med-proposal.json`

This proposal should be read as:

- a candidate abstraction layer
- not a final approved model

Human questions:

- is each MED too broad or too narrow?
- do the grouped functions and events belong together?
- is the representative gas plausible?
- does the rationale describe a real behavioral unit?

If the MED proposal is weak:

- edit `10-human-input/11-med-aggregation-rules.json`
- regenerate

## Step 9: Generate The Probability Proposal

Run:

```bash
npm run generate:probability-model-proposal -- experiments/my-new-experiment
```

Produced file:

- `50-generated-proposals/51-probability-model-proposal.json`

Human questions:

- is the chosen distribution consistent with the observed trend?
- are the parameters plausible?
- is the proposal too speculative for the available evidence?
- is the confidence overstated?
- does the backend support the proposed distribution type?

If the proposal is weak:

- edit `10-human-input/12-probability-model-rules.json`
- regenerate

## Step 10: Prepare The Review Record

Run:

```bash
npm run prepare:review-decision -- experiments/my-new-experiment
```

Produced or refreshed file:

- `60-human-review/60-review-decision.json`

This file records:

- review status
- which artifacts are under review
- artifact hashes
- human edits
- reviewer notes

Lifecycle of this file:

1. the script prepares or refreshes the review scaffold
2. the user decides review status
3. the user records edits, notes, and approval intent

This is where the human modeler turns generated proposals into approved assumptions.

## Step 11: Perform The Human Modeling Review

Read together:

- `40-normalized-evidence/40-retrieval-evidence.json`
- `50-generated-proposals/50-med-proposal.json`
- `50-generated-proposals/51-probability-model-proposal.json`
- `10-human-input/13-simulation-blueprint.json`
- `60-human-review/60-review-decision.json`

Then decide:

- reject
- approve
- approve with edits

Typical human edits:

- raise or lower representative gas
- reduce a probability parameter
- keep a model but downgrade confidence in notes
- document assumptions that are not directly observed

This is the most important modeling step in the whole pipeline.

## Step 12: Check Review Consistency

Run:

```bash
npm run check:review-consistency -- experiments/my-new-experiment
```

Produced result:

- pass or fail

This step verifies that the reviewed proposal hashes still match the current proposal files.

If it fails:

- either re-run review preparation and review again
- or restore the proposal version that was actually approved

## Step 13: Validate The Experiment

Run:

```bash
npm run validate:experiment -- experiments/my-new-experiment
```

Updated file:

- `70-execution/71-run-manifest.json`

This checks that the experiment is internally coherent enough to proceed.

It is not a substitute for modeling judgment.

## Step 14: Generate The Final Simulation Payload

Run:

```bash
npm run generate:simulation-input -- experiments/my-new-experiment
```

Produced file:

- `70-execution/70-simulation-input.json`

This is generated from:

- approved MED proposal
- approved probability proposal
- human review edits
- simulation blueprint

If the output payload looks wrong, the normal upstream files to revisit are:

- `10-human-input/13-simulation-blueprint.json`
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `60-human-review/60-review-decision.json`

## Step 15: Validate Again

Run:

```bash
npm run validate:experiment -- experiments/my-new-experiment
```

Why validate again:

- now the final execution payload exists
- blueprint mistakes become operational risks at this point

## Step 16: Launch The Experiment

Run:

```bash
npm run launch:experiment -- experiments/my-new-experiment
```

Uses:

- `70-execution/70-simulation-input.json`

Updates:

- `70-execution/71-run-manifest.json`

You should launch only after the review gate is satisfied.

## Step 17: Inspect The Run Manifest

Read:

- `70-execution/71-run-manifest.json`

This is the minimum audit record for reproducibility.

It tells you:

- which artifacts were used
- which hashes were present
- when generation happened
- when validation happened
- when launch happened
- which code revision was active

## What The Human Actually Owns

The human modeler owns:

- experiment scope
- retrieval scope
- MED grouping logic
- probability modeling logic
- review approval
- execution authorization

The tooling owns:

- prompt rendering
- artifact assembly
- evidence normalization
- proposal generation
- payload generation
- traceability metadata

The mixed-responsibility files are:

- `10-human-input/10-retrieval-request.json`
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`
- `60-human-review/60-review-decision.json`

They are not purely generated, and they are not purely authored from scratch.
They are AI-proposed or script-prepared first, then finalized by the human.

## Recommended Mental Rule

When a downstream file looks wrong, ask:

1. is the raw evidence wrong?
2. are the human rules wrong?
3. is the review outdated?
4. is the blueprint wrong?

Only after answering those questions should you regenerate.

Do not use generated artifacts as the main long-term editing surface.

## Minimal Command Sequence

```bash
npm run prepare:retrieval-request -- experiments/my-new-experiment
npm run render:retrieval-prompts -- experiments/my-new-experiment
npm run assemble:raw-mcp-retrieval -- experiments/my-new-experiment
npm run normalize:retrieval-evidence -- experiments/my-new-experiment
npm run generate:med-proposal -- experiments/my-new-experiment
npm run generate:probability-model-proposal -- experiments/my-new-experiment
npm run prepare:review-decision -- experiments/my-new-experiment
npm run check:review-consistency -- experiments/my-new-experiment
npm run validate:experiment -- experiments/my-new-experiment
npm run generate:simulation-input -- experiments/my-new-experiment
npm run validate:experiment -- experiments/my-new-experiment
npm run launch:experiment -- experiments/my-new-experiment
```
