# Project OneBiz Command — V1 Consolidated Learnings

> Companion to PJ Zhou's "Project Pipedrive v0.8". That document defines the philosophy and the object model; this one records what was built against it, what was learned, what is still missing, and what is needed next. Principle carried over verbatim: **Never think from zero twice.**

## 1. Objective & Philosophy

OneBiz Command is not a traditional CRM. It is the working and knowledge system for Airline BD in the Middle East, Africa and India portfolio:

- Capture what interactions with airlines produce, with minimal BD effort;
- Parse unstructured captures into reusable, typed information;
- Link information to real business objects (airline, contract, thread, stakeholder, KPI);
- Surface it to leaders as health, risk, and opportunity — not as raw feed;
- Turn individual knowledge into organizational assets over time.

Two personas, one source of truth:

| Persona | Needs | Surface |
|---|---|---|
| Leader (Anuj, Shrey, PJ, Kirk) | Portfolio health, risk, stale work, who-owns-what | Overview map + mega updates, Workspace tabs, Airline profiles |
| BD (Praveen, Dinit, Nabil, Snehal) | Frictionless capture, own pipeline, account context | Capture form, own accounts, topics from inbox |

### Philosophy lessons learned the hard way

1. **Airlines do not run deal funnels.** A single carrier runs campaigns, incentives, fares, NDC, contracts and QBRs in parallel. The pipeline is a tagged board with status + maturity, not a stage funnel.
2. **A meeting is not an opportunity.** Classification needs commercial substance; neutral facts are information, not pipeline.
3. **Noise is excluded, never prioritized.** OOO and scheduling chatter that gets a priority becomes fake work. It is dropped at the source.
4. **Authority outweighs volume.** A stakeholder's value is decision weight, not thread count. Senior-sounding titles with no observed leverage score low.
5. **The link is the product.** Text on a card is not linkage. A promoted item must carry its thread, its contract, its action, and its value — or it is just a note.
6. **Scope before solutioning.** Structure decisions (tabs, objects, status vocabulary) are pinned before building; building first wastes iterations.

## 2. Core Flow — Capture → AI Parse → Link → View → Follow-up

| Stage | Built | How |
|---|---|---|
| Capture | Manual input form; Outlook email pull (per-BD device flow); Outlook calendar pull; market intel file | `LogUpdateForm`, mail pipeline, `scripts/calendar_pull.py`, `market_intel.json` |
| AI Parse | Email threads clustered into topics with summary, dollar impact (quote-verified), status, priority, owners | `scripts/cluster_topics.py` (Claude), noise now dropped at source |
| Link | Thread → opportunity on promotion; opportunity → contract; theme tags from PJ taxonomy; account/BD ownership layers; meeting → account | `sourceUpdateId`, `contractIata`, theme tagger, `layers` |
| View | Home mega updates (coming/happening/happened), workspace board, airline profile buckets (theme × priority matrix), people intelligence | HomeWorkspace, OpportunitiesTab, IntelBuckets, StakeholderPanel |
| Follow-up | Next-step on updates feeds the Gantt; next-action on opportunities tied to dollar value; past-due flag forces closure; stale flag flags dwell > 14 days | timeline engine, `dueDate`, `isStale`/`isPastDue` |

## 3. Information Objects — Status vs Pipedrive Taxonomy

| Pipedrive object | Status in OneBiz Command | Implementation |
|---|---|---|
| Opportunity / Lead | **Built** | `OpportunityRecord`: themes, status (open/won/lost/stalled), priority (P1–P3), confidence, value, next action, due date, thread link, contract link |
| Thread | **Partially built** | Clustered email topics carry thread count + lifecycle (active/in_progress/dormant/closed) and function as threads within email; no cross-source thread object yet |
| Insight / Intelligence | **Partially built** | Market intel + mega signals; retained and surfaced, but not a persisted searchable object |
| Action Item | **Partial** | `nextStep` on updates, `nextAction` on opportunities; no independent execution-layer object |
| Resource / Commercial Resource | **Not built** | Fares, commissions, incentives exist only as text inside opportunities |
| Need (Airline Need Profile) | **Not built** | No accumulation of expressed/implicit needs per airline |
| Stakeholder | **Built (curated)** | `stakeholders.json`: weight, traits, movers, style, play — synthesized by judgment, not derived |
| Airline Profile | **Built as workspace** | Account page: overview (opps + hierarchy), intel buckets, performance, people |

## 4. Structuring (UI Architecture)

- **Home (Overview)** — map as orientation; browse-by-BD chips; selection (portfolio / BD / BD+region / account) drives a summary (carrier count, cumulative YTD, blended vLY, pax) and three time tabs: Coming / Happening / Happened. **Mega updates only**: dollar ≥ $100K, priority high, strategic keyword, or curated market intel. Rows expand to detail + BD action item + linked opportunity with Won/Stall/Lost/Reopen.
- **Workspace** — four tabs: Opportunities & Threats (board sorted priority → past-due → stale → dwell, with theme tags, status actions, thread/contract chips), Activity (BD workload, cross-account Gantt, updates feed), Contracts & Financials (pace vs elapsed, renewal window, revenue at risk), Metrics (portfolio rollup, revenue by BD, drill-through).
- **Airline Profile** — four tabs: Overview (that airline's opportunities with value tied to action, ownership hierarchy with per-BD interaction counts), Intel & Activity (all evidence sources theme-tagged, priority × theme matrix, closed items show "insight captured"), Performance, People (scored stakeholders + reporting structure).
- **Nav** — two levels: header (Overview / Workspace), local tab bars within each surface.

## 5. Linkage — What Is Actually Linked

| Link | Mechanism |
|---|---|
| Email thread → opportunity | `sourceUpdateId` preserved at promotion; ⟵ thread chip |
| Opportunity → contract | `contractIata`; ⇢ contract chip, link/unlink on the card |
| Opportunity/action → value | `valueUsd` shown on the action ("tied to $X"); quantified example: EK premium economy, 96 unsold seats × est. yield ≈ $153K |
| Intel → theme taxonomy | PJ's 8 majors + 5 minors, keyword auto-tag on promotion |
| Account → BD hierarchy | `layers`: global owner + local market owners (e.g., EY/QR: global GCC + local KSA) |
| Calendar → account | Graph calendarview matched by attendee domain / airline name |
| Airline person ↔ Trip counterpart | participants.json edges (thread-weighted) + org-seed reporting chain |

## 6. Database Needs

**Today:** JSON files in `src/data/`, committed to git, served by Vercel. Updates/opportunities/meetings/contracts written through API routes to disk. Works at current scale; no concurrent-write safety, no relational integrity, no history.

**Data feeds in place:** noSave_*.csv (transactional, 39 carriers) → aggregator → metrics + vendored dashboards; Outlook mail + calendar via Graph (read-only guardrail, `Calendars.Read` + `Mail.Read`); market intel (curated file); participants (extracted from mail).

**What the object model needs next:**

| Need | Why |
|---|---|
| Relational store (Turso/Postgres) | Concurrent writes, integrity across objects, audit trail |
| Tables: resource, need, thread, stakeholder_event | First-class objects instead of text fields |
| Contract registry | Contracts are seeded today; real terms/renewals/clauses must be records opportunities link into |
| Capacity/seat-level feed | Quantified opportunities (premium upsell math) currently estimate yield; seat inventory makes them real |
| KPI/OKR registry | Linking intel to the targets it moves |
| Event/history log | "What changed, when, by whom" across every object |

## 7. Current Gaps (honest inventory)

1. Resource and Need objects absent — incentives/fares live as opportunity text; no airline need profile accumulates.
2. Threads do not span sources — email clusters are threads within mail; a conversation continuing in a meeting starts a new, unlinked item.
3. Stakeholder scores are curated by judgment, not derived from evidence; only 5 airlines have stakeholder coverage (EK/SV/XY/F3/EY); org chart seeded for EK only.
4. Due dates are set by hand at seeding, not extracted from thread content.
5. Metrics cover 4 of 30 carriers until the next CSV refresh; no seat-level data.
6. Capture gaps: no WhatsApp, no automatic meeting notes; calendar pull covers the leader mailbox, per-BD calendars pending.
7. Clustering prompt fix takes effect on the next run; legacy clusters retain old shapes until re-clustered.
8. Single shared password; no per-user write audit on the JSON store.
9. No retrieval layer — captured knowledge is viewable but not searchable/semantic across time (the "organizational asset" half of the mission).
10. Follow-up is manual: nothing automatically proposes the next action from a parsed capture.

## 8. Use Cases From the Initial Brief — Not Yet Covered

| # | Use case (per brief & Pipedrive doc) | What is needed |
|---|---|---|
| 1 | Parse classifies captures into typed objects (Insight / Need / Resource / Thread / Opportunity / Action), not just summaries | Extend the parse prompt to emit object type + proposed links; object registry to receive them |
| 2 | Link to concrete production objects — a specific incentive under discussion, a fare resource, an existing KPI/OKR | Resource + KPI registries; link picker on parse output |
| 3 | Airline Need Profile accumulated over time | Need object tagged per airline; profile view aggregating needs by theme and recency |
| 4 | Thread continuity across meetings/conversations (one discussion, many touches) | Cross-source Thread object; meetings, emails and manual inputs attach to it; promotion targets the thread's opportunity |
| 5 | Stakeholder coverage map — which key airline stakeholders Trip.com actually covers | Org-chart seeds for all airlines + coverage lens (covered / touched / untouched) on the People tab |
| 6 | Quantified opportunity generation from capacity math | Seat-level inventory + yield model; opportunity auto-drafted with value formula shown |
| 7 | Follow-up discipline — right actions created, not everything turned into tasks | Follow-up engine: rules per object type (Resource → link, Insight → retain, Need → profile, Thread → track, Opportunity → progress, Action → execute) |
| 8 | Organizational memory — knowledge retrievable in future contexts | Search/retrieval over digests, threads and insights (semantic), surfaced when an airline or theme comes up again |
| 9 | WhatsApp / meeting-notes capture | Ingestion paths beyond mail and calendar |

## 9. Summary — What Is Needed to Close the Brief

In build order, each step unblocking the next:

1. **Thread object across sources** — the spine. Emails, meetings, manual inputs attach to one discussion; opportunities promote from threads, keeping full lineage. Unblocks use cases 4, 7, 8.
2. **Typed parse** — extend clustering/extraction to emit object type and proposed links, routed into the registries below. Unblocks 1.
3. **Resource + KPI registries, then Need profile** — the link targets the brief was written around. Unblocks 2, 3.
4. **Evidence-derived stakeholder scoring + org-chart coverage** — replace curated weights with signals (who sets terms, who signs, counterpart seniority); seed org chains portfolio-wide. Unblocks 5.
5. **Capacity feed + value model** — turn quantified opportunities from estimates into math the leader can defend. Unblocks 6.
6. **Retrieval layer** — semantic search over all captured knowledge, surfaced inside airline profiles and the board. Delivers the "never think from zero twice" promise. Unblocks 8.
7. **Persistent store migration** — JSON → relational DB with history, before write volume outgrows files.

---

*Version history: v0.1 BD-input CRM → stripped to leader command center (map, updates, hierarchy, Gantt) → email intelligence pipeline → opportunity/threat board with PJ theme taxonomy → home rewired to selection-scoped mega updates → airline profile with theme × priority buckets → linkage plumbing (thread/contract/value), past-due machinery, noise exclusion at source, authority-first people scoring. All iterations shipped to flt-onebiz-command.vercel.app.*
