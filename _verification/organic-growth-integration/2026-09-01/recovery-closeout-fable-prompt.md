# BWM Organic Growth application recovery closeout

You are the fresh-context, opposite-family reviewer for an existing Buildwise Media website application. Review only; do not edit files, deploy, publish, submit forms, change providers, or contact anyone.

## Exact target

- Repository: current working directory
- Branch: `codex/bwm-book-contact-20260831`
- Reviewed HEAD: `5e40c4dd4dbbe755009bb6ccf445e490e52318b6`
- Base: `origin/main` at `cff96d1`
- Organic Growth application commit: `2102306bdbe7c461e9e5d472dcaa74147d5ede41`
- Private live surface: `https://bwm-new-website-review.pages.dev/`
- Public production is out of scope and must remain untouched.

The application consumes four independently accepted frozen inputs:

- Shared schema `540baee5a4bb579e010b316eff8a6153c9f9a5f0`
- Universal AEO `ba9be3a4c32b3c57394566d83e8f5db21a9d11d5`
- Universal SEO `b906da711ef72d0b7302e6a521d3c442b190f16f`
- Universal Social + Video `ae304ebb4dd315c2d0fc6645fee2616ffa869d5e`

## Review job

Inspect the complete committed diff `origin/main...HEAD`, the exact source manifests and receipts under `_build-context/homepage-growth-integration/` and `_verification/organic-growth-integration/2026-09-01/`, and the current homepage and `/book/` source. Focus on concrete defects only:

1. source/identity drift or unsupported commercial/result claims;
2. SEO/AEO regressions, especially sitemap ownership, canonical/robots behavior, AI-answer inputs, entity/claim authority, and lifecycle preservation;
3. false-success or unsafe state in the `/book/` proxy, CRM/email receipt boundary, idempotency, and conversion event timing;
4. loss of account isolation or any accidental production/provider authority;
5. accessibility, responsive, usability, and visual defects visible from the committed artifact and receipts;
6. receipt statements that exceed the evidence.

Do not re-open the accepted visual direction merely because you would style it differently. Reject speculative findings. A finding is actionable only when you can cite the exact file and explain a concrete failing behavior.

Return one JSON object only:

```json
{
  "reviewed_head": "5e40c4dd4dbbe755009bb6ccf445e490e52318b6",
  "verdict": "ADVANCE_UNCHANGED or REVISE",
  "material_findings": [
    {
      "priority": "P0|P1|P2",
      "file": "path",
      "line": 1,
      "finding": "concrete defect",
      "evidence": "why it fails"
    }
  ],
  "confirmed_boundaries": ["short statements"],
  "summary": "one concise paragraph"
}
```
