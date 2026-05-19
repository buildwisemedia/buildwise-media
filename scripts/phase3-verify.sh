#!/usr/bin/env bash
# Phase 3 QA Gate verification — PROJ-BWM-SEO-AEO-EXEC-001
# Run AFTER the Track B co-working session (GSC + Bing + GBP + Ahrefs setup)
# Three console-screenshot gates + one machine-verifiable smoke query
#
# Usage: ./scripts/phase3-verify.sh
# Exit 0 only when all gates pass.

set -euo pipefail

PASS=0
FAIL=0

check() {
  local label="$1"
  local status="$2"
  if [[ "$status" == "PASS" ]]; then
    echo "  PASS · $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL · $label"
    FAIL=$((FAIL + 1))
  fi
}

echo "Phase 3 QA Gate — PROJ-BWM-SEO-AEO-EXEC-001"
echo "================================================"
echo ""

echo "Gate 3a — Google Search Console sitemap status"
echo "  MANUAL: open https://search.google.com/search-console → Sitemaps"
echo "  Paste the status of buildwisemedia.com/sitemap.xml (expected: Success)"
read -r -p "  GSC sitemap status [Success/Other]: " gsc_status
[[ "$gsc_status" == "Success" ]] && check "GSC sitemap = Success" "PASS" || check "GSC sitemap = Success" "FAIL"
echo ""

echo "Gate 3b — Bing Webmaster sitemap status"
echo "  MANUAL: open https://www.bing.com/webmasters → Sitemaps"
echo "  Paste the status of buildwisemedia.com/sitemap.xml (expected: Success)"
read -r -p "  Bing sitemap status [Success/Other]: " bing_status
[[ "$bing_status" == "Success" ]] && check "Bing sitemap = Success" "PASS" || check "Bing sitemap = Success" "FAIL"
echo ""

echo "Gate 3c — GBP audit checklist 100% complete"
echo "  MANUAL: every Gap column in Brain clients/buildwise-media/GBP-Audit-Pre-2026-05.md = no"
read -r -p "  GBP audit all gaps closed [yes/no]: " gbp_status
[[ "$gbp_status" == "yes" ]] && check "GBP 100% complete" "PASS" || check "GBP 100% complete" "FAIL"
echo ""

echo "Gate 3d — Ahrefs DR baseline recorded"
echo "  MANUAL: Ahrefs DR for buildwisemedia.com noted in Project-BWM-SEO-AEO-Exec.md Notes"
read -r -p "  Ahrefs DR baseline recorded [yes/no]: " ahrefs_status
[[ "$ahrefs_status" == "yes" ]] && check "Ahrefs DR recorded" "PASS" || check "Ahrefs DR recorded" "FAIL"
echo ""

echo "Smoke — weekly digest fires with GSC data"
echo "  Querying operational_events for last 8 days of seo-metrics-weekly events..."
if [[ -z "${SUPABASE_DSN:-}" ]]; then
  echo "  SKIP · SUPABASE_DSN not set in env — run via bwm-self-digest /run-now and inspect Telegram instead"
else
  result=$(psql "$SUPABASE_DSN" -t -A -F'|' -c "SELECT count(*), max(occurred_at) FROM operational_events WHERE event_type='narrative' AND payload->>'kind'='seo-metrics-weekly' AND occurred_at > NOW() - INTERVAL '8 days'")
  count=$(echo "$result" | cut -d'|' -f1)
  latest=$(echo "$result" | cut -d'|' -f2)
  echo "  Found: $count event(s), latest=$latest"
  [[ "$count" -ge "1" ]] && check "Weekly digest event present" "PASS" || check "Weekly digest event present" "FAIL"
fi
echo ""

echo "================================================"
echo "Result: $PASS pass · $FAIL fail"
echo ""

if [[ "$FAIL" -eq "0" ]]; then
  echo "Phase 3 QA Gate GREEN. Next: emit build.shipped event + advance pointer to phase-4."
  exit 0
else
  echo "Phase 3 QA Gate RED. Address failing rows before advancing the pointer."
  exit 1
fi
