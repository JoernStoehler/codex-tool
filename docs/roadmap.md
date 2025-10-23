# Flock Roadmap

This roadmap tracks near-term milestones and longer-term ambitions. Update the status and
add new workstreams as plans evolve. When a milestone ships, link the relevant PRs/issues
and tag the release in the “Delivery notes” column.

## Release cadence & versioning

- Flock uses Semantic Versioning (`MAJOR.MINOR.PATCH`) with compatibility measured from the
  perspective of end users of the CLI and web app.
- `MAJOR` increments signal breaking changes to user-facing behavior or contracts.
- `MINOR` increments deliver new end-user capabilities while keeping existing commands and
  flows intact.
- `PATCH` increments capture fixes, polish, or internal work that does not affect
  compatibility.

The release script (`npm run release`) assists with preparing tagged releases and copying
the development spec (`flock.md`) into the stable snapshot (`flock-stable.md`).

## Roadmap snapshot

| Status | Milestone | Description | Target release | Delivery notes |
|--------|-----------|-------------|----------------|----------------|
| 🚧 In progress | Agent lifecycle MVP | Implement agent CRUD, prompt queues, pause/resume, interrupts, safe delete, and Git worktree orchestration. | `0.1.0` |  |
| 🚧 In progress | Lean kanban board | Task CRUD, assignment, status transitions, dependencies, approvals, and “wait for ready” logic. | `0.1.0` |  |
| 🚧 In progress | Unified CLI surface | Ship the `flock` CLI with agent/task/worktree subcommands, JSON output, and suggestion UX. | `0.1.0` |  |
| 📝 Planned | Event streaming | SSE/WebSocket feeds for agent/task updates, including retry/backoff semantics. | `0.2.0` |  |
| 📝 Planned | Observability & metrics | Structured logs, metrics pipeline, and dashboards for long-running orchestrations. | `0.2.0` |  |
| 📝 Planned | Distribution pipeline | Automated release flow (npm publish, container images), provenance, and changelog automation. | `0.3.0` |  |

## Backlog / future ideas

- Messaging system for agents outside turn boundaries (mailbox auto-prompts).
- Integration with external issue trackers (GitHub/Jira) once the internal kanban is
  stable.
- Rich web dashboard for agent and task boards, including cross-thread analytics.
- Stateful analysis of agent performance, failure taxonomy, and automated recovery.

## Updating this roadmap

1. Add or adjust rows as priorities shift; keep the table sorted by delivery priority.
2. When a milestone ships, move it to the top, mark the status ✅, and fill “Delivery
   notes” with release tag and links.
3. If a milestone is dropped, note the decision and rationale.
4. Keep supporting specs (`docs/specs/*.md`) in sync with any contract changes described
   here.
