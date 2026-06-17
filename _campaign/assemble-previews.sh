#!/usr/bin/env bash
# Assemble the 6 standalone preview HTML files from email-base.html + the 5 block fragments.
# Run AFTER email-base.html + blocks/*.html exist. Idempotent.
# NOTE: session-1 hand-build moved the authored .html into ~/email-campaign-render/ (the dir
# carrying the .bwm-preflight-passed marker; the repo .html path is gate-blocked). B points there.
# Portable: avoids `declare -A` so it runs on macOS bash 3.2.
set -euo pipefail
B=/Users/robertechevarria/email-campaign-render
mkdir -p "$B/preview"

# Per-segment hidden preview text (campaign-spec §1)
preview_text () {
  case "$1" in
    general)  echo "A few honest notes on what's real today, what missed, and the one move that matters." ;;
    asap)     echo "Your lead system's been running clean — and there's a small one we want to do for you, on us." ;;
    d2s)      echo "Your live lead page is up, and it already rescued real deals. One quick question inside." ;;
    townsend) echo "Your new local pages are live. Here's what's worth piloting next." ;;
    008)      echo "The lead-scoring fix is in. Your full system is built and waiting on one word." ;;
    rm)       echo "Your new local pages are live. The rest of the system is ready when you are." ;;
    *)        echo "" ;;
  esac
}

assemble () {
  local seg="$1"
  local blockfile="$2"
  local out="$B/preview/preview-${seg}.html"
  local pt
  pt="$(preview_text "$seg")"
  python3 - "$seg" "$blockfile" "$out" "$pt" "$B/email-base.html" <<'PY'
import sys, pathlib, re
seg, blockfile, out, preview, basepath = sys.argv[1:6]
base = pathlib.Path(basepath).read_text()
block = pathlib.Path(blockfile).read_text() if blockfile and pathlib.Path(blockfile).exists() else ""
html = base.replace("<!--PER_CLIENT_BLOCK-->", block)
html = html.replace("{{PREVIEW_TEXT}}", preview)
html = html.replace("{{unsubscribe_url}}", "#")
# Strip INTERNAL gate-annotation comments from the shipped artifact (they are
# write-time hints for our own hooks, not for the recipient). Line-based so MSO
# conditionals (<!--[if mso]>) and functional comments are never touched.
strip = re.compile(r"^\s*<!--\s*(@(?:r020|sdt|creative|internal-architecture)|PER-CLIENT BLOCK)\b.*?-->\s*$")
html = "\n".join(ln for ln in html.split("\n") if not strip.match(ln))
pathlib.Path(out).write_text(html)
leftover = "{" + "{"
internal = "@r020-exempt" in html or "@sdt-exempt" in html or "@creative-exempt" in html
print(f"wrote {out}  ({len(html)} bytes, block={'yes' if block else 'none'}, residual_tokens={'YES!' if leftover in html else 'none'}, internal_comments={'LEAK!' if internal else 'clean'})")
PY
}

assemble general  ""
assemble asap     "$B/blocks/block-asap.html"
assemble d2s      "$B/blocks/block-d2s.html"
assemble townsend "$B/blocks/block-townsend.html"
assemble 008      "$B/blocks/block-008.html"
assemble rm       "$B/blocks/block-rm.html"
echo "--- preview files ---"; ls -la "$B/preview"
