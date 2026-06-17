#!/usr/bin/env bash
# Assemble the 6 standalone preview HTML files from email-base.html + the 5 block fragments.
# Run AFTER Codex writes email-base.html + blocks/*.html. Idempotent.
set -euo pipefail
B=/Users/robertechevarria/bwm-email-campaign/_campaign/build
mkdir -p "$B/preview"

# Per-segment hidden preview text (campaign-spec §1)
declare -A PT
PT[general]="A few honest notes on what's real today, what missed, and the one move that matters."
PT[asap]="Your lead system's been running clean — and there's a small one we want to do for you, on us."
PT[d2s]="Your live lead page is up, and it already rescued real deals. One quick question inside."
PT[townsend]="Your new local pages are live. Here's what's worth piloting next."
PT[008]="The lead-scoring fix is in. Your full system is built and waiting on one word."
PT[rm]="Your new local pages are live. The rest of the system is ready when you are."

assemble () {
  local seg="$1" blockfile="$2" out="$B/preview/preview-${seg}.html"
  python3 - "$seg" "$blockfile" "$out" "${PT[$seg]}" <<'PY'
import sys, pathlib
seg, blockfile, out, preview = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
base = pathlib.Path("/Users/robertechevarria/bwm-email-campaign/_campaign/build/email-base.html").read_text()
block = pathlib.Path(blockfile).read_text() if blockfile and pathlib.Path(blockfile).exists() else ""
html = base.replace("<!--PER_CLIENT_BLOCK-->", block)
html = html.replace("{{PREVIEW_TEXT}}", preview)
html = html.replace("{{unsubscribe_url}}", "#")
pathlib.Path(out).write_text(html)
print(f"wrote {out}  ({len(html)} bytes, block={'yes' if block else 'none'})")
PY
}

assemble general ""
assemble asap     "$B/blocks/block-asap.html"
assemble d2s      "$B/blocks/block-d2s.html"
assemble townsend "$B/blocks/block-townsend.html"
assemble 008      "$B/blocks/block-008.html"
assemble rm       "$B/blocks/block-rm.html"
echo "--- preview files ---"; ls -la "$B/preview"
