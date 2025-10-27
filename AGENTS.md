# Swarm Guide (Minimal)

Mandatory reading: `swarm/SKILL.md` (install, flags, usage, patterns, extending the CLI).

Quick links
- Quick Start: see `README.md`.
- CLI: `swarm/scripts/swarm-cli` (uv assumed installed).
- Codespaces: `.devcontainer/` sets env defaults and installs tools; edit and rebuild as needed.

Contributing
- Add subcommands under `swarm/scripts/cmd_*.py` and register them in
  `swarm/scripts/__main__.py`. File-level docstrings are optional guidance – SKILL.md is the
  canonical reference.
