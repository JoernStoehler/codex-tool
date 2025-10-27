#!/usr/bin/env bash
set -euo pipefail

echo "[post-create] Setting up Swarm dev environment"

sudo apt-get update -y
sudo apt-get install -y jq tmux >/dev/null

if ! command -v uv >/dev/null 2>&1; then
  echo "[post-create] Installing uv"
  curl -fsSL https://astral.sh/uv/install.sh | sh
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "[post-create] Installing codex"
  npm install -g @openai/codex
fi

# Ensure ~/.local/bin is on PATH for interactive shells
if ! grep -q "~/.local/bin" "$HOME/.bashrc" 2>/dev/null; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
fi

# Link swarm CLI
chmod +x "$PWD/swarm/scripts/swarm-cli" || true
mkdir -p "$HOME/.local/bin"
ln -sfn "$PWD/swarm/scripts/swarm-cli" "$HOME/.local/bin/swarm-cli"

echo "[post-create] Done"

