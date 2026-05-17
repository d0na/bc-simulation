# `orchestrator`

Minimal Node orchestrator for the lean `example-nft` workflow.

Current scope:

- read `experiments/<experimentId>/01-brief.json`
- retrieve contract evidence from Etherscan
- retrieve decoded table discovery from Dune
- write `experiments/<experimentId>/02-retrieval.json`
- derive a first deterministic MED proposal
- write `experiments/<experimentId>/03-meds.json`
- derive a first deterministic simulation draft
- write `experiments/<experimentId>/04-simulation-draft.json`
- initialize a human review gate
- write `experiments/<experimentId>/05-review.json`

Required environment variables:

- `DUNE_API_KEY`
- `ETHERSCAN_API_KEY`

Optional:

- `ORCHESTRATOR_PORT` default `8090`
- `ORCHESTRATOR_HOST` default `127.0.0.1`
- `SESAME_API_BASE_URL` default `http://localhost:8099`

Start locally:

```bash
cd orchestrator
npm run start
```

Health check:

```bash
curl http://127.0.0.1:8090/health
```

Run the full prepare flow:

```bash
curl -X POST http://127.0.0.1:8090/studies/prepare \
  -H "Content-Type: application/json" \
  -d '{"experimentId":"example-nft"}'
```

Before launch, edit `experiments/example-nft/05-review.json` and set:

- `decision` to `confirm`
- `readyForLaunch` to `true`

Generate only retrieval:

```bash
curl -X POST http://127.0.0.1:8090/studies/retrieve \
  -H "Content-Type: application/json" \
  -d '{"experimentId":"example-nft"}'
```

Generate MED proposal:

```bash
curl -X POST http://127.0.0.1:8090/studies/meds \
  -H "Content-Type: application/json" \
  -d '{"experimentId":"example-nft"}'
```

Generate simulation draft:

```bash
curl -X POST http://127.0.0.1:8090/studies/simulation-draft \
  -H "Content-Type: application/json" \
  -d '{"experimentId":"example-nft"}'
```

Generate only review template:

```bash
curl -X POST http://127.0.0.1:8090/studies/review-template \
  -H "Content-Type: application/json" \
  -d '{"experimentId":"example-nft"}'
```

Launch after confirmed review:

```bash
curl -X POST http://127.0.0.1:8090/studies/launch \
  -H "Content-Type: application/json" \
  -d '{"experimentId":"example-nft"}'
```
