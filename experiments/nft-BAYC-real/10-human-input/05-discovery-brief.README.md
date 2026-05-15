# `05-discovery-brief.json`

This file is the single initial input brief for `nft-BAYC-real`.

It is consumed by the local tooling to generate:

- `10-retrieval-request.json`
- draft input-layer files in later steps

## Required fields

- `target_name`
  The target being studied.

- `target_type`
  The category used to orient retrieval and abstraction.

- `goal`
  The main experiment goal.

## Strongly recommended fields

- `questions`
  The concrete modeling questions to answer.

- `known_constraints`
  Scope limits and quality constraints.

- `analysis_window`
  Default trend-analysis window.

- `preferred_metrics`
  Metrics the system should prioritize when drafting retrieval.

## Optional fields

- `known_target.chain`
  Already known chain.

- `known_target.contract_address`
  Already known contract address.

- `known_target.contract_label`
  Friendly label for the target.

- `notes_for_ai`
  Helpful guidance that does not fit cleanly in the formal fields above.

## Current intent for BAYC

- start from a named ERC-721 collection
- constrain retrieval to Ethereum mainnet
- discover simulation-relevant NFT actions
- retrieve auditable market and usage metrics that can later support MED generation
