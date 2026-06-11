#!/usr/bin/env bash
# PROJ-BRAND-001 Triangulation pre-ship gate.
# Runs the legacy grep contract when available, then the current rendered-output
# brand closure scanner that includes dist HTML, shipped assets, JS, and comments.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Brain clone lives under ~/Documents (path repaired 2026-06-11, PROJ-DESIGN-INTEL-001 P1 —
# the old ~/buildwise-brain path never existed on this machine, so the Brain gate silently skipped).
LEGACY_GATE="${HOME}/Documents/buildwise-brain/tools/Pre-Ship-Grep-Gate.sh"

cd "$ROOT"

if [ -f "$LEGACY_GATE" ]; then
  bash "$LEGACY_GATE"
else
  echo "WARN: legacy Brain grep gate not found at $LEGACY_GATE"
fi

npm run qa:brand
