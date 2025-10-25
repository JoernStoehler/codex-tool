# Flock

Flock is a command center for high-agency Codex automation. It wraps the Codex SDK, git,
and day-to-day project management in a single toolkit that both humans and AI teammates
can operate. Spin up coordinated workstreams, spawn new agents, manage backlogs, and
surface status updates without stitching together ad-hoc shell pipelines every time.

> **We use Flock to build Flock.** Every surface is deterministic, non-interactive, and
> produces structured output so agents can operate safely alongside humans.

## Why Flock?

- Launch API, CLI, and web surfaces with one-liners (`flock api dev`, `flock web dev`, …).
- Standardize bash-first automation so workflows stay inspectable and replayable.
- Allow agents to spawn subtasks, branch repos, and merge results safely.
- Keep humans in the loop via live status streams, backlog views, and handoff prompts.
- Build atop familiar, stable tech (Fastify, oclif, Vite/React) for painless adoption.

## Quick Start

1. Ensure Node.js ≥ 22 and npm ≥ 9.8 are installed. The repository is optimized for GitHub
   Codespaces: a fresh Codespace already has the required toolchain and a globally linked
   `flock` binary.
2. Clone the repository (rename to `flock` once the GitHub repo is updated) or open it in
   Codespaces.
3. Run `npm install` in the repo root to hydrate all workspaces.
4. Start any surface:

   ```sh
   npm run dev:api   # Fastify API server
   npm run dev:web   # React/Vite console
   npm run dev:cli   # oclif CLI in watch mode
   ```

5. Validate with `npm run test --workspaces` and `npm run lint --workspaces`.

With the API running, try `flock counter show` and `flock counter increment` (or their
`npm run cli --workspaces=false -- counter …` equivalents) and watch the web console update
live via server-sent events.

When the CLI is published as `@flock/cli`, you can skip cloning and run:

```sh
npx flock api dev
npx flock web dev -- --host 0.0.0.0
```

The CLI simply dispatches to the same workspace scripts, making it safe for both
interactive users and automated agents.

## Operating Tips

**AI agents**

- Prefer the CLI façade (`flock …`) over bespoke shell sequences.
- Surface blocking errors immediately; the CLI is designed to bubble up actionable
  diagnostics for human reviewers.
- The API exposes typed schemas for automation—see `AGENTS.md` for contracts and entities.

**Humans**

- Lean on the CLI for quick routines, then open the web console for live coordination.
- Bash helpers live in `scripts/` and are intentionally simple; compose them for custom
  operations or CI workflows.
- Hand off work to agents by recording context in the backlog endpoints (documented in
  `AGENTS.md`).

## Documentation Guide

- `AGENTS.md` – unified onboarding for agents and collaborators plus key development flows.
- `docs/` – ADRs, runbooks, and deep dives as the platform evolves.

Ready to help? Start in `AGENTS.md`, then keep iterating—using Flock to build Flock. 🚀
