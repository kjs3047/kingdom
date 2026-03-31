# Naratmal AI Kingdom System

Naratmal AI Kingdom is a local Vite/React plus TypeScript workspace for prototyping orchestration flows, control-plane UX, and operational guardrails.

## Current focus

The current frontend ships a first-pass dashboard MVP for a dynamic ontology-style workflow:

- workflow graph with typed nodes and semantic edges
- command flow queue and execution state
- agency roster with load and availability
- conversation log linking dialogue to workflow stages
- bottleneck and runtime health panels
- mock data contracts that can later be replaced by live server projections

The dashboard design spec lives in [docs-dashboard-mvp.md](./docs-dashboard-mvp.md).

## Run

```bash
npm install
npm run dev
npm run start:server
```

## Build

```bash
npm run build
```

## Windows server helpers

```bash
npm run server:start:detached
npm run server:status
npm run server:stop
```

## Kingdom CLI

```bash
npm run kingdom:respond -- --message "Prepare an investor dashboard update" --external
npm run kingdom:review -- --log-id <LOG_ID> --status approved --reason "Audit check passed"
npm run kingdom:bridge -- --message "Prepare an investor dashboard update" --sender "Founder"
```

## Project notes

- The dashboard UI is mock-data driven for now and lives under `src/dashboard/` and `src/components/`.
- Existing server and orchestration scripts remain available for future integration.
- The next step after this MVP is to derive the dashboard state from real execution logs and live review state instead of static fixtures.
