# SESAME

<p align="left">
  <img src="Sesame-ico.png" alt="SESAME logo" width="140" />
</p>

SESAME is the root product repository for configuring, running, and analyzing blockchain-oriented simulation scenarios.

- The backend is a Spring Boot service that executes simulations, stores generated CSV metadata, and exposes chart and result endpoints.
- The frontend is a React + TypeScript application used to configure scenarios, inspect generated data, and build charts.
- The MCP server is a dedicated Spring-based service that exposes backend capabilities through the Model Context Protocol.

The default backend port is `8099`.

## Project Structure

- `client`: React frontend
- `api/springBoot-simulator`: Spring Boot backend
- `mcp-server`: MCP server
- `artifacts/final-results`: curated output files and reference assets kept in the repository

The repository root is intentionally named `sesame`. Internal folders keep their current names for now to avoid unnecessary breakage while the project evolves.

## Usage

### Prerequisites

- Java 17+
- Node.js 20+ and npm

### Start the backend

From [api/springBoot-simulator](/Users/francesco/workspace/git/PHD/bc-simulation/api/springBoot-simulator):

```bash
./mvnw spring-boot:run
```

The service will be available at `http://localhost:8099`.

### Start the frontend

From [client](/Users/francesco/workspace/git/PHD/bc-simulation/client):

```bash
npm install
npm run dev
```

The frontend will connect to the backend on port `8099`.

### Start the MCP server

From [mcp-server](/Users/francesco/workspace/git/PHD/bc-simulation/mcp-server):

```bash
./mvnw spring-boot:run
```

Use this service only when you need MCP integration on top of the existing backend flow.

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
- The historical output archive currently tracked in the repository is stored in [artifacts/final-results/output-archive](/Users/francesco/workspace/git/PHD/bc-simulation/artifacts/final-results/output-archive).
- Curated assets and hand-picked examples are stored in [artifacts/final-results](/Users/francesco/workspace/git/PHD/bc-simulation/artifacts/final-results).

## Development

### Main technologies

- Backend: Spring Boot, Spring Batch, Spring Data JPA, H2
- Frontend: React, TypeScript, Vite, MUI, Recharts, Chart.js
- MCP: Spring Boot, Spring AI MCP Server, OpenFeign

### Important backend notes

- Main entry point: [BCSimulatorApplication.java](/Users/francesco/workspace/git/PHD/bc-simulation/api/springBoot-simulator/src/main/java/com/bcsimulator/BCSimulatorApplication.java)
- Main simulation endpoint: `POST /newsimulation`
- Chart endpoints are exposed under `/results/charts`
- CSV result endpoints are exposed under `/results/csv`
- DAO archive plotting script: [dao-archive-plot.sh](/Users/francesco/workspace/git/PHD/bc-simulation/api/springBoot-simulator/dao-archive-plot.sh)
- Example simulation JSON files are stored under [examples/simulations](/Users/francesco/workspace/git/PHD/bc-simulation/examples/simulations)

### Important frontend notes

- The frontend currently uses direct calls to `http://localhost:8099`
- Production build is validated with:

```bash
npm run build
```

### Validation commands

Backend:

```bash
./mvnw test
./mvnw -DskipTests package
```

Frontend:

```bash
npm run build
```

### Repository hygiene

- Keep local IDE files, temporary folders, and generated runtime outputs out of commits.
- Put only curated, final, or publication-relevant assets in `artifacts/final-results`.
- Prefer small, reviewable commits over large mixed changes.
