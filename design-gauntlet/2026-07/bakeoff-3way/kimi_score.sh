#!/bin/bash
# Kimi K3 blind-scoring call. Usage: ./kimi_score.sh <prompt-file> <out-json>
set -euo pipefail
PROMPT="$1"; OUT="$2"
set -a; source "$HOME/.bwm_secrets/kimi.env"; set +a
TD=$(mktemp -d /tmp/kimi-score.XXXXXX); trap 'rm -rf "$TD"' EXIT

python3 - "$PROMPT" > "$TD/payload.json" <<'PY'
import json, sys
print(json.dumps({
  "model": "moonshotai/kimi-k3",
  "messages": [
    {"role": "system", "content": "You are a meticulous design judge. Follow the output format exactly: strict JSON, nothing else."},
    {"role": "user", "content": open(sys.argv[1]).read()}
  ],
  "max_tokens": 20000,
  "temperature": 0.2
}))
PY

for i in 1 2 3 4 5 6; do
  HTTP=$(curl -sS -o "$TD/resp.json" -w '%{http_code}' https://openrouter.ai/api/v1/chat/completions \
    -H "Authorization: Bearer $OPENROUTER_API_KEY" -H "Content-Type: application/json" \
    --max-time 900 -d @"$TD/payload.json") || HTTP=000
  [ "$HTTP" = "200" ] && break
  echo "attempt $i: HTTP $HTTP — backing off $((i*45))s"; sleep $((i*45))
done
[ "$HTTP" = "200" ] || { echo "FAILED (last HTTP $HTTP)"; head -c 300 "$TD/resp.json"; exit 1; }

python3 - "$TD/resp.json" "$OUT" <<'PY'
import json, re, sys
r = json.load(open(sys.argv[1]))
c = (r["choices"][0]["message"]["content"] or "").strip()
c = re.sub(r"^```(json)?\s*|\s*```$", "", c, flags=re.S)
json.loads(c)  # validate strict JSON before writing
open(sys.argv[2], "w").write(c)
print(f"wrote {sys.argv[2]} ({len(c)} bytes)")
PY
