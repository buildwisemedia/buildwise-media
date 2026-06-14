# Implementation Notes — buildwise-media positioning-shift patch (2026-06-14)

> Running journal for the BWM-Positioning-Shift-2026-06 cascade-audit remediation of the
> flagship's client-facing Layer-1/2/3 surfaces. Stage-2 artifact. Staged on branch
> `fix/positioning-shift-homepage-2026-06-14` (off origin/main) for Robert's HITL visual signoff.

## Scope
Demote marketing / lead-gen from **identity** to **evidence** per LOCKED `brand/BWM-Positioning-Shift-2026-06.md`.
BWM's "what we are" = custom AI systems for service businesses; lead/marketing results stay as proof.
Copy + JSON-LD + llms only. **No new pages, no redesign, no new/changed imagery.**

## Decisions not in the spec
- **Pre-Flight marker written as `mode=patch` (copy-only).** The bwm-website-builder gate is built for
  full builds (Steps 3C imagery matrix / 4-5 layout options). For this targeted positioning copy-patch on
  the already-shipped, already-QA'd flagship those steps are N/A (no new pages/imagery/redesign); the
  substantive locks (positioning shift, voice card, client voice, canonical) were loaded before any write.
  Imagery floor (Rule W6) is unchanged from the live-compliant baseline.
- **category_claim** new value "Verifiable custom AI systems for service businesses" inherited from
  canonical.json (roadmap commit dabe903). BaseLayout Org/WebSite JSON-LD descriptions updated to match.

## Deviations from the brief
- None — strings-only identity demotion.

## Tradeoffs (and why)
- **Playbook pages (`/playbook/ai-marketing-department*`) left as-is** and only their llms.txt link
  descriptions softened to outcome-altitude. These are SEO content targeting the "AI marketing department"
  keyword; a wholesale rewrite is a separate content decision (ranking risk) and out of this patch's scope.
  Flagged for Robert.
- **`/about`, `/pricing` identity lines** carry the same drift but are separate pages needing their own
  visual review; enumerated for Robert rather than bundled, to keep this staged PR reviewable.

## Anything the reviewer should know
- HITL: this branch is NOT merged to main. CF preview is for Robert's visual signoff of the new identity copy.
- Internal source-of-truth already updated directly (canonical.json, Brain voice docs, CLAUDE.md) — see closeout.
