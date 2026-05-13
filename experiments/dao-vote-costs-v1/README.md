# `dao-vote-costs-v1`

This experiment is organized by phase so that humans can distinguish:

- what is authored manually
- what is captured from MCP servers
- what is generated automatically
- what is reviewed by a human
- what is executed

## Phase Layout

- `00-overview/`: human-readable objective and operating notes
- `10-human-input/`: human-authored inputs, rules, and blueprint
- `20-rendered-prompts/`: rendered prompt payloads prepared for live MCP usage
- `30-mcp-raw/`: raw MCP captures and their assembled raw bundle
- `40-normalized-evidence/`: canonical normalized evidence
- `50-generated-proposals/`: generated MED and probability proposals
- `60-human-review/`: human review record and approved edit layer
- `70-execution/`: simulation input, run manifest, and validation output

The root `experiment.json` remains the entry point for all scripts.
