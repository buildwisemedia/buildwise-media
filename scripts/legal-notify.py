#!/usr/bin/env python3
"""Service Terms update notification (PROJ-LEGAL-FLOW-001 Phase 5).

Sends the MSA §10 ¶4 email notice for the latest changelog entry in
src/data/legal-changelog.json. Website posting alone is never notice —
this email is the notice of record.

  --test        send to the internal test address only (subject gets [TEST])
  --to a@b ...  live recipients (client notice addresses; NEVER a bulk list
                that skipped the hygiene gate). No default recipients on
                purpose: live sends are explicit.
"""
import argparse, json, os, sys, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_TO = "peer-2@buildwisemedia.com"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", action="store_true")
    ap.add_argument("--to", nargs="*", default=[])
    args = ap.parse_args()
    if not args.test and not args.to:
        sys.exit("refusing: pass --test or explicit --to recipients")

    key = os.environ.get("RESEND_API_KEY")
    if not key:
        sys.exit("RESEND_API_KEY not in environment")

    log = json.load(open(os.path.join(REPO, "src/data/legal-changelog.json")))
    e = log["entries"][0]
    prefix = "[TEST] " if args.test else ""
    subject = f"{prefix}Buildwise service terms updated — v{e['version']}"
    body = (
        f"Hi,\n\n"
        f"We updated the Buildwise Media Service Terms to version {e['version']}, "
        f"effective {e['date']}.\n\n"
        f"What changed: {e['summary']}\n\n"
        f"You can read the current terms and the full change log here:\n"
        f"https://buildwisemedia.com/legal/\n\n"
        + ("This change is a material change. You have 30 days from this notice "
           "to object by replying to this email. The full mechanism is in your "
           "signed agreement, which controls.\n\n" if e.get("material") else "")
        + "Questions? Just reply to this email.\n\n— The Buildwise team\n"
    )
    payload = json.dumps({
        "from": "Buildwise Media <bob@buildwisemedia.com>",
        "to": [TEST_TO] if args.test else args.to,
        "reply_to": "robert@buildwisemedia.com",
        "subject": subject,
        "text": body,
    }).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails", data=payload, method="POST",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                 "User-Agent": "bwm-legal-notify/1.0"})
    with urllib.request.urlopen(req) as r:
        print(r.status, r.read().decode())

if __name__ == "__main__":
    main()
