# OneBiz Command: Business Requirements Document

| | |
|---|---|
| Document owner | Anuj Bansal, Director Middle East and Africa |
| Version | 1.0 |
| Date | 21 August 2026 |
| Status | Delivered scope documented; live in production |
| System | flt-onebiz-command.vercel.app |

## 1. Executive summary

OneBiz Command is a leadership and BD working system for the airline portfolio of the Middle East, Africa and India region. It was built to solve one problem: leadership had no way to see the true state of airline accounts without asking BD to file reports, and BD had no system that captured the work they were already doing.

The system reads work that already exists, in BD mailboxes, calendars, and manual notes, parses it with AI, links it into trackable opportunities, and surfaces it to leadership as health, risk, and opportunity. It is live in production, used across a 30-carrier portfolio with four BD owners and four leaders.

This BRD documents the business requirements delivered to date, their acceptance status, and what is deferred.

## 2. Business context and problem statement

Before this system:

- Leadership visibility into airline accounts depended on BD logging in and narrating status. Reporting lag and telephone-game distortion were structural.
- Commercial discussions lived in email threads, calendar meetings, and individual memory. Nothing connected a discussion in June to the contract negotiation it fed in August.
- There was no shared object model: campaigns, incentives, fares, NDC work, and contract terms were discussed but not tracked as first-class items with owners, status, and value.
- Airline stakeholders were known to individuals, not to the organization.

The original brief required a system that captures, parses, links, views, and follows up, following the object model in Project Pipedrive v0.8, without behaving like a traditional CRM and without adding reporting burden to BD.

## 3. Business objectives

| # | Objective | Status |
|---|---|---|
| O1 | Leadership sees account reality without BD filing reports | Delivered |
| O2 | Commercial discussions become tracked objects with owners, status, and value | Delivered |
| O3 | Every tracked item carries lineage to the evidence behind it | Delivered |
| O4 | BD capture effort stays at or near zero | Delivered for email and calendar; manual form for the rest |
| O5 | Airline knowledge accumulates as an organizational asset | Partial: captured and linked; retrieval layer deferred |

## 4. Scope

### 4.1 In scope and delivered

- Portfolio overview with map, browse-by-BD, and selection scoping
- Mega update intelligence on the home surface (Coming, Happening, Happened)
- Opportunity and threat board with theme taxonomy, priority, status, and risk flags
- Contracts and financials tracking with pace and renewal risk
- Portfolio metrics rollup with BD attribution
- Airline profile workspace per carrier
- Stakeholder intelligence with influence scoring
- Email intelligence pipeline with AI clustering and quote-verified dollar impact
- Calendar integration
- Manual capture
- Authentication with leader and BD personas

### 4.2 Out of scope (deferred to later phases)

- WhatsApp capture and automatic meeting notes
- Resource registry (fares, commissions, incentives as objects)
- KPI/OKR registry linkage
- Airline Need profiles
- Cross-source Thread object (email threads exist; cross-meeting continuity does not yet)
- Stakeholder coverage map portfolio-wide
- Seat-level capacity data for quantified opportunities
- Semantic retrieval over captured knowledge
- Relational database migration

## 5. Stakeholders and personas

| Role | Users | Primary need |
|---|---|---|
| Leaders | Anuj Bansal, Shrey Nayar, PJ Zhou, Kirk Wong | Portfolio health, risk, stale work, ownership at a glance |
| BD, GCC and Levant | Praveen Das Kulangara | Own pipeline, account context, low-friction capture |
| BD, India | Dinit Mehta | Same |
| BD, KSA | Mohammad Nabil Dodin | Same |
| BD, Africa | Snehal Bagal | Same |

Access: single shared credential for v1. Per-user credentials and write audit are deferred.

## 6. Functional requirements delivered

Each requirement lists its acceptance evidence as delivered.

### 6.1 Portfolio overview

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-01 | Map view of all 30 accounts with selection by map click, dropdown, or BD | Map renders full portfolio; dropdown carries airline logos grouped by BD |
| FR-02 | Browse by BD: one click scopes the entire surface to that BD's carriers, with region refinement where a BD holds multiple regions | BD chips present; selecting Praveen and then CAUCASUS scopes to those carriers |
| FR-03 | Selection summary: carrier count plus cumulative YTD revenue, blended versus last year, and pax for whatever is selected | Summary card updates on every selection; coverage note names exactly which carriers have live metrics |
| FR-04 | Time intelligence for the selection: Coming, Happening, Happened, carrying mega updates only | Three tabs scoped to any selection; mega rule enforced |

### 6.2 Mega update rule and tracking

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-05 | Mega definition: dollar impact at or above $100K, or high priority, or strategic keyword (framework, go-live, mega-sale, marketing fund), or curated market intelligence | Rule implemented in signal engine; verified against all 72 captured records |
| FR-06 | Any mega update promotes to a tracked opportunity with one click, keeping the source thread reference, inheriting priority, with immediate visible confirmation | Promote tested end to end; confirmation chip renders instantly; failed writes roll back with a visible error |
| FR-07 | Each mega row expands to detail, the BD action item behind it, and the linked opportunity with its status controls | Expansion, action item, and linked-opportunity controls verified by click test |

### 6.3 Opportunity and threat board

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-08 | Opportunity object: airline, BD owner, theme tags, status, priority, maturity confidence, expected value, next action, due date | All fields live on 18 seeded records |
| FR-09 | Theme taxonomy from PJ's review of 450 BD meeting entries: 8 majors, 5 minor directions, applied to opportunities and auto-suggested on promotion | Taxonomy module delivered; auto-tagging verified on promote |
| FR-10 | Status vocabulary: Open, Won, Lost, Stalled, with explicit Won, Stall, Lost, Reopen controls wherever the item appears | Controls on board cards, on home rows, and on airline profile cards |
| FR-11 | Risk flags: stale (more than 14 days in one stage) and past due (dated event passed while still open), both floating items to the top | Flags implemented and seeded with real dates; 7.7 wrap-up closed as precedent |
| FR-12 | Threats tracked as first-class items alongside opportunities | Threat lane, live threat count, red accenting |
| FR-13 | Board sorting: priority first, then past due, then stale, then dwell | Sort implemented |

### 6.4 Contracts and financials

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-14 | Contract tracking: target, YTD flown, completion percentage | Contract table on workspace tab and per-airline stat tiles |
| FR-15 | Pace versus period elapsed, flagged on each contract | Up/down pace indicator on every row |
| FR-16 | Renewal risk: countdown to contract end, 90-day renewal window, revenue at risk rollup | Window count and at-risk totals on the tab header cards |
| FR-17 | Opportunities link to their account's contract | Contract chip with link/unlink on cards |

### 6.5 Metrics

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-18 | Portfolio rollup: total YTD, blended versus last year, pax, carrier coverage | Metrics tab |
| FR-19 | Revenue attributed by BD owner | Revenue-by-BD panel |
| FR-20 | Drill-through from portfolio to per-carrier dashboards | Carrier rows link to airline profile performance tab |
| FR-21 | Metrics computed from the transactional noSave CSV through the aggregator pipeline | Refresh documented and repeatable |

### 6.6 Airline profile

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-22 | Per-airline workspace with four tabs: Overview, Intel and Activity, Performance, People | All four tabs live per carrier |
| FR-23 | The airline's opportunities shown on its profile with dollar value tied to each action | Value displayed on the action line |
| FR-24 | Ownership hierarchy: global layer and local market layers with per-BD interaction counts | Hierarchy renders global to local with activity per layer |
| FR-25 | All evidence for the airline bucketed by theme from every source (email, market intel, calendar, manual), with a priority by theme matrix | Matrix and buckets verified on EK |
| FR-26 | Completed and past events surface as captured insights, not open work | Closed items marked "insight captured" |

### 6.7 People intelligence

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-27 | Stakeholder records: name, title, responsible area, Trip-side relationship owner, interaction volume | Records delivered for EK, SV, XY, F3, EY |
| FR-28 | Influence score with traits, movers, and approach, ranked by decision authority first and engagement volume second | Scoring delivered; scoring methodology stated on the panel |
| FR-29 | Org chart with reporting lines and Trip counterparts | Chart delivered for EK |
| FR-30 | Airlines without captured stakeholders show an explicit coverage gap, never fabricated data | Gap state renders for uncovered carriers |

### 6.8 Capture and parse pipeline

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-31 | Email capture per BD mailbox through Microsoft Graph, read-only enforced in code | Guardrail module raises on any non-GET or off-allowlist path |
| FR-32 | AI clustering of email threads into topics with leadership summaries, status, priority, and airline/Trip owners | Clustering pipeline delivered and run on live mail |
| FR-33 | Dollar impact extracted only when quote-verified against the exact source sentence; unverified figures dropped | Mechanical quote verification in the pipeline |
| FR-34 | Noise (out-of-office, scheduling, auto-replies) excluded at parse and filtered from every view | Noise dropped at the clustering prompt and again in the app layer |
| FR-35 | Calendar capture matched to airlines by attendee domain and name | Calendar pull delivered; real meetings landed and surfaced |
| FR-36 | Manual capture with one field for account, headline, detail, next step | Capture form on BD and airline surfaces |

### 6.9 Authentication and personas

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-37 | Leader and BD personas with role-based surfaces | Role routing on login |
| FR-38 | Airline detail views respect the viewing role for navigation | Back links role-aware |

## 7. Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-01 | Read-only discipline on mail and calendar access, enforced in code, not by convention | Delivered |
| NFR-02 | Dollar figures surfaced only when quote-verified; LLM output never trusted for money | Delivered |
| NFR-03 | Deployed with zero-downtime production hosting and instant rollback | Vercel production |
| NFR-04 | All application data version-controlled and auditable in git | Delivered (JSON store) |
| NFR-05 | Concurrent-write safety and relational integrity | Not delivered; JSON store limitation, see Section 11 |

## 8. Data requirements and sources

| Source | Grain | Status |
|---|---|---|
| noSave transactional CSV | Validating carrier x flight x booking, 39 carriers | Daily drop; refresh extends metric coverage |
| Outlook mail per BD | Thread level | Live for Anuj and Nabil; other BDs pending onboarding |
| Outlook calendar | Event level | Live for the leader mailbox |
| Market intelligence | Curated per airline | Live file |
| Participants | Airline person x Trip person x thread count | Extracted from mail |
| Stakeholders | Per person, curated with judgment scores | 5 airlines covered |
| Contracts | Per account | Seeded; registry pending |

## 9. Success metrics

| Metric | Target | Current |
|---|---|---|
| Leadership views of account state requiring a BD report | Zero | Zero for captured carriers |
| BD effort to capture email and calendar intelligence | Zero manual steps | Zero |
| Opportunities carrying full lineage (thread, contract, value, action) | 100% of tracked items | 100% of seeded items |
| Noise items reaching any leadership surface | Zero | Zero |
| Carrier metric coverage | 30 of 30 | 4 of 30, extends per refresh |
| Stakeholder coverage | 30 of 30 airlines | 5 of 30 |

## 10. Constraints and assumptions

- Data store is committed JSON served with the application. Write volume beyond single-user bursts requires the relational migration in Section 12.
- Mailbox onboarding requires a one-time device-flow authorization per BD.
- Influence scores are synthesized judgment until evidence-derived scoring is built. Leadership corrections are treated as ground truth and override any computed value.
- Due dates on opportunities are set at seeding. Extraction from thread content is deferred.
- Metric coverage depends on the daily CSV drop and refresh cadence.

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| JSON store under concurrent writes | Data loss or corruption at scale | Relational migration planned before write volume grows |
| Stakeholder scores drift from reality | Misdirected relationship effort | Scores carry methodology note; leadership overrides applied immediately |
| Mailbox onboarding stalls for remaining BDs | Partial intelligence coverage | Onboarding is a 10-minute device flow per person |
| Single shared credential | No per-user audit trail | Per-user auth in a later phase |

## 12. Deferred requirements (next phase)

In build order, each unblocking the next:

1. Cross-source Thread object. Typed parse, follow-up rules, and retrieval all need it.
2. Typed parse emitting object type (Resource, Insight, Need, Thread, Opportunity, Action) and proposed links.
3. Resource and KPI registries, then the Airline Need profile.
4. Evidence-derived stakeholder scoring and org-chart coverage portfolio-wide.
5. Seat-level capacity feed and value model for quantified opportunities.
6. Retrieval layer over captured knowledge.
7. Migration to a relational store.

## 13. Delivery record

| Milestone | Date |
|---|---|
| Fork created; map-driven leader view with updates, hierarchy, Gantt | August 2026 |
| Email intelligence pipeline: clustering, quote-verified dollars, per-BD onboarding | 7 August 2026 |
| Live redeploy after maintenance window; account hierarchy and signal strip | 18 August 2026 |
| Opportunity board with PJ theme taxonomy, dwell and stale mechanics | 20 August 2026 |
| Home rewired: selection-scoped mega updates in Coming/Happening/Happened | 20 August 2026 |
| Airline profile with theme buckets, priority matrix, stakeholder intelligence | 20 August 2026 |
| Linkage plumbing (thread, contract, value), past-due machinery, noise exclusion at source, calendar integration | 20 August 2026 |
| BRD and consolidated learnings document | 21 August 2026 |
