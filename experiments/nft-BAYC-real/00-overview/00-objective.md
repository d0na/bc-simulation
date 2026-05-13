## Objective

This experiment estimates the operational cost profile and usage dynamics of a representative static ERC-721 NFT collection, using Bored Ape Yacht Club (BAYC) as the case study.

The pipeline uses:

- Etherscan-derived contract functions, events, transaction counts, and gas-usage signals
- Dune-derived usage trends and temporal activity signals
- human-reviewed macro-event abstractions derived from ERC-721 operations
- human-reviewed probability modeling choices for minting, transfers, approvals, and marketplace/operator interactions
- a backend-compatible simulation payload derived only from approved and versioned artifacts

The experiment is intentionally staged so that each transition from on-chain evidence to simulation abstraction is auditable and reproducible.

