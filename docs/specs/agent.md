# Agent & Thread Specification

This document describes the lifecycle, states, and behaviors of agents, threads, worktrees,
and prompt queues. It supplements `flock.md` with deeper operational rules.

## 1. Terminology

- **Agent** – Autonomous worker (human or Codex) identified by `<4 hex>-<slug>`
  (e.g. `47fa-font-replacement`).
- **Thread** – Sequence of turns for an agent; each turn has a prompt, items, and final
  message. Threads map 1:1 with agents in Flock.
- **Worktree** – Git worktree tied to an agent/thread; contains working directory and
  branch.
- **Prompt queue** – FIFO queue of prompts awaiting execution when the agent is idle.
- **Turn** – A single execution cycle: prompt delivery → agent actions (items) → final
  message.

## 2. State Model

### 2.1 Agent states

| State | Description | Allowed transitions | Notes |
|-------|-------------|---------------------|-------|
| `idle` | No active turn; prompt queue may start a new turn automatically. | → `running`, `paused`, `deleted` | Default state after creation. |
| `running` | Turn in progress; agent producing items. | → `idle` (natural completion), `paused` (after interrupt), `deleted` (disallowed) | Interrupt required to exit early. |
| `paused` | Prompt queue suspended; no turns start automatically. | → `idle` (resume), `running` (disallowed; use queue mutation and resume), `deleted` | Queue mutations allowed. |
| `deleted` | Worktree removed; agent retained for audit. | — | Terminal state. |

Transitions must acquire the per-agent lock. Illegal transitions result in
`AGENT_INVALID_STATE` errors.

### 2.2 Turn lifecycle

1. **Start**: Prompt delivered (from queue or manual). Agent enters `running`.
2. **Item emission**: Each item is appended atomically to the thread log. Handled by Codex SDK.
3. **Completion**:
   - **Normal**: Agent emits final message → state returns to `idle`.
   - **Interrupt**: Server records an `interrupt` item, stops execution, transitions to
     `paused` and flags the turn as incomplete. Items emitted prior to interrupt remain; partially executed commands may or may not finish and may or may not be recorded as an item, this is undefined behavior of Codex SDK.

### 2.3 Prompt queue semantics

- FIFO, except for mutations.
- Queue operations allowed in any non-deleted state.
- When agent transitions to `idle` and queue non-empty, server automatically starts next turn.
- Queue entries are immutable payloads (text + metadata) with uuid handles.
- Queue operations must acquire the per-agent lock.

## 3. Worktree ownership

- Feature agents: `git worktree add <path> <sourceBranch>` when created. Branch naming convention: `flock/<agentId>`.
- Main agents: operate directly inside main repository directory; Worktree deletion is DISALLOWED; deletion only changes agent status.
- Safe delete checks (see `flock.md`): state is idle/paused, clean working tree, merged branch. Allows a --force override to ignore merge and working tree state. Running agents CANNOT be deleted.
- Deletion triggers `git worktree remove` and `git branch -D`. Except on main.

## 4. Locking

- Lock scope: a process-local mutex protects all state-mutating operations. We want to avoid the following edge cases:
  - simultaneous conflicting operations on an agent's status and queue
  - simultaneous conflicting operations on the kanban board
- Deadlock prevention: we run a single API process and rely on one mutex per agent/board.
- Performance:
  - API commands are short (millisecond scale), so the lock is not a bottleneck.
  - Stream endpoints push updates from atomic operations and only take the lock when
    establishing a stream.
  - Web and CLI traffic is low-throughput, keeping contention minimal.
- Crash behavior: locks do not persist across API restarts.

## 5. Audit & persistence

- We store for each agent:
  - `agentId`: unique random 4 hex, plus slug
  - `threadId`: from Codex SDK, null until first thread creation
  - `workingDirectory`: git worktree folder
  - `workingBranch`: branch name of the git worktree
  - `status`: `idle | paused | running | deleted` ; note: running -> paused on server start after an unexpected stop where threads weren't interrupted properly
- Codex SDK stores for each thread:
  - `threadId`
  - a list of turns, each turn made from prompt, items, and a final message if completed normally or a final error if interrupted or crashed
- We store the kanban board's tasks:
  - `taskId`: unique random 4 hex, plus slugified title
  - `title`: string
  - `description`: string
  - `assignedTo`: null | agentId
  - `dependsOn`: taskId[]
  - `status`: `todo | in-progress | in-review | done | deleted`
- The server logs to a log file, which we can audit
- We use a simple database for agents + kanban board
- We trust that Codex CLI / SDK are configured for persistent storage

## 6. Commit linkage

- During a turn, agents must commit changes before final message if they intend those
  changes to be merged. CLI will provide helpers (`flock agent commit --message …`).
- `flock task approve` reads the latest commit on the agent branch. If no commit exists,
  approval fails with `AGENT_NO_COMMIT`.
- Final message captures summary and optionally references commit SHA; CLI auto-injects
  commit hash into final message metadata when using helper commands.

## 7. Interrupts & waiting

- Interrupts are explicit operations (`flock agent interrupt` or API). They:
  1. Abort the running turn, and the running command in the turn
  2. Transition agent to `paused`.
- Wait operations (`flock wait …`) expect `--timeout <seconds>`; on timeout, the CLI
  prints a warning and returns control to the caller. Interrupting during wait aborts the
  entire turn, as with any command.

## 8. Error and output handling

- Codex SDK handles command errors and outputs without terminating the turn
- Our CLI prints error messages that are focused on delivering information to the agent so they can adjust their usage.
- We use common formats and forward well-known output or error messages, e.g. we don't paraphrase git error messages but only add our own error messages before or after
- We don't overwhelm with information by default, and additionally support common output control (--quiet, --verbose, --filter, --fields, ...) depending on the operation.

## 9. Open decisions

- Persistence backend (SQL vs document store) for agent registry and thread logs.
- Policy for automatic branch deletion post-merge (retain vs remove).

This specification should evolve alongside implementation changes; ensure `flock.md` links back to the sections above when describing CLI/API behavior.
