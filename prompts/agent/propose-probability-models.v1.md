# Template Metadata

- `template_id`: `agent.propose-probability-models`
- `version`: `1.0.0`
- `output_schema`: `schemas/probability-model-proposal.schema.json`

# Purpose

Propose simulation-oriented probability models from structured trend evidence.

# Required Inputs

- `retrieval_evidence`
- `med_proposal`
- `experiment_objective`

# Instructions

1. Propose one probability model per simulated behavior that needs a temporal assumption.
2. Tie each proposal to observed metrics or explicit domain assumptions.
3. Separate measured evidence from heuristic choices.
4. Express confidence and unresolved uncertainty for each model.
5. Return only structured JSON compatible with the output schema.

# Output Requirements

- Every model must reference at least one metric from the retrieval evidence.
- Every heuristic parameter must be labeled as heuristic.
- Do not produce simulation payloads in this step.
