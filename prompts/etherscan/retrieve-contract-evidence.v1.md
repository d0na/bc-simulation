# Template Metadata

- `template_id`: `etherscan.retrieve-contract-evidence`
- `version`: `1.0.0`
- `output_schema`: `schemas/retrieval-evidence.schema.json`

# Purpose

Retrieve contract-level evidence from Etherscan-compatible sources for one target smart contract.

# Required Inputs

- `chain`
- `contract_address`
- `contract_label`

# Instructions

1. Retrieve the ABI or equivalent contract interface metadata.
2. Extract the externally relevant functions and emitted events that are meaningful for simulation.
3. Record gas or cost information when directly available from the source.
4. Do not invent costs, names, or missing functions.
5. Keep raw evidence and interpreted evidence separate.
6. Return only structured JSON compatible with the output schema.

# Output Requirements

- Include source provenance for every function or event entry.
- Mark uncertain values explicitly in `notes`.
- Do not propose MEDs or probability models in this step.
