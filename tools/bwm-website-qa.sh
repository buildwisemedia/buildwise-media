#!/usr/bin/env bash
# PROJ-BRAND-001 Full Surface Closure QA wrapper.
# This repo-local gate intentionally supersedes the old Black Gold-era Brain
# website QA script for the BWM flagship. It uses the current Triangulation
# rendered-output scanner plus CDP visual QA against a running local/preview URL.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${1:-${BWM_QA_BASE_URL:-http://127.0.0.1:4322}}"

cd "$ROOT"

npm run qa:brand
if [ "${BWM_FULL_SURFACE_CLOSURE:-0}" = "1" ]; then
  export BWM_REQUIRE_MANUAL_VISUAL_ACCEPTANCE=1
fi
BWM_QA_BASE_URL="$BASE_URL" npm run qa:brand:visual

echo "BWM website QA passed for ${BASE_URL}"
