# SESAME

<p align="left">
  <img src="Sesame-ico.png" alt="SESAME logo" width="140" />
</p>

SESAME is the root product repository for configuring, running, and analyzing blockchain-oriented simulation scenarios.

- The backend is a Spring Boot service that executes simulations, stores generated CSV metadata, and exposes chart and result endpoints.
- The frontend is a React + TypeScript application used to configure scenarios, inspect generated data, and build charts.
- The MCP server is a dedicated Spring-based service that exposes backend capabilities through the Model Context Protocol.

The default backend port is `8099`.
The default frontend dev server is Vite on `5173`.

## Project Structure

- `apps/web`: React frontend
- `apps/api`: Spring Boot backend
- `mcp-server`: MCP server
- `legacy/api`: archived pre-current backend material
- `artifacts/final-results`: curated output files and reference assets kept in the repository

The repository root is intentionally named `sesame`. The active application folders now live under `apps/`, while legacy material remains outside that area until it is retired.

## Usage

### Prerequisites

- Java 17+
- Node.js 20+ and npm

### Install the frontend dependencies

From the repository root:

```bash
npm run install:web
```

### Start the main application

From the repository root:

```bash
npm run dev
```

This starts:
- `apps/api` on `http://localhost:8099`
- `apps/web` on the default Vite port, typically `http://localhost:5173`

The frontend connects to the backend on port `8099`.

### Start all services, including MCP

From the repository root:

```bash
npm run dev:all
```

This starts:
- `apps/api`
- `apps/web`
- `mcp-server`

### Start services individually

Backend, from [apps/api](/Users/francesco/workspace/git/PHD/sesame/apps/api):

```bash
./mvnw spring-boot:run
```

Frontend, from [apps/web](/Users/francesco/workspace/git/PHD/sesame/apps/web):

```bash
npm run dev
```

MCP, from [mcp-server](/Users/francesco/workspace/git/PHD/sesame/mcp-server):

```bash
./mvnw spring-boot:run
```

### Typical workflow

1. Open the frontend and create or import a simulation configuration.
2. Submit the scenario to the backend through the simulation form.
3. Inspect generated CSV files and chart previews from the UI.
4. Export or reuse selected outputs for analysis.

### Example simulation source

If you want to start from one of the latest scenarios already stored in the repository, a good example is:

- `examples/simulations/dao/4.DAO-2PeakUsers-and-Proposal.json`

This configuration dates back to July 5, 2025 and is one of the newest examples available in the repository. You can load it manually from the repository, adapt its parameters, and submit it through the simulation UI or backend flow.

### Stored outputs

- Runtime simulation outputs may be generated locally by the backend during execution.
- The historical output archive currently tracked in the repository is stored in [artifacts/final-results/output-archive](/Users/francesco/workspace/git/PHD/sesame/artifacts/final-results/output-archive).
- Curated assets and hand-picked examples are stored in [artifacts/final-results](/Users/francesco/workspace/git/PHD/sesame/artifacts/final-results).

## Development

### Main technologies

- Backend: Spring Boot, Spring Batch, Spring Data JPA, H2
- Frontend: React, TypeScript, Vite, MUI, Recharts, Chart.js
- MCP: Spring Boot, Spring AI MCP Server, OpenFeign

### Important backend notes

- Main entry point: [BCSimulatorApplication.java](/Users/francesco/workspace/git/PHD/sesame/apps/api/src/main/java/com/bcsimulator/BCSimulatorApplication.java)
- Main simulation endpoint: `POST /newsimulation`
- Chart endpoints are exposed under `/results/charts`
- CSV result endpoints are exposed under `/results/csv`
- DAO archive plotting script: [dao-archive-plot.sh](/Users/francesco/workspace/git/PHD/sesame/apps/api/dao-archive-plot.sh)
- Example simulation JSON files are stored under [examples/simulations](/Users/francesco/workspace/git/PHD/sesame/examples/simulations)

### Important frontend notes

- The frontend currently uses direct calls to `http://localhost:8099`
- Production build is validated with `npm run build`

### Validation commands

From the repository root:

```bash
npm run test:api
npm run build:api
npm run build:web
npm run test:mcp
npm run build:mcp
```

Or individually:

```bash
cd apps/api && ./mvnw test
cd apps/api && ./mvnw -DskipTests package
cd apps/web && npm run build
cd mcp-server && ./mvnw test
cd mcp-server && ./mvnw -DskipTests package
```

### Repository hygiene

- Keep local IDE files, temporary folders, and generated runtime outputs out of commits.
- Put only curated, final, or publication-relevant assets in `artifacts/final-results`.
- Prefer small, reviewable commits over large mixed changes.
