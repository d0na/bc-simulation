# Template Metadata

- `template_id`: `agent.propose-meds`
- `version`: `1.0.0`
- `output_schema`: `schemas/med-proposal.schema.json`

# Purpose

Propose Macro Event Descriptors from structured Etherscan and Dune evidence.

# Required Inputs

- `retrieval_evidence`
- `experiment_objective`

# Instructions

1. Group low-level functions and events into higher-level simulation abstractions.
2. Keep each MED narrow enough to remain interpretable.
3. For every MED, cite the source functions, events, and metrics that justify the aggregation.
4. Assign a representative cost only if the evidence supports it.
5. Return only structured JSON compatible with the output schema.

# Output Requirements

- Each MED must have a stable identifier.
- Each MED must include a rationale.
- Each MED must include provenance references back to the retrieval evidence.
- Do not mark the proposal as approved. Human approval is external to this step.
