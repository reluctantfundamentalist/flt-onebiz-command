# Project OneBiz: V1 Current Draft

> Consolidates the discussion so far, following the structure of Project Pipedrive v0.8. Do not rebuild from zero. Iterate.

## 1. Project Objective

OneBiz is not a traditional CRM. It is a working and knowledge system for airline BD, and it exists to do five things:

- Capture information generated through interactions with airlines;
- Use AI to parse unstructured inputs into reusable information assets;
- Link information to existing objects such as Airline, POS, Stakeholder, commercial resources, and KPI/OKR;
- Identify Insights, Needs, Threads, Opportunities, and follow-up Actions from those interactions;
- Turn individual knowledge and fragmented communication into organizational assets over time.

PJ's principle is about reuse: never think from zero twice. This project starts one step earlier. The work has already happened. It sits in an email thread, on a calendar, in the meeting that ended last Tuesday, in the 96 premium seats that did not sell. The system's job is to read that work, weigh it, and connect it. Leadership sees what happened, not what somebody remembered to report.

Core principle: **the work already exists. If a BD has to file a report before leadership can see it, the design has failed.**

Each of the five principles below came from getting something wrong:

1. **Airline work is multi-theme.** The first version ran on a deal-stage funnel and broke almost immediately. Emirates was running loyalty, VCC payments, incentives, and a premium-economy upsell at the same time. One carrier carries campaigns, incentives, fares, NDC, contracts, and QBRs in parallel. So the pipeline became a tagged board with status and maturity, not stages.
2. **A meeting is not an opportunity.** Early boards filled up with "met VP" entries that went nowhere. Classification now demands commercial substance. Neutral facts stay information and never enter the pipeline.
3. **Noise is excluded, never prioritized.** An out-of-office cluster once surfaced as a low-priority active topic. That made it fake work somebody could pick up. Noise is now dropped at the source, before priority can touch it.
4. **Authority outweighs volume.** A commercial manager with twelve threads turned out to be a clerk with no decision weight. The people who actually moved terms had fewer threads and more authority. Stakeholder scoring now starts from observed decision weight and uses volume second.
5. **A card without lineage is a note.** "Backend incentive extension" typed onto a card is text. The same card carrying its source thread, its contract, its due date, and the dollar value tied to its next action is an asset.

---

## 2. Core Flow

PJ's flow stays the frame: Capture → AI Parse → Link → View → Follow-up. The pipeline built here runs it like this:

**Ingest → Parse & Structure → Classify → Filter → Scope & Surface → Track & Link → Act & Close**

### 2.1 Ingest

Five sources flow in with no BD effort:

- Email, per BD mailbox, behind a read-only guardrail;
- Calendar, matched to airlines by attendee domain and name;
- Market intelligence, curated;
- Manual input, one field;
- Metrics, transactional CSV aggregated per carrier.

WhatsApp is the gap.

### 2.2 Parse & Structure

Email threads cluster into topics. Each topic carries a one-line summary for a leadership reader, a dollar impact verified against the exact sentence where the figure appears, lifecycle status, priority, and owners on both sides. Noise is dropped at this stage and never becomes a topic, so it never receives a priority.

### 2.3 Classify

Every item is tagged against the theme taxonomy (eight majors, five minor directions), typed as opportunity, threat, or neutral information, and weighted P1 to P3.

### 2.4 Filter

The leadership surface carries mega updates only: dollar impact of $100K or more, high priority, a strategic keyword (framework, go-live, mega-sale, marketing fund), or curated market intelligence. Everything else stays in the working feed, off the leadership glance.

### 2.5 Scope & Surface

The full book, one BD, one BD plus region, or a single account: any slice drives the same engine and produces cumulative metrics with three time views, Coming, Happening, Happened. The airline profile buckets all evidence by theme, with a priority × theme matrix on top.

### 2.6 Track & Link

Any mega update promotes into an opportunity and keeps its source thread. The opportunity links onward: the account's contract, theme tags, dollar value, due date. The chain from conversation to thread to opportunity survives as references, not as restated text.

The chain stops where real objects are missing. A specific incentive under discussion, a fare resource, a KPI: none of these exist as registries yet (Sections 7 and 8).

### 2.7 Act & Close

Status controls sit wherever the item appears: Won, Stall, Lost, Reopen. Priority cycles on touch. Dated events that pass get flagged for closure. Anything dwelling in one stage beyond fourteen days gets flagged stale. Every action shows the dollar value tied to it.

Then the loop closes. The action produces meetings and emails, which return to Ingest.

---

## 3. Information Objects

### 3.1 Resource

Fares, commissions, backend incentives, campaign resources, other airline commercial support. Where possible a Resource links to an actual production or commercial data object rather than existing as text.

Status: not yet an object. Incentives and fares live as text inside opportunities today. Link needs a Resource registry before it can point at real resources.

### 3.2 Insight / Intelligence

Information from airline interactions that may influence future decisions. It does not require immediate action, but it belongs in the airline knowledge base, retrievable when relevant later.

Status: partial. Market intelligence and parsed insights surface in the time views and the profile buckets. They are not yet persisted as a searchable asset. Retrieval is the open half.

### 3.3 Need

Explicit or implicit needs expressed by an airline, structured through tags and accumulated over time into an airline-level need profile.

Status: not built. Nothing accumulates per airline yet.

### 3.4 Thread

An ongoing business discussion that needs continuity but does not yet constitute an Opportunity. A Thread continues across meetings and conversations, accumulates information, links stakeholders, can develop into an Opportunity, and can generate action items.

Status: half built. Clustered email topics function as threads within email: they carry thread counts, lifecycle status, and owners on both sides. A cross-source Thread does not exist. A discussion that moves from email into a meeting starts a new, unlinked item. Build this first: the follow-up engine and the retrieval layer both depend on it.

### 3.5 Opportunity / Lead

Related to Thread, kept as a dedicated object rather than mixed into generic capture:

**Conversation → Thread → Opportunity → Task / Action**

Status: built. Opportunities carry theme tags, status (open / won / lost / stalled), priority P1 to P3, maturity confidence, a dollar value tied to the action, a due date with past-due flagging, and references to the originating thread and the account's contract. Not every thread must become an opportunity, and not every action needs to originate from one.

---

## 4. Airline Profile

The profile is the business workspace for that airline, not an information page.

### 4.1 Basic airline information

Identity, headquarters, region, market/POS coverage through ownership layers (a global owner plus local market owners), and performance metrics where data exists. Metric coverage spans 4 of 30 carriers today and extends with each refresh.

### 4.2 Stakeholders / contacts

Name, title, responsible area, Trip-side relationship owner, and interaction volume from email threads. Each stakeholder also carries an influence score with traits, movers, and approach notes.

The score is synthesized judgment today, and it has already been wrong once: a high-volume contact scored high until the ground truth said clerk. It must become evidence-derived, from who sets terms, who signs off, and counterpart seniority. Coverage exists for 5 airlines. The rest of the portfolio shows an explicit coverage gap rather than fabricated data.

### 4.3 Org chart

Reporting lines, seniority, hierarchy, and Trip.com counterparts at each level, not a flat contact list.

Status: seeded for one airline. The coverage lens, meaning which key stakeholders Trip.com actually covers, is not built yet. Relationship management sits on top of it.

---

## 5. From Information to Action

Not every piece of identified information becomes a Task. Objects have different lifecycles:

- Resource: link to production / commercial resources;
- Insight: retain and surface again in relevant future contexts;
- Need: build the airline need profile;
- Thread: track continuously;
- Opportunity: drive commercial progression;
- Action item: enter the execution layer.

Today: opportunities drive actions with dollar values attached. Dated events that pass get flagged for closure. Completed events surface as captured insights, not open work. Follow-up generation is still manual. The rules above are the design target for automation.

The role of AI is not to create tasks automatically. It is to answer one question:

> **What is this information, where should it be linked, and does it require an action next?**

---

## 6. Structuring and View

Three surfaces.

Overview (home) carries the portfolio map with browse-by-BD. A selection scope (portfolio, BD, BD + region, account) drives cumulative metrics and the three time tabs, Coming, Happening, Happened, mega updates only. Each row expands to its detail, the BD action item behind it, and the linked opportunity with status controls.

Workspace carries four tabs: Opportunities & Threats (the tagged board with priority, status actions, thread and contract links), Activity, Contracts & Financials, Metrics.

The Airline Profile carries four tabs: Overview (opportunity value tied to action, ownership hierarchy with BD interaction), Intel & Activity (every evidence source bucketed by theme, priority × theme matrix), Performance, People.

---

## 7. Database Needs

The store is file-based JSON, version-controlled, served directly. It works at current volume. It has no concurrent-write safety, no relational integrity, and no history.

What the object model needs as it matures:

- A relational store with integrity across objects and an audit trail;
- First-class tables for Resource, Need, Thread, and stakeholder events;
- A Contract registry: real terms, renewals, and clauses that opportunities link into;
- A KPI/OKR registry that intel can link to;
- Capacity and seat-level feeds, so quantified opportunities rest on inventory math instead of estimated yield;
- An event log: what changed, when, and by whom.

---

## 8. Gaps and Uncovered Use Cases

From the original brief, what is not yet covered, and what each needs:

1. Typed classification at parse. Each capture identified as Resource, Insight, Need, Thread, Opportunity, or Action instead of a generic topic. Extend the parse step to emit object type and proposed links.
2. Links to concrete production objects: a specific incentive, a fare resource, a KPI/OKR. Build the Resource and KPI registries.
3. Airline need profile, accumulated over time per airline. Build the Need object and a profile view.
4. Thread continuity across meetings. One discussion, many touches across email, meetings, and manual input. Build the cross-source Thread object. First priority.
5. Stakeholder coverage map: which key airline stakeholders Trip.com actually covers. Seed org charts portfolio-wide and add a coverage lens.
6. Quantified opportunity generation: capacity math producing defensible dollar values. Seat-level inventory and a yield model.
7. Follow-up discipline: the right actions per object type, not everything turned into tasks. Implement the lifecycle rules of Section 5.
8. Organizational memory: captured knowledge retrievable in future contexts. Retrieval across threads, insights, and digests, surfaced when an airline or theme comes up again.
9. WhatsApp and meeting-notes capture. Ingestion beyond mail and calendar.

---

## 9. What Is Needed Next

In build order. Each step unblocks the next.

1. The cross-source Thread object. Build it first. Typed parse, follow-up rules, and retrieval all need it.
2. Typed parse emitting object type and proposed links.
3. Resource and KPI registries, then the Need profile.
4. Evidence-derived stakeholder scoring and org-chart coverage portfolio-wide.
5. Capacity feed and value model for quantified opportunities.
6. The retrieval layer. That is what delivers PJ's principle.
7. Migration to a persistent relational store before write volume outgrows files.
