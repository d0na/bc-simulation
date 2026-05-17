# `example-template`

This directory is the clean starting point for a new reproducible experiment.

Copy it, rename it, and then populate it phase by phase as your experiment evolves.

Recommended workflow:

1. copy `experiments/example-template` into a new experiment directory
2. rename `experiment_id` and adjust the objective
3. fill `10-human-input/05-discovery-brief.json`
4. run the preparation scripts
5. populate MCP captures
6. generate downstream artifacts
7. review and approve before launch

Use this template when you want:

- a clean structure with no misleading domain-specific example data
- a single concise human input brief instead of scattered descriptive notes
- explicit placeholders instead of partially realistic mock values
- a stable directory layout aligned with the current tooling

The root `experiment.json` remains the entry point for all scripts.
