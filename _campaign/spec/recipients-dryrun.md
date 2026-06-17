# Recipient Roster — dry-run preview (HITL review at P5)

> Resolved live from Supabase `contacts` 2026-06-17. **General/prospect/other audiences are hard-scoped to `client_id = BWM-self` — NO client-owned leads can enter.** Per-client audiences pulled only from the 5 named clients' own owner/team contacts. Dedupe by lowercased email; client-personalized variant wins over general.

## Routing model (recommended)
- **Personalized variant (essay + per-client operational block)** → **client OWNERS only** (the operational ask / upgrade nudge is owner-directed; juniors should not receive pricing/upgrade talk).
- **General essay (Robert-personal, no operational block)** → friends/partners + client TEAM members.
- **Prospects (9) + "other" (18)** → HOLD by default (cold/untagged) — your yes/no at review.

---

## A. Friends of BWM — SEND general  ✅ recommended (8)
**Referral partners (2):** Cathryn Marshall · Dale Ferdinand (Catalyst Collective)
**Mastermind peers (6):** Adieo McCalmon · Bronkar Lee · Keyaan Williams (CLASS LLC) · Chris Yadon (Saprea) · Tonya Penrod (Saprea) · Ursula Lentine (Twin Hearts Meditation — NOTE: NOT the client "Ursula & Associates")

## B. Client OWNERS — SEND personalized  ✅ recommended (6)
| Client | Owner | Email | Block |
|---|---|---|---|
| 008 Concrete | Jake Bond | jake@008-concrete.com | 008 (entry-tier, upgrade trigger) |
| ASAP Pest & Wildlife | Nehemiah Ray | nray@wildliferemovalasap.com | ASAP (Monday.com courtesy) |
| Design2Sell | Barbara Heil-Sonneck | barbara@homedesign2sell.com | D2S (Pro, build pilots) |
| Design2Sell | Joseph Sisson (co-owner) | bjsisson1@gmail.com | D2S — CONFIRM co-owner should get operational block |
| RutherfordMade | Scott Rutherford | scott@rutherfordmade.com | RM (entry-tier, upgrade trigger) |
| Townsend Realty | Tom Townsend | tom@townrg.com | Townsend (Pro, next pilot) |

## C. Client TEAM — general essay, light-touch  ⚠️ confirm (8)
ASAP: James Preston Mills III (mills@removeasap.com)
D2S: Ann · Chloe Adkins · Emiliya Gotzian · Rodel Saguin · Samuel Alexander
Townsend: Hannah Bunch (hannahbunch@me.com) · Jane (jane@townrg.com)
→ Recommend: send general essay (relationship-building). Alternative: skip team entirely. **Your call at review.**

## D. BWM-own prospects — HOLD by default  ⚠️ decision (9)
Jim Garip (Design & Remodel Brothers) · Jeremy Rytych (Element Roofing) · Jack Calhoun (Encore Career Lab) · Rich Matherne · Zac Hannah (Hannah Outdoor Designs) · Katie Hepner (Lakes Counseling) · Chip Kelleher (Silvercrest Asset Mgmt) · Michael Pittman (Simple Money Academy) · Ryan Shane (Truly Nolen Atlanta)
→ Cold/untagged source. Warm-ish (closed-lost re-engagements + referrals). Include in general send? Your yes/no.

## E. "Other" — HOLD by default  ⚠️ decision (18, → 16 mailable)
Mixed network: real-estate agents, mortgage, recruiters, church, studio, etc. (Marjean Olsen, Nick Horlock, Nyari Park, Stephen Whittier, Steve Claudin, Gretchen Kornutik, Carla Smith, Nick Bilotta, Elmer Salazar, Ana Megrelishvili, Tyler Courson, Phil Wise, John Balauat, Jeffrey Morgan, Ray Messer, Michael Pittman[dup], Ellen Barnard, Joseph Suarez)
→ **Suppress:** `john@ivyapp.com` (prior bounce) · `michaelpittman20@yahoo.com` (dup of prospect Michael Pittman — dedupe). Include the rest in general? Your yes/no.

---

## Send-size scenarios
- **Conservative (recommended default):** A(8) + B(6 personalized) + C(8 general) = **22 recipients.** No warmup needed.
- **+ prospects:** +9 = 31.
- **+ other:** +16 = up to ~47 (still single-batch safe).

## Suppression applied before any send
1. `is_synthetic_contact()` (already filtered above) · 2. `email_suppression` table (unsubscribes) · 3. prior bounce/complaint (`john@ivyapp.com`) · 4. missing `contact_id` · 5. dedupe by lowercased email (Michael Pittman, and any owner who is also a friend).

## Open decisions for Robert (at HITL)
1. Prospects (D): include or hold?  2. "Other" (E): include or hold?  3. Client team (C): general essay or skip?  4. D2S co-owner Joseph Sisson: personalized block or general?  5. Ursula & Associates (client) — not in roster above because her owner contact (Jason Wilson) wasn't returned under these 5 slugs; confirm if she should get a personalized or general send.
