# Documentation

This directory hosts architecture decision records, specifications, runbooks, and
roadmaps. Start with the index below when you need deeper context.

## Specifications

- `specs/flock.md` – living specification for CLI + API behavior on the current branch.
- `specs/flock-stable.md` – frozen contract matching the globally linked `flock` CLI.
- `specs/agent.md` – agent/thread lifecycle, locking, prompt queues, and worktree rules.
- `specs/kanban.md` – lean kanban task system (status transitions, dependencies, approvals).

## Other docs

- `roadmap.md` (TBD) – milestones, release notes, and long-term plans.
- `quickstart.md` / `troubleshooting.md` (TBD) – add when recurring patterns emerge.
- ADRs – add files under `docs/adr/` (directory to be created as decisions accumulate).

When a specification changes, update `specs/flock.md` and—upon release—copy the relevant
sections into `specs/flock-stable.md`. Keep `AGENTS.md` focused on the essentials and link
back here for deeper context.
