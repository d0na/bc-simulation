# How To Create And Run An Experiment

This guide explains, step by step, how to create, populate, review, validate, and launch a reproducible experiment in Sesame.

It is intentionally practical. The goal is not just to describe the artifact model, but to show the exact order of operations needed to pilot a real example from start to finish.

## Who This Guide Is For

Use this guide if you want to:

- create a new experiment from scratch
- duplicate and adapt the existing `dao-vote-costs-v1` example
- understand which files are human-authored and which files are generated
- understand when the human review gate must intervene
- launch the final simulation through the existing backend

## Pre-Requisites

You should already have:

- the Sesame repository checked out locally
- Node.js 20+ available
- Java 21+ available
- the backend available when you want to launch the simulation
- the MCP servers available when you want to collect live data

Useful commands:

```bash
npm run dev:all
```

This starts:

- `apps/api`
- `apps/web`
- `mcp-server`

If you only need the backend for experiment launch:

```bash
npm run dev:api
```

## Mental Model

An experiment is not a single JSON file.

It is a chain of versioned artifacts:

1. request what should be retrieved
2. render prompt payloads
3. capture raw MCP outputs
4. normalize evidence
5. generate MED proposals
6. generate probability model proposals
7. review and approve
8. generate simulation input
9. launch simulation

The main rule is:

Never skip intermediate artifacts if you want reproducibility.

## Fast Start: Clone The Existing Example

The fastest way to create a new experiment is to copy the example directory:

```bash
cp -R experiments/dao-vote-costs-v1 experiments/my-new-experiment
```

Then rename and adjust all references:

- `experiment_id` in every artifact
- experiment folder name
- contract address and label
- objective
- aggregation rules
- probability model rules
- simulation blueprint

At minimum, inspect these files first:

- `experiment.json`
- `00-overview/00-objective.md`
- `00-overview/01-status-and-notes.md`
- `10-human-input/10-retrieval-request.json` after running its preparation step
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`

## Directory And File Roles

Inside an experiment directory, each file has a different role.

### `00-overview/`

- `00-objective.md`
  Human-readable statement of the experiment objective.

- `01-status-and-notes.md`
  Human-readable operating notes, workflow order, and review gate reminders.

### `10-human-input/`

- `experiment.json`
  This is the top-level descriptor. It defines the experiment identity and the artifact paths.

- `10-retrieval-request.json`
  This is script-prepared first, then reviewed and optionally edited by the user. It describes what should be retrieved from Etherscan and Dune.

- `11-med-aggregation-rules.json`
  AI-proposed rules, then reviewed and optionally edited by the user, that define how low-level evidence becomes MEDs.

- `12-probability-model-rules.json`
  Deterministic rules for probability model generation.

- `13-simulation-blueprint.json`
  Human-approved mapping from MEDs and probability models to backend simulation events.

### `20-rendered-prompts/`

- `20-rendered-retrieval-prompts.json`
  This contains the concrete retrieval prompt payloads derived from the request.

### `30-mcp-raw/`

- `30-etherscan-mcp-capture.json`
  Raw or near-raw capture from the Etherscan MCP workflow.

- `31-dune-mcp-capture.json`
  Raw or near-raw capture from the Dune MCP workflow.

- `32-simulation-mcp-capture.json`
  Optional structured capture from the simulation MCP workflow.

- `39-raw-mcp-retrieval.json`
  Unified raw retrieval bundle assembled from the server-specific captures.

### `40-normalized-evidence/`

- `40-retrieval-evidence.json`
  Canonical normalized evidence used by the rest of the framework.

### `50-generated-proposals/`

- `50-med-proposal.json`
  Generated MED proposal.

- `51-probability-model-proposal.json`
  Generated probability proposal.

### `60-human-review/`

- `60-review-decision.json`
  Script-prepared review record that is then completed and approved by the human reviewer.

### `70-execution/`

- `70-simulation-input.json`
  Backend-compatible payload generated from approved artifacts.

- `71-run-manifest.json`
  Traceability record with artifact hashes, Git SHA, generation metadata, and launch metadata.

- `72-validation-report.json`
  Validation record placeholder.

## Step 1: Create Or Update `experiment.json`

This file must reflect the full experiment artifact set.

When creating a new experiment:

1. set a unique `experiment_id`
2. set a clear `objective`
3. keep the artifact paths aligned with the files that will exist in the directory
4. keep the prompt template references aligned with the `prompts/` directory

If you rename the experiment folder but do not update `experiment.json`, the validator will still read files, but traceability will be wrong.

## Step 2: Prepare Retrieval Intent

Run:

```bash
npm run prepare:retrieval-request -- experiments/my-new-experiment
```

What it does:

- creates or refreshes `10-human-input/10-retrieval-request.json`
- binds the experiment objective to the prompt templates

What you should then inspect:

- target chain
- target contract address
- target contract label
- Dune analysis window
- requested metrics

If the request is wrong, every downstream artifact will be wrong.

## Step 3: Render Prompt Payloads

Run:

```bash
npm run render:retrieval-prompts -- experiments/my-new-experiment
```

What it does:

- generates `20-rendered-prompts/20-rendered-retrieval-prompts.json`
- produces one concrete Etherscan prompt payload
- produces one concrete Dune prompt payload

How to use it:

- copy or adapt the rendered text when using the live MCP tools
- treat this file as the auditable bridge between repository intent and tool usage

## Step 4: Capture Live MCP Outputs

Populate the server-specific capture files:

- `30-mcp-raw/30-etherscan-mcp-capture.json`
- `30-mcp-raw/31-dune-mcp-capture.json`
- optionally `30-mcp-raw/32-simulation-mcp-capture.json`

This step is currently manual from the repository point of view.

The intended pattern is:

1. run the MCP queries externally
2. copy the relevant structured results into the capture files
3. keep `source_ref` or equivalent provenance fields

### Etherscan Capture Expectations

Typical fields:

- `function_name`
- `gas_estimate`
- `source_ref`
- `event_name`

### Dune Capture Expectations

Typical fields:

- `metric_name`
- `granularity`
- `trend_hint`
- `notes`
- `source_ref`

### Simulation MCP Capture Expectations

This file is currently more of a placeholder.

Use it to persist:

- blueprint suggestions
- dry-run notes
- simulation-side interpretations that you do not want to lose

## Step 5: Assemble Unified Raw Retrieval

Run:

```bash
npm run assemble:raw-mcp-retrieval -- experiments/my-new-experiment
```

What it does:

- reads the server-specific capture files
- writes `30-mcp-raw/39-raw-mcp-retrieval.json`

Why it matters:

- it freezes the cross-server raw state into one bundle
- it gives you one input for normalization and review

## Step 6: Normalize Retrieval Evidence

Run:

```bash
npm run normalize:retrieval-evidence -- experiments/my-new-experiment
```

What it does:

- converts raw MCP fields into canonical evidence
- writes `40-normalized-evidence/40-retrieval-evidence.json`

What you should inspect:

- function names
- event names
- metric names
- provenance references
- trend hints

This is the point where low-quality raw capture becomes obvious.

## Step 7: Define MED Aggregation Rules

Edit:

```text
experiments/my-new-experiment/10-human-input/11-med-aggregation-rules.json
```

Each rule should answer:

- which functions belong to one MED
- which events belong to one MED
- which metrics justify the abstraction
- how to derive representative gas
- what the rationale sentence should be

Keep rules narrow.

Bad MED:

- “all governance activity”

Better MEDs:

- “proposal lifecycle”
- “voting interaction”
- “treasury execution”

## Step 8: Generate MED Proposal

Run:

```bash
npm run generate:med-proposal -- experiments/my-new-experiment
```

What it does:

- reads normalized evidence
- applies the MED rules
- writes `50-generated-proposals/50-med-proposal.json`

What you should inspect:

- `maps_to.functions`
- `maps_to.events`
- `cost_model.representative_gas`
- `evidence_refs`
- `rationale`

If the MED proposal is conceptually wrong, fix the rules, not the generated file.

## Step 9: Define Probability Model Rules

Edit:

```text
experiments/my-new-experiment/10-human-input/12-probability-model-rules.json
```

Each rule should specify:

- target MED
- distribution type
- parameters
- evidence metric names
- confidence
- reviewer-facing notes

Important:

The final simulation generator only supports distribution types that the backend already accepts.

Do not invent unsupported types unless you also plan to extend the backend.

## Step 10: Generate Probability Model Proposal

Run:

```bash
npm run generate:probability-model-proposal -- experiments/my-new-experiment
```

What it does:

- reads normalized evidence
- reads generated MEDs
- applies the probability model rules
- writes `50-generated-proposals/51-probability-model-proposal.json`

What you should inspect:

- `target_med`
- `distribution_type`
- `parameters`
- `heuristic_parameters`
- `evidence_refs`
- `confidence`

## Step 11: Prepare Human Review

Run:

```bash
npm run prepare:review-decision -- experiments/my-new-experiment
```

What it does:

- refreshes `60-human-review/60-review-decision.json`
- records proposal hashes
- preserves existing edits and notes when possible

At this point a human reviewer should inspect:

- `40-normalized-evidence/40-retrieval-evidence.json`
- `50-generated-proposals/50-med-proposal.json`
- `50-generated-proposals/51-probability-model-proposal.json`
- `10-human-input/13-simulation-blueprint.json`

## Step 12: Human Review And Edits

The reviewer should then decide:

- reject
- approve
- approve with edits

The most important part is not the status string itself, but whether `60-human-review/60-review-decision.json` accurately reflects:

- what was reviewed
- what was changed
- which proposal hashes were approved

### When To Edit The Review File

Edit `60-human-review/60-review-decision.json` when:

- a generated MED cost should be overridden
- a probability parameter should be reduced or increased
- a rationale is accepted but parameters need calibration

Typical example edits:

- increase `representative_gas`
- reduce `scalingFactorY`
- keep the model but lower confidence in notes

## Step 13: Check Review Consistency

Run:

```bash
npm run check:review-consistency -- experiments/my-new-experiment
```

What it does:

- compares current proposal hashes against the hashes recorded in the review
- fails if the proposals changed after review

This is critical.

If the check fails, do not proceed to simulation generation.
Either:

- regenerate the review file and review again
- or restore the proposals that were actually approved

## Step 14: Validate The Experiment

Run:

```bash
npm run validate:experiment -- experiments/my-new-experiment
```

What it checks:

- artifact presence
- experiment id consistency
- proposal structure
- review approval integrity
- simulation payload shape

What it does not fully check:

- semantic quality of your abstractions
- realism of your probability parameters
- whether Etherscan or Dune data was interpreted correctly

## Step 15: Generate Simulation Input

Run:

```bash
npm run generate:simulation-input -- experiments/my-new-experiment
```

What it does:

- applies approved review edits
- maps MEDs and probability models through the blueprint
- writes backend-compatible `70-execution/70-simulation-input.json`

The blueprint file is where you define:

- event names
- entity names
- instance creation mapping
- dependency mapping
- optional gas overrides

## Step 16: Validate Again

Run:

```bash
npm run validate:experiment -- experiments/my-new-experiment
```

Run validation again after generating simulation input because this is the point where:

- unsupported distribution types
- bad dependency mappings
- missing entities

become operational launch risks.

## Step 17: Launch The Experiment

Start the backend if needed:

```bash
npm run dev:api
```

Then launch:

```bash
npm run launch:experiment -- experiments/my-new-experiment
```

Or with an explicit backend URL:

```bash
npm run launch:experiment -- experiments/my-new-experiment http://localhost:8099
```

What it does:

- loads `70-execution/70-simulation-input.json`
- POSTs to `/newsimulation`
- updates `70-execution/71-run-manifest.json`

## Step 18: Inspect The Manifest

After generation, validation, or launch, inspect:

```text
experiments/my-new-experiment/70-execution/71-run-manifest.json
```

Key fields:

- `code_version`
- `artifact_hashes`
- `generation`
- `validation`
- `launch`

This file is your minimum reproducibility ledger.

## Recommended Command Sequence

For a normal end-to-end run:

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

## Common Failure Modes

### Validator fails on review hash drift

Cause:

- proposals changed after review

Fix:

- rerun `prepare:review-decision`
- re-review and update `60-human-review/60-review-decision.json`

### MED proposal is structurally correct but conceptually wrong

Cause:

- aggregation rules are too broad or too weak

Fix:

- edit `10-human-input/11-med-aggregation-rules.json`
- regenerate MED proposal

### Probability proposal uses unrealistic parameters

Cause:

- rule defaults are too heuristic

Fix:

- edit `10-human-input/12-probability-model-rules.json`
- regenerate probability proposal

### Simulation input generation fails

Cause:

- blueprint references unknown MED or model ids

Fix:

- align `10-human-input/13-simulation-blueprint.json` with generated proposals

### Launch fails

Cause:

- backend not running
- backend rejects payload
- unsupported distribution type

Fix:

- start backend
- inspect `70-execution/70-simulation-input.json`
- reduce the payload to supported backend fields only

## Minimal Advice For Real Use

- Treat generated proposal files as disposable outputs.
- Treat rules files as the durable source of truth.
- Treat `60-human-review/60-review-decision.json` as a compliance artifact, not as a scratchpad.
- Treat `70-execution/71-run-manifest.json` as the main audit record.
- When in doubt, regenerate and re-review instead of patching generated files manually.
