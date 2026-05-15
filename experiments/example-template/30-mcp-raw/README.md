Raw MCP capture files.

- `30-etherscan-mcp-capture.json`: contract-side raw capture
- `31-dune-mcp-capture.json`: analytics-side raw capture
- `32-simulation-mcp-capture.json`: optional simulation MCP notes or capture
- `39-raw-mcp-retrieval.json`: assembled raw bundle

Use:

```bash
npm run prepare:raw-captures -- experiments/<experiment-id>
```

to scaffold the `30`, `31`, and `32` capture files from the retrieval request before populating them with MCP results.
