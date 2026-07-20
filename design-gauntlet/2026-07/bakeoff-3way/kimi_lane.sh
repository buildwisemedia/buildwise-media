#!/bin/bash
# Kimi K3 authoring lane — fires when ~/.bwm_secrets/kimi.env exists.
# Env file supplies ONE of: OPENROUTER_API_KEY (model moonshotai/kimi-k3)
#                        or MOONSHOT_API_KEY  (platform.kimi.ai, model kimi-k3)
# Usage: ./kimi_lane.sh <brief-file> <out-file>
set -euo pipefail
BRIEF="$1"; OUT="$2"
ENVF="$HOME/.bwm_secrets/kimi.env"
[ -f "$ENVF" ] || { echo "BLOCKED: $ENVF missing (Kimi access task)"; exit 75; }
set -a; source "$ENVF"; set +a

if [ -n "${OPENROUTER_API_KEY:-}" ]; then
  URL="https://openrouter.ai/api/v1/chat/completions"; KEY="$OPENROUTER_API_KEY"; MODEL="moonshotai/kimi-k3"
elif [ -n "${MOONSHOT_API_KEY:-}" ]; then
  URL="https://api.moonshot.ai/v1/chat/completions"; KEY="$MOONSHOT_API_KEY"; MODEL="kimi-k3"
else
  echo "BLOCKED: kimi.env has neither OPENROUTER_API_KEY nor MOONSHOT_API_KEY"; exit 75
fi

# run-scoped temp files — two lanes run concurrently, never share paths
TD=$(mktemp -d /tmp/kimi-lane.XXXXXX)
trap 'rm -rf "$TD"' EXIT
PAYLOAD="$TD/payload.json"; RESP="$TD/resp.json"

SYS="You are a senior web designer-engineer. Author the complete homepage described in the dispatch brief. Output ONLY the finished single-file HTML document — no commentary, no markdown fences. One pass: your best complete work."

python3 - "$BRIEF" "$MODEL" "$SYS" > "$PAYLOAD" <<'PY'
import json, sys
brief = open(sys.argv[1]).read()
print(json.dumps({
  "model": sys.argv[2],
  "messages": [
    {"role": "system", "content": sys.argv[3]},
    {"role": "user", "content": brief}
  ],
  "max_tokens": 60000,
  "temperature": 0.7
}))
PY

# 429-resilient: launch-week capacity is constrained
for i in 1 2 3 4 5 6; do
  HTTP=$(curl -sS -o "$RESP" -w '%{http_code}' "$URL" \
    -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
    --max-time 900 -d @"$PAYLOAD") || HTTP=000
  [ "$HTTP" = "200" ] && break
  echo "attempt $i: HTTP $HTTP — backing off $((i*45))s"; sleep $((i*45))
done
[ "$HTTP" = "200" ] || { echo "FAILED after retries (last HTTP $HTTP)"; head -c 400 "$RESP"; exit 1; }

python3 - "$RESP" "$OUT" <<'PY'
import json, re, sys
r = json.load(open(sys.argv[1]))
c = r["choices"][0]["message"]["content"] or ""
fr = r["choices"][0].get("finish_reason")
# mechanical repair only: strip fences / pre-doctype chatter (same rule as all lanes)
m = re.search(r"<!(doctype|DOCTYPE)", c)
if m: c = c[m.start():]
c = re.sub(r"\n```\s*$", "\n", c)
open(sys.argv[2], "w").write(c)
u = r.get("usage", {})
print(f"wrote {sys.argv[2]} ({len(c)} bytes) finish={fr} tokens_in={u.get('prompt_tokens')} out={u.get('completion_tokens')}")
PY
