# Swarm Skill Pack

Swarm is an agent-first, uv+Python CLI you can copy into any repo.
It replaces servers with deterministic commands that agents can run
non-interactively. Keep commands minimal and stable.

## Install

1. Copy the `swarm/` folder into your repository.
2. Symlink the CLI into your PATH:

   chmod +x swarm/scripts/swarm-cli
   mkdir -p ~/.local/bin
   ln -sfn "$(pwd)/swarm/scripts/swarm-cli" ~/.local/bin/swarm-cli
   # Alternatively run without symlink:
   uv run swarm/scripts/swarm-cli -- --help

## Environment

Common env vars you may adopt later:
- `SWARM_HOME` default: `~/.config/swarm`
- `SWARM_WORKTREE_ROOT` default: `/var/tmp/swarm/worktrees`
- `SWARM_TASKS_DIR` optional path to a shared tasks folder (symlink into worktrees)

## Commands

CLI entrypoint:
- `swarm/scripts/swarm-cli` (uv PEP-723 script launcher)
  - `swarm-cli --help`
  - Example placeholders:
    - `swarm-cli echo "some text"`
    - `swarm-cli hello --output-format jsonl | jq -c .`

## Patterns

Deterministic, non-interactive CLI; exit non-zero on failure. Keep stdout stable; print
diagnostics to stderr.

Standard flags (every command):
- `--quiet` (minimize diagnostics)
- `--verbose` (diagnostics; mutually exclusive with `--quiet`)
- `--output-format text|jsonl` (default `text`)

## Tasks helpers (merged from Kanban)

Tasks are Markdown files with YAML frontmatter in a shared folder (e.g., `tasks/`),
symlinked into each worktree so agents can read/write them directly. Swarm will offer
helper subcommands (e.g., `tasks list`, `tasks view`) to filter/sort by frontmatter. Until
then, treat tasks as regular files and use standard tools.

## Extend

Add new subcommands in `swarm/scripts/__main__.py` or `cmd_*.py` files and register them
explicitly in the parser.
