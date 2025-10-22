#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/release.sh <version>

Prepares a Flock release by ensuring the repository is ready, running checks,
copying the development spec to the stable snapshot, tagging the commit, and
building artifacts. Must be executed from the repository root.

Example:
  scripts/release.sh 0.1.0
USAGE
}

if [[ ${1:-} == "--help" || ${1:-} == "-h" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  echo "Error: version argument is required" >&2
  usage
  exit 1
fi

VERSION="$1"
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: version must be in MAJOR.MINOR.PATCH format" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: releases must be cut from the main branch (current: $CURRENT_BRANCH)" >&2
  exit 1
fi

if ! git diff --quiet --exit-code || ! git diff --cached --quiet --exit-code; then
  echo "Error: working tree must be clean before releasing" >&2
  exit 1
fi

TAG="v$VERSION"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Error: tag $TAG already exists" >&2
  exit 1
fi

echo "Running lint..."
npm run lint --workspaces

echo "Running tests..."
npm run test --workspaces

echo "Building packages..."
npm run build --workspaces

echo "Syncing specs (flock.md → flock-stable.md)..."
cp docs/specs/flock.md docs/specs/flock-stable.md

git add docs/specs/flock-stable.md
if git diff --cached --quiet --exit-code; then
  echo "No changes detected between specs/flock.md and specs/flock-stable.md"
else
  git commit -m "chore: prepare release $TAG"
fi

echo "Creating tag $TAG"
git tag -a "$TAG" -m "Release $TAG"

echo "Release preparation complete. Next steps:"
echo "  1. review the commit and push: git push origin main"
echo "  2. push the tag: git push origin $TAG"
echo "  3. publish artifacts (npm publish, container deploy, etc.)"
echo "  4. update changelog/roadmap entries if needed"
