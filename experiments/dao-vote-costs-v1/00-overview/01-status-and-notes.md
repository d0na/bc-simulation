## Status And Notes

Current workflow order:

1. author retrieval and rule inputs
2. render MCP prompts
3. collect raw MCP captures
4. assemble and normalize evidence
5. generate MED and probability proposals
6. review and approve proposed abstractions
7. generate simulation input
8. validate and launch

Human gate:

- no simulation should be treated as valid until `60-human-review/60-review-decision.json` approves the generated proposals

Entry points:

- root descriptor: `experiment.json`
- human-authored inputs: `10-human-input/`
- generated execution payload: `70-execution/70-simulation-input.json`
