# Flock Guide for Agents & Collaborators

This guide covers the essentials every human or Codex agent needs before contributing to
Flock. It intentionally stays lightweight—follow the linked specs when you need deeper
contracts or edge-case behavior.

## Prerequisites

- Node.js ≥ 22, npm ≥ 9.8
- Git CLI with access to the upstream repository
- Codex CLI/SDK installed and authenticated
- Linux shell with Bash (`#!/usr/bin/env bash`, `set -euo pipefail`)

## Repository Layout

- `api/` – Fastify API implementation (TypeScript, Vitest, tsup)
- `cli/` – oclif CLI and supporting libraries
- `web/` – React + Vite frontend
- `scripts/` – shared Bash helpers (deterministic, non-interactive)
- `docs/` – specifications, roadmap, ADRs, quickstarts
- Shared config at root: `tsconfig/`, `eslint.config.js`, `prettier.config.mjs`

## Daily Workflows

### Main branch (stable tooling)

1. `npm install`
2. Link the stable CLI once per machine: `npm run link:cli`
3. Launch surfaces as needed: `flock api dev`, `flock web dev`
4. Validate before merging: `npm run lint --workspaces`, `npm run test --workspaces`

### Feature worktree (in-development tooling)

1. `npm install`
2. Start watchers for whichever surfaces you touch:
   - `npm run dev:api`
   - `npm run dev:web`
   - `npm run dev:cli`
3. Run the current worktree CLI: `npm run cli --workspaces=false -- <command>`
   (or `node cli/dist/index.js <command>` after `npm run build --workspace cli`)
4. Re-run lint/tests before publishing changes
5. Capture new semantics or decisions in the relevant spec/ADR

> CLI/web surfaces talk to `http://127.0.0.1:3000` by default. Override with
> `FLOCK_API_URL` / `VITE_FLOCK_API_URL` if the API runs elsewhere.

### Scripts

All reusable Bash lives under `scripts/`. Use `scripts/run-workspace.sh <workspace> <script>
[-- args…]` instead of re-implementing npm plumbing. Scripts must be deterministic,
non-interactive, and emit clear diagnostics on failure.

## Canonical terminology

Flock reuses Codex vocabulary so humans and agents can speak the same language. The CLI,
API, and web UI use these exact terms.

- **agent** – autonomous worker (human or Codex) that performs turns via non-interactive
  commands.
- **thread** – the turn-by-turn transcript for an agent; each turn comprises prompt, items,
  and final message.
- **prompt** – message provided at the start of a turn.
- **final message** – closing response emitted by the agent.
- **item** – recorded action (reasoning trace, todo update, file edit, executed command).
- **working directory** – filesystem scope assigned when the thread is created.
- **thread id** – handle for resuming a thread.
- **running / idle / paused / deleted** – agent states described in the agent spec.
- **interrupt** – operation that stops a running turn (see agent spec for guarantees).

Key conventions:

- Feature agents own dedicated git worktrees/branches. Agents operating on `main` share the
  main worktree and “thrash” it between tasks.
- Prompt queues auto-start turns when agents are idle. Paused agents suppress queue
  execution until resumed.
- Agent IDs follow `<4 hex>-<slug>`; uniqueness and auditing are enforced server-side.
- All CLI commands are blocking, non-interactive, and emit machine-parseable output.
- Server-side locks guard agent/task operations to avoid race conditions.

Full lifecycle, locking, and commit rules live in
[`docs/specs/agent.md`](docs/specs/agent.md). Task/backlog behavior is covered in
[`docs/specs/kanban.md`](docs/specs/kanban.md).

## Design philosophy

- **CLI first** – every capability must be reachable without prompts. When the web app
  lacks a feature, humans can delegate to an agent running on `main`.
- **Deterministic automation** – scripts run with `set -euo pipefail`, avoid interactive
  tools, and emit structured logs.
- **Helpful defaults** – commands show clear success/error states, provide actionable
  suggestions, and keep JSON/Markdown output stable so agents can parse reliably.

## Reference material

- Platform contract (development): [`docs/specs/flock.md`](docs/specs/flock.md)
- Platform contract (stable release): [`docs/specs/flock-stable.md`](docs/specs/flock-stable.md)
- Agent lifecycle: [`docs/specs/agent.md`](docs/specs/agent.md)
- Kanban task system: [`docs/specs/kanban.md`](docs/specs/kanban.md)
- Roadmap & changelog: `docs/roadmap.md` (TBD)
- ADRs & deep dives: `docs/`

## Working as an AI agent

- Prefer CLI commands (`flock …` or `npm run cli --workspaces=false -- …`) or shared
  scripts; avoid bespoke command sequences when a wrapper exists.
- Surface blockers quickly with concise error output—humans monitor logs/PRs.
- Leave breadcrumbs: summarize actions taken, note outstanding TODOs, link relevant specs.

## Troubleshooting

- None yet. When you encounter a recurring issue, add the symptoms, diagnosis, and fix
  here.

## Contribution habits

- Keep commits focused; add rationale when not obvious.
- Reference backlog items/issues where available.
- Run lint/tests locally before requesting review.
- Update the appropriate spec or roadmap entry whenever behavior changes.
