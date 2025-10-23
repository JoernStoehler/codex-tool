# Flock Specification (Development)

This document tracks the in-flight contract for the Flock platform — CLI, API, and
supporting automation. It reflects the behavior on the current branch. When a release is
cut, its contents should be copied to `flock-stable.md`.

## 1. Scope

- CLI binary (`flock`) and workspace-local entrypoint (`npm run cli --workspaces=false -- …`).
- Fastify API surface exposed by `api/` workspace.
- Shared orchestration primitives (git worktrees, locking, scripts).
- Observability hooks (logs, events) once implemented.

## 2. CLI Contract

### 2.1 Invocation modes

| Mode | Command | Purpose |
|------|---------|---------|
| Global stable | `flock …` | Runs the globally linked/published binary. Mirrors `flock-stable.md`. |
| Local live | `npm run cli --workspaces=false -- …` | Executes current worktree source via `tsx`. Use for feature work. |
| Local built | `node cli/dist/index.js …` | Executes latest tsup build under `cli/dist`. Use when testing bundled output. |

All commands must be non-interactive, block until completion, and exit with POSIX codes
(0 success, >0 failure). Long-running dev servers (`flock api dev`, `flock web dev`) honor
SIGINT/SIGTERM and exit cleanly.

### 2.2 Output modes

- Default: human-readable text with concise summaries and optional follow-up suggestions.
- JSON: `--output json` flag returns machine-friendly payloads with stable field names.
- Markdown: `--output md` for rich text (mirrors JSON structure but rendered for humans).

Suggestions are emitted on stdout prefixed with `suggestion:`; JSON output includes a
`suggestions` array. Errors go to stderr with structured JSON when `--output json` is set.

### 2.3 Command families (planned)

| Verb | Subcommand | Description | Notes |
|------|------------|-------------|-------|
| Counter | `flock counter show` | Fetches the current counter value from the API. | Honors `--json`; base URL configurable via `FLOCK_API_URL` (default `http://127.0.0.1:3000`). |
| | `flock counter increment` | Increments the counter and prints the new value. | Blocking command; shares the same base URL rules. |
| Agent lifecycle (planned) | `flock agent create` | Creates thread + worktree from source branch. | Accepts `--id` or `--name`; see agent spec for constraints. |
| | `flock agent list` | Lists agents with status summary. | Supports `--output json`. |
| | `flock agent queue add` | Pushes prompt(s) onto queue. | Options: `--front`, `--file`. |
| | `flock agent pause/resume` | State transitions. | Idempotent. |
| | `flock agent interrupt` | Interrupts running turn. | Returns interrupt result + next steps. |
| | `flock agent delete` | Safe delete (idle/paused only). | Validates merged worktree. |
| Task management (planned) | `flock task create/edit/delete` | CRUD for lean kanban cards. | Maps to `/tasks` API. |
| | `flock task list/search/view` | Inspection utilities. | Support filters by status/dependency. |
| | `flock task assign/unassign` | Thread association. | Validates thread state. |
| | `flock task approve/reject` | Handles in-review tasks. | Triggers merge orchestration. |
| Queue operations (planned) | `flock queue show` | Inspect prompt queue for agent. | Returns queue entries + metadata. |
| | `flock queue move/delete` | Reorder or remove prompts. | Must maintain FIFO semantics otherwise. |
| Worktree ops (planned) | `flock worktree status` | Inspect git state for agent. | Aggregates `git status`, branch, upstream. |
| | `flock worktree sync` | Pull or rebase. | Non-interactive; fails on conflicts with suggestions. |

Detailed flag/parameter definitions are to be maintained inline per command once
implemented.

### 2.4 Suggestions & aliases

- Alias policy: accept common synonyms (`--new` for `--create`) but emit canonical name in
  output. Alias list lives beside each command in this spec.
- Suggestions: when a command error can be resolved by a follow-up command, append
  `suggestion: run "…"` to stdout (or `suggestions` array in JSON). Suggestions must be
  deterministic and safe to execute without additional context.

### 2.5 Script integration

- `scripts/run-workspace.sh <workspace> <script> [-- args…]`
  - Flags: `--help` prints usage, `--quiet` reduces logs (TBD).
  - Environment: inherits caller env; no prompts; uses repository root as working dir.
  - Exit codes: mirrors underlying npm script.
- CLI commands that delegate to npm scripts must log the invoked command, exit code, and
  duration.

### 2.6 Configuration

- `FLOCK_API_URL` (default `http://127.0.0.1:3000`) controls the base URL used by CLI
  commands when contacting the API.
- Implemented commands accept `--json` to emit machine-readable payloads.

## 3. API Contract

### 3.1 Versioning & routes

- Current development endpoints live at the root path; they will move under `/v1` once the
  API generalises beyond the counter demo.
- Implemented endpoints:
  - `GET /health` → `{ status, uptime, timestamp }`.
  - `GET /counter` → `{ value }`.
  - `POST /counter/increment` → `{ value }` (returns the incremented value).
  - `GET /counter/stream` → server-sent events emitting `{ value }` updates (initial value
    sent immediately upon connection).
- Planned endpoints (details in agent/kanban specs):
  - `/v1/agents` CRUD, queue operations, pause/resume, delete.
  - `/v1/tasks` CRUD, assignment, status transitions, dependencies.
  - `/v1/worktrees` for git operations (sync, status, cleanup).
  - `/v1/events` for SSE/WebSocket streaming of agent/task events.

### 3.2 Error model

- JSON envelope: `{ error: { code, message, details? } }` with HTTP status alignment.
- Deterministic error codes (e.g. `AGENT_NOT_FOUND`, `WORKTREE_DIRTY`).
- All validation errors should be machine-parseable to allow agents to branch logic.

### 3.3 Authentication & authz

- Flock currently relies on perimeter enforcement. Run the API and web surfaces behind
  trusted network boundaries (localhost-only, private VPC, or zero-trust tunnel such as
  Cloudflare Access). No built-in authentication layer ships with the API today.
- If deployment requires fine-grained auth, terminate upstream and forward authenticated
  requests only from the trusted proxy.

### 3.4 Locking semantics

- The API serialises state mutations through a process-local lock implementation. All
  agent/task operations run inside a single mutex (or, when refined, per-agent locks)
  within the Fastify process; this avoids concurrency hazards in the underlying datastore
  (initially SQLite/file-based).
- No cross-process or distributed locking is provided. If the API crashes or restarts, all
  locks are implicitly released. Given all operations are expected to complete in <1 s,
  this is sufficient for the current architecture.

### 3.5 Streaming

- `/counter/stream` follows the SSE specification. Clients receive UTF-8 encoded
  `data: {"value": <number> }` frames.
- The server emits the current counter value immediately upon connection and whenever an
  increment occurs.
- Reconnection strategy is handled client-side (browser EventSource auto-retry is
  sufficient for the demo).

## 4. Git & Worktree Strategy

- Feature agents: one agent ↔ one git worktree, created from source branch (default `main`).
- Main agents: share `main` branch directory; operations must guard against collisions via
  locking and by “thrashing” (reset/checkout) instead of deletion.
- Safe delete requires:
  1. Agent state = idle or paused.
  2. Worktree clean (no uncommitted changes).
  3. Worktree branch fully merged into source branch (fast-forward or merge commit per
     policy).
  4. Lock held for the agent during deletion.

## 5. Observability (planned)

- Logging: Pino structured logs with request IDs; CLI consumes to display concise info.
- Metrics: counters for agent state transitions, queue length, task status changes.
- Events: SSE/WebSocket stream with replay window and heartbeats (spec TBD).

## 6. Release process

- Releases follow Semantic Versioning measured against the CLI and web user experience:
  bump `MAJOR` for breaking changes to those surfaces, `MINOR` for backwards-compatible
  feature drops, and `PATCH` for compatible fixes or polish.
- Development spec (`flock.md`) tracks current branch.
- Use `npm run release <version>` to verify a clean `main` branch, run lint/tests/build,
  sync `flock-stable.md`, and create an annotated tag (`v<version>`).
- After the script completes, push the branch and tag, publish packages (npm, containers),
  and update release notes / roadmap entries.
- Maintain changelog entries in `docs/roadmap.md` or a dedicated changelog file (TBD).

## 7. Open questions / TODOs

- Finalize lock backend and include implementation details.
- Decide on authentication scheme and document token management.
- Flesh out JSON schemas for each CLI command/API response.
- Provide concrete examples (command transcripts, curl snippets) once endpoints land.
