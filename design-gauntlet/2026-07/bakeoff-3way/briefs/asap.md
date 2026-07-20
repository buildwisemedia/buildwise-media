# Design Dispatch Brief — ASAP Pest & Wildlife: Homepage (single-file build)

One-pass build. Follow every anchor exactly. Return your best complete work — there is no follow-up round.

## Output contract
- ONE complete, self-contained HTML file. All CSS in a single inline `<style>` block; minimal vanilla JS inline if needed. The ONLY external requests allowed are Google Fonts `<link>` tags. No CDNs, no external images, no frameworks.
- No photography assets exist for this build. Where a photo would appear, design an art-directed placeholder surface: tonal blocks/gradients in the brief's palette carrying a small caption of the intended shot (e.g. "Photo: technician sealing a roofline"). Never fabricate fake photos, logos, badges, or review-platform marks.
- Fully responsive 320px → 1440px+, mobile-first. Semantic HTML. Accessible contrast. Real `alt`/`aria` where relevant. Click-to-call `tel:` links on every phone number.
- Use ONLY the facts, copy anchors, and claims in this brief. Invent NO statistics, review counts, awards, prices, or offers.
- Testimonial section is LAYOUT ONLY: use obviously-placeholder quote text ("Review copy goes here — service, neighborhood, outcome"). Do not write fake reviews or fake customer names.

## The business and the visitor
ASAP Pest and Wildlife — a family-run wildlife removal + pest control company serving Metro Atlanta. Visitors arrive in one of two states: URGENT (an animal is in the house right now — they want the phone number within seconds) or RESEARCHING (they heard noises — they want to identify their problem). The page must serve both.

## Register anchor (how it must feel)
Calm, family-run reassurance with premium navy authority. Anti-fear: the problem is serious, the delivery is soothing. "Peace of mind restored," never alarm. Formality 4/10, seriousness 6/10, zero edge, zero aggression. Premium comes from restraint and dark-navy depth — not from loudness. Headlines make the reader feel relief, not fear.

## Palette anchor (locked client identity — exact hexes)
- Navy `#1B2A4A` — primary: header, trust sections, dark structural bands
- Warm Cream `#F2EDDC` — content backgrounds, calm/safe zones
- Orange `#E87A2E` — the client's locked accent: CTAs, phone numbers, urgency signals. Use it exactly; NEVER substitute your own red/coral.
- Charcoal `#1B1B1B` footer/contrast · Near Black `#212121` body text on light · Soft White `#F0F0F0` text on dark
- 60/30/10 discipline: cream/white dominant, navy structural, orange only where action lives.

## Type anchor
- Headlines: Poppins Bold — weight 700 MAXIMUM, never 800/900. Sentence case, never all-caps. Hero scale clamp(32px, 5vw, 56px).
- Body: Inter Regular 16–18px, line-height 1.7.

## Hard bans (do NOT use any of these)
1. Rounded/geometric display sans at weight ≥800 (no Poppins/Raleway/Nunito/Avenir/Baloo heavy weights)
2. Any saturated coral/red accent of your own — the only warm accent on this page is the client's `#E87A2E`
3. Decorative half-circle arcs / circles (no border-radius:50% decoration motifs)
4. Rotated sticker/stamp/badge devices
5. Ghost numerals (huge type at opacity ≤ 0.25)
6. Number-in-a-circle step cards — the 4-step process renders as large full-opacity Poppins 700 numerals with a thin connecting line: editorial and calm
7. Scary/disgusting pest imagery framing, aggressive popups, autoplay anything

## Section order + content (use only these facts and copy anchors)
1. **Hero** — navy-overlaid placeholder photo surface (caption: technician at a client's home). H1: "Your Home. Your Peace of Mind. Restored." Subheadline of your crafting (calm, outcome-focused). Phone LARGE: (770) 691-3636. CTA "Schedule Your Inspection". Trust badge text: "Licensed by GA DNR · 5-star rated".
2. **Trust bar** (cream): 100+ Five-Star Reviews · 24/6 Availability · Licensed & Certified · Family-Run.
3. **Services grid** — TWO labeled rows, wildlife FIRST. Wildlife: Raccoons, Squirrels, Bats, Snakes, Rats & Mice, Birds, Opossums, Bees & Wasps, Armadillos. Pest Control: Roaches, Ants, Termites, Mosquitoes, Spiders, Fleas & Ticks, Bed Bugs. Clean typographic or simple line-icon tiles (inline SVG allowed) — nothing cartoonish. Each tile: name + 1-line description + "Learn more" link.
4. **How it works** (navy band, white text): Inspect → Trap → Exclude → Disinfect. Two-line description each. Large full-opacity numerals + thin connecting line.
5. **Emergency CTA** (orange band, no animation — stable urgency): "Hear something in your attic? Call ASAP." + (770) 691-3636 + "We answer 24 hours a day, 6 days a week".
6. **Why ASAP** (cream): Humane & Eco-Friendly · Complete 4-Step Solution · 24/6 Emergency Response · Family-Run & Licensed · Warranty on Exclusion Work · Free Phone Consultations.
7. **Commercial callout** (navy): "Protecting Atlanta's Businesses Too" — TEXT-ONLY mention: trusted by Atlanta businesses including Chick-fil-A and Bank of America locations (no logos). CTA "Get a Commercial Quote".
8. **Testimonials**: three placeholder quote cards (layout only, placeholder text per output contract).
9. **Service area** (charcoal): "Serving Metro Atlanta and Beyond" + placeholder map surface + short area list placeholder.
10. **About / family** (cream): short family-run story block — calm, personal, "we treat each property as if it were our own."
11. **Contact** — split layout: left "Peace of mind starts with one call," right a 4-field form: Your Name / Best Phone Number / What's Going On? (dropdown: Raccoon, Squirrel, Bat, Snake, Rats/Mice, Other) / Brief Description. Conversational microcopy.
12. **Footer** (charcoal): columns Services · Service Areas · About · Contact; licensing line (GA DNR, Dept of Agriculture, State of Georgia); hours.

## Craft bar
The page will be judged on hierarchy, typographic craft, spacing rhythm, color discipline, distinctiveness, and how well it serves the two visitor states. Restraint reads premium. Every element earns its place.
