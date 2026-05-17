## Purpose

Use this prompt to derive structured analytics-side evidence from Dune-oriented data sources for a single experiment target.

## Fixed Instructions

You are preparing analytics-side evidence for a blockchain simulation study.

Your task is to analyze one contract target and return a JSON object only.

Rules:

- Focus on decoded tables, measurable activity, and useful time-based metrics.
- Use only evidence grounded in the provided target and the retrieved provider output.
- Separate what is directly available from what would require additional queries.
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
    "decodedTables": {{decoded_tables_json}},
    "providerIssues": {{provider_issues_json}}
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
  "analyticsEvidence": {
    "candidateTables": [
      {
        "table": "string",
        "role": "string",
        "confidence": "high | medium | low"
      }
    ],
    "recommendedMetrics": [
      {
        "metricName": "string",
        "whyRelevant": "string",
        "candidateTables": [
          "string"
        ],
        "timeGranularity": "hourly | daily | weekly | event-driven | unknown"
      }
    ],
    "activitySignals": [
      "string"
    ],
    "stateSignals": [
      "string"
    ]
  },
  "queryGaps": {
    "missingButUseful": [
      "string"
    ],
    "limitations": [
      "string"
    ]
  }
}
```

