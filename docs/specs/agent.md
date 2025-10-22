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
| `paused` | Prompt queue suspended; no turns start automatically. | → `idle` (resume), `running` (manual turn), `deleted` | Queue mutations allowed. |
| `deleted` | Worktree removed; agent retained for audit. | — | Terminal state. |

Transitions must acquire the per-agent lock. Illegal transitions result in
`AGENT_INVALID_STATE` errors.

### 2.2 Turn lifecycle

1. **Start**: Prompt delivered (from queue or manual). Agent enters `running`.
2. **Item emission**: Each item is appended atomically to the thread log. Persistence
   must guarantee no partial writes (use journaling or transactional storage).
3. **Completion**:
   - **Normal**: Agent emits final message → state returns to `idle` (or `paused` if queue
     empty and previously paused).
   - **Interrupt**: Server records an `interrupt` item, stops execution, transitions to
     `paused` (default) and flags the turn as incomplete. Items emitted prior to interrupt
     remain; partially executing command outputs are truncated but preserved up to the
     last flush.

### 2.3 Prompt queue semantics

- FIFO by default; commands may insert at front (`--front`).
- Queue operations allowed in any non-deleted state.
- When agent transitions to `idle` and queue non-empty and agent not paused, server
  automatically starts next turn.
- Queue entries are immutable payloads (text + metadata). Editing replaces the payload and
  records audit metadata.

## 3. Worktree ownership

- Feature agents: `git worktree add <path> <sourceBranch>` when created. Branch naming
  convention: `<agentId>` or `<sourceBranch>--<agentId>` (TBD, define in CLI spec).
- Main agents: operate directly inside main repository directory; they must `git reset
  --hard origin/main` when “thrashed.” Worktree deletion is DISALLOWED; instead, commands
  clean working tree and release locks.
- Safe delete checks (see `flock.md`): state idle/paused, clean working tree, merged branch.
- Deletion triggers `git worktree remove` and optional branch deletion (`git branch -D`).

## 4. Locking

- Lock scope: a process-local mutex protects all state-mutating operations. Initially we
  serialize the entire critical section (one operation at a time); we may refine this to
  per-agent locks later.
- Lock acquisition: `create`, `queue add`, `pause`, `resume`, `delete`, worktree sync,
  task assignment, and approval flows run under the mutex.
- Deadlock prevention: because only one lock exists per process, operations never hold
  multiple locks simultaneously. Multi-agent operations execute sequentially inside the
  same critical section.
- Crash behavior: locks do not persist across API restarts. Upon process restart, all
  locks are considered released. This is acceptable because each operation is expected to
  complete in under one second.

## 5. Audit & persistence

- Agent registry stores: `agentId`, `slug`, `state`, `sourceBranch`, `worktreePath`,
  timestamps, `status` (including `deleted`), and reason metadata (who created, paused,
  deleted).
- Thread log persists items with monotonic sequence numbers; final message references the
  associated commit hash (see §6).
- Deletion retains registry entry with `deletedAt` timestamp and optional `deletedBy`.

## 6. Commit linkage

- During a turn, agents must commit changes before final message if they intend those
  changes to be merged. CLI will provide helpers (`flock agent commit --message …`).
- `flock task approve` reads the latest commit on the agent branch. If no commit exists,
  approval fails with `AGENT_NO_COMMIT`.
- Final message captures summary and optionally references commit SHA; CLI auto-injects
  commit hash into final message metadata when using helper commands.

## 7. Interrupts & waiting

- Interrupts are explicit operations (`flock agent interrupt` or API). They:
  1. Append `interrupt` item with reason.
  2. Soft-abort running command (SIGINT) with timeout fallback (SIGTERM).
  3. Transition agent to `paused` unless `--resume` flag provided.
- Wait operations (`flock wait …`) must accept `--timeout <seconds>`; on timeout, agent
  receives a `timeout` item and resumes control. Interrupting during wait aborts the entire
  turn.

## 8. Error handling

- Any failure that leaves the worktree dirty must be reported with actionable guidance
  (e.g., `git status` snippet, suggested cleanup command).
- Locks are released on error before returning response; if release fails, server emits
  alert and marks agent `paused` with `lockRecoveryRequired` flag.

## 9. Open decisions

- Persistence backend (SQL vs document store) for agent registry and thread logs.
- Policy for automatic branch deletion post-merge (retain vs remove).
- Metrics/telemetry events for state transitions.

This specification should evolve alongside implementation changes; ensure `flock.md` links
back to the sections above when describing CLI/API behavior.
