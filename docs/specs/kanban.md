# Kanban Task System Specification

This document defines the lightweight task/backlog system coordinated through Flock. It
covers entities, state transitions, dependencies, and CLI/API interactions.

## 1. Entities

- **Task**
  - Fields: `id`, `title`, `description`, `status`, `assignee` (agent/thread id or null),
    `dependencies` (task ids), `labels`, `createdAt`, `updatedAt`, `createdBy`,
    `updatedBy`, `readyState`, `lastTurnId` (optional link to most recent agent turn),
    `metadata` (JSON for extensibility).
- **Dependency edge** – `(taskId, dependsOnTaskId)` recorded explicitly for cycle checks.
- **Event** – Logged for status changes, dependency modifications, approvals/rejections.

## 2. Status lifecycle

```
TODO → IN_PROGRESS → IN_REVIEW → DONE
   \__________
              ↘ REJECTED (optional) ↘
```

- `TODO` – Backlog item, ready when dependencies satisfied.
- `IN_PROGRESS` – Work underway. Entry triggers when agent starts a turn or user moves the
  card.
- `IN_REVIEW` – Awaiting approval. Entered automatically when a turn ends normally or when
  user sets explicitly.
- `DONE` – Completed. Requires explicit approval.
- `REJECTED` (optional) – Signals changes requested; optionally auto-moves to `TODO` after
  recording rejection reason.

### 2.1 Automatic transitions

- Turn start: Task linked to running thread auto-transitions `TODO|IN_REVIEW → IN_PROGRESS`.
- Turn completion (normal): Linked task transitions `IN_PROGRESS → IN_REVIEW` and captures
  final message summary + commit hash reference.
- Turn interrupted: Task remains in current state; interruption reason logged.

### 2.2 Manual overrides

- CLI/API allow explicit status changes with validation:
  - `IN_REVIEW → DONE` requires approval command.
  - `DONE → TODO` or `IN_REVIEW → TODO` allowed with reason.
  - Illegal transitions return `TASK_INVALID_STATUS`.

## 3. Dependencies & readiness

- DAG enforcement: creation/update rejects cycles.
- `readyState` computed as:
  - `blocked` if any dependency not `DONE`.
  - `ready` if all dependencies `DONE`.
  - `unknown` if dependency status unavailable (error).
- Blocking waits: `flock task wait --id <task> --condition ready --timeout 900` polls
  readiness; returns success, timeout, or error. Internally uses exponential backoff (TBD).

## 4. CLI/API mapping (planned)

| Operation | CLI | API |
|-----------|-----|-----|
| Create task | `flock task create --title … --description …` | `POST /v1/tasks` |
| Update task | `flock task edit --id … [--title …]` | `PATCH /v1/tasks/{id}` |
| Delete task | `flock task delete --id …` | `DELETE /v1/tasks/{id}` |
| List/search | `flock task list [--status … --assignee …]` | `GET /v1/tasks` (query params) |
| View details | `flock task view --id …` | `GET /v1/tasks/{id}` |
| Assign/unassign | `flock task assign --id … --agent …` | `POST /v1/tasks/{id}/assign` / `…/unassign` |
| Add dependency | `flock task dep add --id … --depends-on …` | `POST /v1/tasks/{id}/dependencies` |
| Remove dependency | `flock task dep remove --id … --depends-on …` | `DELETE /v1/tasks/{id}/dependencies/{depId}` |
| Wait for condition | `flock task wait --id … --condition ready --timeout …` | `POST /v1/tasks/{id}/wait` |
| Approve | `flock task approve --id … [--merge-strategy …]` | `POST /v1/tasks/{id}/approve` |
| Reject | `flock task reject --id … --reason …` | `POST /v1/tasks/{id}/reject` |

### 4.1 Approval workflow

1. Confirm agent branch is up to date and clean.
2. Optionally run pre-merge validation scripts (TBD). Server ensures per-task lock held.
3. Merge strategy: default fast-forward; fall back to merge commit with recorded commit
   message template. Conflicts result in failure and task remains `IN_REVIEW` with guidance.
4. On success, task transitions `IN_REVIEW → DONE`; event recorded with approver metadata.

## 5. Events & notifications

- Every status change, dependency modification, queue interaction publishes an event.
- Event payload: `{ type, taskId, timestamp, actor, data }`.
- Event stream delivered via SSE/WebSocket (see `flock.md`). Agents can watch for assigned
  task updates.

## 6. Data retention

- Keep history of status changes and dependency edits for audit.
- Soft-delete tasks (retain record with `deletedAt`).

## 7. Open questions

- Support subtasks / checklists? (TBD)
- Support task templates / cloning? (TBD)
- Integration with external trackers (Jira/GitHub) – out of scope for MVP.

This spec should evolve alongside implementation. Update `flock.md` when commands or
endpoints become available.
