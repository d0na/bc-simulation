# Template Metadata

- `template_id`: `agent.generate-input-layer`
- `version`: `1.0.0`
- `output_files`: `11-med-aggregation-rules.json`, `12-probability-model-rules.json`, `13-simulation-blueprint.json`

# Purpose

Generate draft input layer files from the experiment objective and optional retrieval evidence.

This template is used programmatically by `scripts/generate-input-layer.js`.
The produced files are drafts and must be reviewed by a human before being used by the pipeline.

# Required Inputs

- `experiment_id`
- `objective` (from `experiment.json` or `00-overview/00-objective.md`)

# Optional Inputs

- `retrieval_evidence` (from `40-normalized-evidence/40-retrieval-evidence.json`)
  If present, use it to ground function names, event names, and metric names.
  If absent, generate conservative drafts based on the objective alone.

# Instructions

1. Identify the main behavioral units described in the objective. Each unit becomes one MED.
2. For each MED, propose the contract functions and events that represent it, and the metrics that measure it.
3. For each MED, propose a probability distribution that reflects the expected activity pattern.
4. For each MED, map it to a backend simulation event with the appropriate entity type and model reference.
5. Ensure consistency: every target_med in probability rules must match a med_id in the aggregation rules.
6. Ensure consistency: every model_id in the blueprint must match a model_id in the probability rules.
7. Mark uncertain parameters in heuristic_parameters.
8. Set confidence to low when no evidence is available.

# Output Requirements

- Three valid JSON files conforming to their respective schemas.
- snake_case identifiers throughout.
- At least one MED, one probability model, and one event template.
- Do not mark proposals as approved. Human approval is external to this step.
