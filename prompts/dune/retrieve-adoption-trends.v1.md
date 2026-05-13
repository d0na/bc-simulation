# Template Metadata

- `template_id`: `dune.retrieve-adoption-trends`
- `version`: `1.0.0`
- `output_schema`: `schemas/retrieval-evidence.schema.json`

# Purpose

Retrieve trend evidence from Dune-compatible analytics for the same contract or protocol scope used in the experiment.

# Required Inputs

- `chain`
- `contract_address`
- `analysis_window`
- `target_metrics`

# Instructions

1. Retrieve aggregated metrics relevant to adoption and usage.
2. Prefer metrics that can support simulation assumptions such as volume, users, proposals, votes, or lifecycle activity.
3. Record the query identifier or a stable query description when available.
4. Describe observed trend shapes in a compact and auditable way.
5. Return only structured JSON compatible with the output schema.

# Output Requirements

- Every metric must include a name, granularity, and provenance.
- Every trend hint must be tied to an observed metric.
- Do not propose MEDs or simulation parameters in this step.
