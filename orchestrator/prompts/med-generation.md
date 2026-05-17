## Purpose

Use this prompt to transform retrieval evidence into a proposed MED decomposition for a single experiment.

## Fixed Instructions

You are preparing a modeling decomposition for a blockchain simulation study.

Your task is to propose MEDs from retrieval evidence and return a JSON object only.

Rules:

- Build MEDs from the experiment objective and the retrieved evidence.
- Do not force a fixed number of MEDs.
- Avoid duplicating the same behavior across multiple MEDs without justification.
- For each MED, separate direct support from inference.
- Mark each MED as supported, inferred, or exploratory.
- Include alternatives if the same evidence admits more than one reasonable decomposition.
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
  "etherscanEvidence": {{etherscan_evidence_json}},
  "duneEvidence": {{dune_evidence_json}}
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
  "meds": [
    {
      "medId": "string",
      "label": "string",
      "description": "string",
      "evidenceStatus": "supported | inferred | exploratory",
      "supportedByData": [
        "string"
      ],
      "inferredFromData": [
        "string"
      ],
      "assumptions": [
        "string"
      ],
      "whyUsefulForObjective": "string",
      "confidence": "high | medium | low"
    }
  ],
  "modelingAlternatives": [
    {
      "alternativeId": "string",
      "description": "string",
      "tradeoff": "string"
    }
  ],
  "openQuestions": [
    "string"
  ]
}
```

