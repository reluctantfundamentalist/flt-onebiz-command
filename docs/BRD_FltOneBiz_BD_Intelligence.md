# Business Requirements Document (BRD)
## Flt OneBiz — BD Intelligence Capture: Free-Text → Structured Account Records

**Author:** Anuj Bansal, BD
**Date:** July 28, 2026
**Reviewers:** PJ Zhou (周德辰), Carrie Yan Wang (Product), Flt OneBiz Product/Eng
**Live prototype:** https://flt-onebiz.vercel.app
**Code (private):** github.com/reluctantfundamentalist/flt-onebiz

---

### Executive Summary

Today a BD secures one airline deal that is really a bundle of commercial instruments — commission, backend incentive, virtual-card incentive, NDC subsidy, marketing incentive, marketing cash, private fares — each landing one-by-one over time and each scoped to an origin, point of sale, or market. To register it, the BD logs each instrument as a separate request through a different long form under a different tab in Flt OneBiz (Promo Fund, Upfront Commission, ORC…), with nothing tying them to the airline account or to each other. The global-vs-local-market nuance lives in the BD's head. The flow works, but it is a maze.

This BRD defines the move from a maze of per-instrument forms to a single free-text intake that the platform structures for the BD. The BD writes a chat-like note and drops in the airline fare sheet; the platform splits the note into clauses, classifies each into the right sheet type, pre-fills the real Flt OneBiz form fields for that sheet type (drawing the fare-sheet details via OCR where the note is silent), disambiguates terms that sound the same but are commercially different, pushes the assembled forms back to the BD for a quick go-ahead, and on approval submits them into Flt OneBiz where the existing approval flow fires unchanged. The same structured records then feed an account-health view and auto-route cross-team action items.

The MCP and Feishu-bot intake (BD messages a bot, the bot pulls the attachment from the inbox, runs the whole flow on Flt OneBiz) is a future-state scope, called out here and a candidate for a separate BRD.

### Project Objectives

- A BD registers a whole multi-instrument deal from one free-text note and one attachment — no per-instrument forms.
- The platform classifies each clause to the correct sheet type (Promo Fund, Upfront Commission, ORC) and pre-fills that sheet type's real form fields.
- The platform disambiguates conflatable terms (NDC incentive vs BSP commission vs backend vs virtual-card vs marketing incentive) without the BD re-tagging.
- Global-vs-local-market nuance is preserved at the child level and rolled up to one account-health view.
- Cross-team action items (NDC / LCC / Ops) route automatically from the structured records.
- The existing approval and notification flow is reused, not replaced.
- Clean structured data is produced as the foundation for the future Feishu-bot intake and MCP layer.

### Project Scope

**In scope:** free-text + attachment intake; clause classification into sheet types; per-sheet-type pre-fill of the real Flt OneBiz form fields; in-browser fare-sheet OCR (PNG/PDF) to source RBD / farebasis / accountcode / brandnames / routes / dates; disambiguation of conflatable terms; parent-child account model (global → local market → origin/POS-scoped instrument); human-in-the-loop review; submission into the existing approval flow; account-health rollup; auto-routed action items.

**Out of scope (this BRD):** technical feasibility / architecture / API design (product PRD); **ORC deep-build** (recognized by the classifier, structurer built later); MCP agent-call layer and Feishu-bot intake (separate future BRD); structured stakeholder profiling (future); external airline portal (future); iClaw build (separate).

### The Model — How Unstructured Input Becomes Structured Records

The pipeline, end to end:

1. **Free-text intake.** The BD writes a chat-like note into a free-text column and optionally attaches the airline fare sheet (PNG or PDF). No forms.
2. **Attachment processing.** The fare sheet is read in-browser (embedded text first, then OCR for image-only PDFs/PNGs) and its text is fed to the structurer alongside the note.
3. **Clause split.** The note is split on commas, newlines, and "and" into instrument clauses.
4. **Classify → sheet type.** Each clause is classified to a sheet type by keyword (see taxonomy below). Clauses with no sheet-type keyword are flagged for the BD to pick — never silently misrouted.
5. **Map → real form fields.** For each classified clause, the platform pre-fills that sheet type's actual Flt OneBiz form fields, applying the rules below (stacking, ringfence, theme, dates, commission type, attachment-sourced fields).
6. **Disambiguation.** Conflatable terms are told apart and the split is surfaced to the BD ("4 clauses said 'incentive' — mapped to N distinct sheet types").
7. **Review & confirm.** The platform pushes the assembled, pre-filled forms back to the BD. Low-confidence fields are flagged. The BD confirms or fixes, then submits.
8. **Submit.** On approval, the records submit into Flt OneBiz; the existing approver notifications fire unchanged.
9. **Account health & routing.** The structured records roll up into the account-health view (revenue, segments, WoW/MoM/YoY vs contracted target, bottlenecks, stakeholder map) and auto-generate cross-team action items.

### Taxonomy & Mapping

**Sheet types in scope** (the lever IS the sheet type): Promo Fund, Upfront Commission, ORC. The classifier recognizes all three; deep-build is Promo Fund + Upfront Commission now, ORC later. Other sheet types the platform already uses (BOGO_Internal, Internal/External Marketing Fund, etc.) are recognized for routing but not deep-built here.

**Lever → sheet-type mapping (BD-confirmed):**

| Free-text lever | Sheet type | Notes |
|---|---|---|
| "BSP commission", "upfront commission" | Upfront Commission | Commission type = Market commission |
| "marketing incentive", "marketing cash", "marketing fund", "MDF" | Promo Fund | Rate or USD total |
| "ORC", "overriding commission" | ORC | Recognized; structurer built later |
| "backend incentive", "virtual card incentive (VCF)", "NDC subsidy", "private fare" | **other** (flagged) | No sheet-type keyword — BD picks the sheet type |

**Real form fields pre-filled (Promo Fund):** Market, Theme (auto), Approvers (fixed per market), Sheet type, Request Summary, CCList · Fund Pool Approval Key · Validating Carrier, Operating Carrier, RBD, Brandnames, Interline, Arrival Area, Outbound/Inbound Blackout Periods · Total Budget, Currency, Marketing Carrier, Cabin, Trip Type, Validity, Passenger Type · Agent Code, Farebasis, FareType · Channel, GDS, AccountCode, Need POS=POC Ringfence?, Display Mode · Attachment.

**Real form fields pre-filled (Upfront Commission):** Market, Theme (auto), Commission type, Validating Carrier, Operating Carrier, V.V. (reverse route), Transfer Point, Amount type, Sheet type, Request Summary, Agent Code, Marketing Carrier, Route restriction, Upfront Commission Type, Stacked with existing commission, Stacked with existing incentive, inbound/outbound travel dates, Sales Start/End, Sales/Travel Blackout, Fare Type, GDS Engine Type, Cabin, Flight Type, Code Share, Channel, Code Share Scope, Designated Airport, Tour Code · Account Code, fare basis, Attachment, Ticket Designator, Passenger Type.

**Rules applied during mapping (BD-confirmed):**

- **Stacking** — Yes by default. No if the note contains exclusivity / non-eligibility language ("not eligible for any other incentive", "cannot be combined", "in lieu of", "standalone", "exclusive of").
- **Ringfence (POS=POC)** — No by default. Yes only if the note specifies ("ringfence", "POC=POS", "SITI", "specific agent only", "restricted to agent").
- **Theme** — auto-generated as `Agentcode_AirlineCode_ApplicationDate` (e.g. `SGSQ_SQ_20NOV2024`). The agent code is a per-market placeholder until confirmed.
- **Approvers / CCList** — fixed per market, untouched by the structurer.
- **Dates** — "from time to time" / "periodically" → left blank and flagged for the BD. Otherwise parsed from the note; fare-sheet dates override.
- **Attachment-sourced fields** — RBD, farebasis, accountcode, brandnames, routes, and dates are extracted from the attached fare sheet (OCR), not the chat note.
- **VI** — virtual interline; applies to ORC only. "If ORC applies to VI and normal product, two separate sheets."
- **Travix** — a separate Trip sales channel (another Trip company). ORC carries Travix-vs-Trip budget split and per-ticket amounts; the question is whether Travix sales are open or closed.

### Business Requirements (the "what")

- A BD shall submit a deal as a free-text note plus an optional fare-sheet attachment, without filling per-instrument forms.
- The platform shall split the note into instrument clauses and classify each to a sheet type (Promo Fund / Upfront Commission / ORC); unclassified clauses shall be flagged, not guessed.
- The platform shall pre-fill each classified clause's real Flt OneBiz form fields for that sheet type.
- The platform shall read the fare sheet (PNG/PDF, embedded text then OCR) and source RBD, farebasis, accountcode, brandnames, routes, and dates from it.
- The platform shall disambiguate conflatable domain terms (NDC incentive ≠ BSP commission ≠ backend ≠ virtual-card ≠ marketing incentive) automatically.
- The platform shall apply the rules above (stacking, ringfence, theme auto-gen, dates, attachment-sourced fields) and flag low-confidence fields.
- The platform shall push the assembled forms back to the BD for a quick go-ahead; on approval it shall submit into Flt OneBiz and the existing approval flow shall fire unchanged.
- A parent-child account model shall preserve global-vs-local-market nuance while rolling up to account health (revenue, segments, WoW/MoM/YoY, vs contracted target, bottlenecks, stakeholder map).
- Structured records shall auto-generate cross-team action items (NDC team, LCC team, Ops) with priority.

### Real Use-Case — Egypt Air (Snehal)

Snehal covers Egypt Air for Trip.com; Egypt Air is a global account, but the relationship she runs day-to-day is the local one in the UAE market. After a meeting, Egypt Air agrees to: 5% BSP commission, 3% backend incentive, 2% virtual-card incentive, USD 50k to drive NDC, 1% marketing incentive, USD 300k marketing cash, and a 5%-off private fare on Europe-origin flights offered from time to time. All of it eventually discounts the fare for the consumer to win share.

**What the platform does with that note today (prototype):**

- Splits the note into seven clauses.
- Classifies: `5% BSP commission` → **Upfront Commission** (Commission type = Market commission, amount 5%); `1% marketing incentive` and `300k marketing cash` → **Promo Fund** (Total Budget USD 300,000 for the cash; the 1% flagged as "confirm if USD total applies"); and flags `3% backend`, `2% virtual card incentive`, `50k to drive NDC`, and `5% off private fare Europe origin` for the BD to pick a sheet type (no keyword — never silently misrouted).
- Disambiguates: surfaces that multiple clauses said "incentive" but were routed to distinct sheet types (Upfront Commission vs Promo Fund vs flagged).
- Pre-fills the real Upfront Commission form fields: Market = AE, Validating Carrier = MS (Egypt Air), Commission type = Market commission, Amount type = %, Upfront Commission Type = 5%, Stacked with existing commission/incentive = Yes (no exclusivity language), Route restriction = blank (no ringfence specified), Theme auto-generated as `AGENTCODE_MS_<appDate>`, Approvers = fixed per market.
- Pre-fills the real Promo Fund form: Market = AE, Validating Carrier = MS, Total Budget = USD 300,000, Currency = USD, Ringfence = No, RBD / farebasis / accountcode / brandnames pulled from the fare sheet if attached (else flagged).
- Flags for the BD: the agent code in Theme (placeholder), travel/sales dates ("from time to time" → blank), and the four unclassified clauses.
- On Snehal's confirm, submits the forms into Flt OneBiz; existing approvers (Kirk Wong, Jeff Wang, Finance Ops, Regional Head) are notified; action items auto-route — NDC money to the NDC team, fare filing / commission / backend to Ops, marketing cash to Marketing.
- Egypt Air's account health now reflects the new instruments against contracted target, with the UAE local-market view preserved under the global account.

**Today, without the platform:** Snehal opens seven different forms under seven tabs, types each instrument into its own long form, names each theme by memory, carries the global-vs-UAE distinction in her head, and pings the NDC/Ops teams by hand. Nothing rolls up to an account view.

### Key Stakeholders

- Anuj Bansal — BD; BRD author; BD-UX owner.
- PJ Zhou (周德辰) — BD leadership; team alignment; future performance-evaluation mechanism.
- Carrie Yan Wang — Product; receives BRD → authors PRD.
- Flt OneBiz Product/Eng — builds modules; scopes the structurer + MCP in PRD.
- Regional BD executives — primary users; the inputters.
- NDC team, LCC team, Ops team, Marketing — receivers of auto-routed action items.

### Project Constraints

- BD-UX-first. Architecture and API decisions belong to the PRD.
- Flt OneBiz sits inside the Ctrip SSO and data ecosystem; any future bot or MCP work respects those boundaries.
- The existing approval and notification flow is fixed — we add intake and structuring on top, we don't replace it.
- The full instrument taxonomy and the exact instrument→team routing map are confirmed with BD Ops during the PRD.
- Draft shared before the Friday sync; core requirement documents finalized by mid-August.

### Cost-Benefit

**Value:** BD time recovered (one entry instead of N forms); account health becomes real, so commercial decisions stop being made blind; cross-team follow-ups stop depending on the BD remembering to ping; clean structured data is what the future Feishu-bot intake and MCP layer run on.

**Cost:** the parsing/disambiguation layer, the parent-child account model, and the fare-sheet OCR are the main build. Dollar figures are for finance and the PRD; this document doesn't invent them.

### Future-State (separate section; candidate separate BRD)

- **MCP agent-call layer:** expose Flt OneBiz modules to AI agents for real-time calls — contract health checks, partner requests, release-request processing. Iterative; parallel development so AI-agent readiness isn't serialized behind platform delivery.
- **Feishu-bot intake:** BD sends a rough message to a Feishu bot → bot pulls the attachment from the BD's inbox → runs the full intake/structure/confirm/submit flow on Flt OneBiz.
- **Structured stakeholder profiling** (roles, preferences, influence, tenure) — powers handovers and targeted engagement.
- **ORC deep-build** — the third sheet type; recognized now, structurer built later.
- External airline portal (future; reference hotel platform dual-view); iClaw build (separate alignment).

> Recommendation: spin the MCP + Feishu-bot intake into a separate BRD so the near-term intake/structuring/account-health work proceeds independently.

### Open Items (to confirm with product / BD Ops — not decided here)

- Full instrument taxonomy and the authoritative sheet-type list (dropdown option values are virtualized in Flt OneBiz and not yet harvested — the screen recording of the live forms will supply them).
- The complete lever→sheet-type mapping for backend / virtual-card / NDC / private fare (currently flagged).
- Instrument-type → team routing map.
- Account-health data sources (revenue, segments, contracted-target figures).
- Per-market agent code (for Theme auto-gen) and per-market approver defaults.

### Appendix — Live Build Screenshot

A screenshot of the live prototype (https://flt-onebiz.vercel.app) in the review state, showing the Egypt Air note split into a pre-filled Upfront Commission form (market commission, 5%) and Promo Fund form (USD 300,000), with the unclassified clauses flagged. The screenshot is appended below; more detail will be added to the Vercel build in subsequent iterations.

---

*BD-UX-first business requirements document. Technical feasibility, architecture, AI/pipeline design, and the MCP/Feishu-bot future-state are deferred to the product PRD and a separate future-state BRD.*
