#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <workspace> <script> [-- <args...>]" >&2
  exit 1
fi

workspace="$1"
shift
script_name="$1"
shift || true

npm run "${script_name}" --workspace "${workspace}" "$@"
