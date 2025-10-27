# Swarm

Swarm is an agent-first, script-driven skills pack for Codex automation. It favors
deterministic CLIs over servers so both humans and AI teammates can operate
reliably with clear, parseable outputs.

> This repo previously exposed API/CLI/Web under the name “Flock”. We have migrated to
> Swarm (scripts-first) and removed the legacy API/CLI/Web.

## Why Swarm?

- Scripts-first design: predictable, non-interactive commands with stable JSON output.
- Easy adoption: copy `swarm/` into any repo.
- Low friction: copy a folder, symlink one file; no server or packaging.
- Human-friendly: readable logs, simple CLI flags, minimal dependencies.

## Quick Start

1. Copy `swarm/` into your repo (or use it in-place).
2. Symlink the CLI into your PATH (uv assumed installed):

   chmod +x swarm/scripts/swarm-cli
   mkdir -p ~/.local/bin
   ln -sfn "$(pwd)/swarm/scripts/swarm-cli" ~/.local/bin/swarm-cli

3. Explore the CLI:

   - `swarm-cli --help` (e.g., `swarm-cli echo hello`)

Codespaces (optional):
- This repo provides `.devcontainer/devcontainer.json` which sets env defaults
  (SWARM_HOME, SWARM_WORKTREE_ROOT, SWARM_TASKS_DIR), installs `uv`, and
  symlinks `swarm-cli` automatically on create/rebuild via
  `.devcontainer/post-create.sh`.
- To change defaults, edit `.devcontainer/devcontainer.json` and/or
  `.devcontainer/post-create.sh`, then rebuild the container.

## Operating Tips

**AI agents**

- Prefer the provided CLIs over bespoke sequences.
- Keep outputs deterministic and concise; print diagnostics to stderr.

**Humans**

- Use the small uv+Python CLI under `swarm/scripts`.
- Prefer `--output-format jsonl` for machine chaining (e.g., with jq) when needed.

## Documentation Guide

- `AGENTS.md` – onboarding and collaboration guide.
- `swarm/SKILL.md` – how to install and use the Swarm CLI.

Ready to help? Start in `AGENTS.md`, then keep iterating—using Swarm to build Swarm. 🚀
