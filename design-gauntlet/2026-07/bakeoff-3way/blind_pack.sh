#!/bin/bash
# Build the blind packet: shuffle A/B/C labels per client, strip model tells,
# seal the origin map, publish only its SHA256.
set -euo pipefail
RUN="$(cd "$(dirname "$0")" && pwd)"
cd "$RUN"
mkdir -p blind seal

need() { [ -s "entries/$1" ] || { echo "MISSING entries/$1"; exit 1; }; }
for f in fable-asap.html sol-asap.html kimi-asap.html fable-d2s.html sol-d2s.html kimi-d2s.html; do need "$f"; done

python3 - <<'PY'
import hashlib, json, random, re, os
random.seed(int.from_bytes(os.urandom(8), "big"))  # fresh entropy each run
origin = {}
for client in ("asap", "d2s"):
    models = ["fable", "sol", "kimi"]
    labels = ["A", "B", "C"]
    random.shuffle(labels)
    for model, label in zip(models, labels):
        src = f"entries/{model}-{client}.html"
        dst = f"blind/{client}-{label}.html"
        html = open(src, encoding="utf-8", errors="replace").read()
        # strip tells, identically for every entry: all HTML comments + generator metas
        html = re.sub(r"<!--.*?-->", "", html, flags=re.S)
        html = re.sub(r"<meta[^>]*name=[\"']generator[\"'][^>]*>", "", html, flags=re.I)
        open(dst, "w", encoding="utf-8").write(html)
        origin[f"{client}-{label}"] = model
blob = json.dumps(origin, indent=2, sort_keys=True)
open("seal/origin-map.json", "w").write(blob)
sha = hashlib.sha256(blob.encode()).hexdigest()
open("seal/origin-map.sha256", "w").write(sha + "\n")
print("BLIND PACKET READY")
print("origin-map SHA256:", sha)
for f in sorted(os.listdir("blind")):
    print(" ", f, os.path.getsize(os.path.join("blind", f)), "bytes")
PY
chmod 600 seal/origin-map.json
echo "seal/origin-map.json is the ONLY file mapping labels to models — do not open until Robert's verdict."
