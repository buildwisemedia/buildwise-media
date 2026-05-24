#!/usr/bin/env bash
# PROJ-BRAND-001 Triangulation pre-ship gate.
# Runs the legacy grep contract when available, then the current rendered-output
# brand closure scanner that includes dist HTML, shipped assets, JS, and comments.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LEGACY_GATE="${HOME}/buildwise-brain/tools/Pre-Ship-Grep-Gate.sh"

cd "$ROOT"

if [ -f "$LEGACY_GATE" ]; then
  bash "$LEGACY_GATE"
else
  echo "WARN: legacy Brain grep gate not found at $LEGACY_GATE"
fi

npm run qa:brand
