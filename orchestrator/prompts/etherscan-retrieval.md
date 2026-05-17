## Purpose

Use this prompt to derive structured contract evidence from Etherscan-oriented data sources for a single experiment target.

## Fixed Instructions

You are preparing contract-side evidence for a blockchain simulation study.

Your task is to analyze one contract and return a JSON object only.

Rules:

- Focus on contract structure and contract-relevant behavior.
- Use only evidence grounded in the provided contract target and the retrieved provider output.
- Distinguish clearly between direct evidence and interpretation.
- Do not optimize for brevity; optimize for traceability.
- Do not include markdown, prose outside JSON, or explanations before/after JSON.

## Input

```json
{
  "experiment": {
    "experimentId": "{{experiment_id}}",
    "objective": "{{objective}}",
    "questions": {{questions_json}}
  },
  "target": {
    "domain": "{{domain}}",
    "chain": "{{chain}}",
    "contractAddress": "{{contract_address}}",
    "contractLabel": "{{contract_label}}"
  },
  "providerEvidence": {
    "abiAvailable": {{abi_available}},
    "sourceCodeAvailable": {{source_code_available}},
    "rawAbiSummary": {{raw_abi_summary_json}},
    "rawSourceSummary": {{raw_source_summary_json}}
  }
}
```

## Output Schema

Return JSON with this shape:

```json
{
  "target": {
    "chain": "string",
    "contractAddress": "string",
    "contractLabel": "string"
  },
  "contractEvidence": {
    "writeFunctions": [
      {
        "name": "string",
        "whyRelevant": "string",
        "confidence": "high | medium | low"
      }
    ],
    "readFunctions": [
      {
        "name": "string",
        "whyRelevant": "string",
        "confidence": "high | medium | low"
      }
    ],
    "events": [
      {
        "name": "string",
        "whyRelevant": "string",
        "confidence": "high | medium | low"
      }
    ],
    "administrativeFunctions": [
      {
        "name": "string",
        "whyRelevant": "string",
        "confidence": "high | medium | low"
      }
    ]
  },
  "behavioralInterpretation": {
    "observedCapabilities": [
      "string"
    ],
    "inferredCapabilities": [
      "string"
    ],
    "uncertainties": [
      "string"
    ]
  },
  "providerStatus": {
    "abiAvailable": true,
    "sourceCodeAvailable": true,
    "limitations": [
      "string"
    ]
  }
}
```

