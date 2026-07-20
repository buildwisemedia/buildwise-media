# Design Dispatch Brief — Design2Sell: Homepage (single-file build)

One-pass build. Follow every anchor exactly. Return your best complete work — there is no follow-up round.

## Output contract
- ONE complete, self-contained HTML file. All CSS in a single inline `<style>` block; minimal vanilla JS inline if needed (before/after slider, counters). The ONLY external requests allowed are Google Fonts `<link>` tags. No CDNs, no external images, no frameworks.
- No photography assets exist for this build. Where a photo would appear, design an art-directed placeholder surface: tonal blocks/gradients in the brief's palette carrying a small caption of the intended shot (e.g. "Photo: staged Buckhead living room, wide angle"). Never fabricate fake photos, logos, badges, or review-platform marks.
- Fully responsive 320px → 1440px+, mobile-first. Semantic HTML. Accessible contrast. Real `alt`/`aria` where relevant.
- Use ONLY the facts, copy anchors, and claims in this brief. Invent NO statistics, review counts, awards, prices, or offers. Where the layout calls for a price or project result, use visible placeholder text.
- Testimonial section is LAYOUT ONLY: use obviously-placeholder quote text. Do not write fake reviews or fake names.

## The business and the visitor
Design2Sell — Atlanta home staging, founder-led: Barbara IS the brand (the way Magnolia is Joanna Gaines). Two audiences share the page: HOMEOWNERS selling a house, and LISTING AGENTS who bring repeat business. Both must find their path without the page splitting in two visually.

## Register anchor (how it must feel)
Staged-home editorial luxury — "luxury without pretension," refined but accessible, founder-led premium (Magnolia / Bobby Berk tribe). The website itself must feel professionally staged: clean sight lines, generous negative space ("white space is staging"), photography-first hierarchy where text supports images and never competes. Data styled as elegant visual callouts, not buried copy.

## Palette anchor (locked client identity — exact hexes)
- Warm Charcoal `#3a3a3a` — headlines, primary text, navigation
- Soft Gold `#c9a96e` — accents, CTAs, credential highlights, hover states
- Warm White `#faf8f5` — page background, content areas
- Deep Navy `#1e2d3d` — contrast sections: stats band, agent-partnership band, footer
- Supporting: Pale Linen `#f0ece4` card backgrounds · Blush `#e8d5c4` testimonial background · Sage `#7d9b76` positive metrics only · Warm Gray `#6b6560` secondary text

## Type anchor
- Display/H1: Playfair Display 700, 42–56px desktop / 32–40px mobile. H2: Playfair Display 600.
- Body: Montserrat 400, 16–18px. CTAs/labels: Montserrat 600, uppercase, 1.5px letter-spacing, 14–16px.
- Big stat numbers: Playfair Display 700 at 48–72px.

## Hard bans (do NOT use any of these)
1. Rounded/geometric display sans at weight ≥800 at display sizes
2. Any saturated coral/red accent — the accent language of this page is soft gold `#c9a96e`
3. Decorative half-circle arcs / circles (no border-radius:50% decoration motifs)
4. Rotated sticker/stamp/badge devices
5. Ghost numerals (huge type at opacity ≤ 0.25)
6. Number-in-a-circle step cards — steps render as an editorial numbered list with thin hairline rules
7. Device register: the before/after slider is an elegant editorial device — thin soft-gold divider with a slim drag handle, NOT a chunky circular grip toy

## Section order + content (use only these facts and copy anchors)
1. **Hero** — full-viewport placeholder staged-room surface with a soft bottom gradient for legibility. H1: "Staged to Sell. Proven to Perform." Sub: "Atlanta's Top 10 Nationally Ranked Staging Team." Primary CTA (gold): "Get Your Staging Plan". Secondary ghost CTA: "See Our Portfolio". Credential strip: Top 10 Nationally | 19+ Years | Thousands of Homes | Pay-at-Close Available.
2. **Stats bar** (deep navy, gold Playfair numbers, count-up on scroll): $23.34 return per $1 invested · 50% faster sale time · 6–12% higher sale price · 19+ years of experience.
3. **The Staged to Sell System** — 3-step overview as an editorial numbered list with hairline rules (your crafting of step copy; grounded, no invented claims).
4. **Portfolio highlight** — six-tile masonry grid (3/2/1 columns) of placeholder room surfaces with hover overlay showing a project label + result line placeholder text.
5. **Before/After slider** — one signature project: two placeholder surfaces labeled Before / After, draggable thin gold divider (see device register ban #7). Touch-friendly.
6. **Service tiers** — three cards on pale linen: Essentials · Signature (featured: soft-gold border, slightly elevated) · Luxury. Ideal-for line + included-rooms line + placeholder price-range text + CTA "Book a Consultation".
7. **Pay-at-Close band** — "Stage Now. Pay When You Sell." Three-beat visual: Stage → Sell → Pay (editorial, hairlines, no circle badges) + one-line explainer + CTA "Learn About Pay-at-Close".
8. **Agent Partnership** (deep navy): "Built for Atlanta's Top Agents" — three features: Priority Scheduling · Co-Branded Materials · Quarterly ROI Reports. CTA (gold): "Join the Partnership Program".
9. **Testimonial** — one large Playfair italic placeholder quote on blush background (layout only).
10. **Trust bar** — TEXT-ONLY credential row: RESA · HSRA · Best of Houzz · Top 10 Nationally (no fabricated logos).
11. **Footer CTA + footer** (deep navy): "Ready to Stage Your Listing?" + gold CTA; footer columns Services · Portfolio · Agents · Contact.

## Craft bar
The page will be judged on hierarchy, typographic craft, spacing rhythm, color discipline, distinctiveness, and how convincingly it feels "staged." Negative space is the luxury signal. Every element earns its place.
