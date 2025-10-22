# Scripts

This directory hosts reusable Bash utilities that encapsulate shell orchestration
so API handlers and CLI commands can stay focused on TypeScript logic.

- `run-workspace.sh` – lightweight wrapper around `npm run --workspace` that
  standardises how we invoke workspace scripts from other surfaces.

Keep scripts POSIX/Bash compatible and self-documenting via `--help` flags or
inline usage messages.
