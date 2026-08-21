# Project OneBiz — V1 Current Draft

> This version consolidates the discussion so far, following the structure of Project Pipedrive v0.8. Principle: do not rebuild from zero; continue iterating incrementally.

## 1. Project Objective

Project OneBiz is not intended to be a traditional CRM. It is a working and knowledge system designed for Airline BD to:

- Capture information generated through interactions with airlines;
- Use AI to parse unstructured inputs into reusable information assets;
- Link information to existing objects such as Airline, POS, Stakeholder, commercial resources, and KPI/OKR;
- Identify Insights, Needs, Threads, Opportunities, and follow-up Actions from those interactions;
- Turn individual knowledge and fragmented communication into organizational assets over time.

Core principle: **Never think from zero twice.**

Five principles were added by building:

1. **Airline work is multi-theme.** One carrier runs campaigns, incentives, fares, NDC, contracts and QBRs in parallel. The pipeline is therefore a tagged board with status and maturity — not a deal-stage funnel.
2. **A meeting is not an opportunity.** Classification requires commercial substance; neutral facts are information, not pipeline.
3. **Noise is excluded, never prioritized.** Out-of-office and scheduling chatter that receives a priority becomes fake work. It is dropped at the source.
4. **Authority outweighs volume.** A stakeholder's value to a discussion is decision weight, not thread count. Titles without observed leverage score low.
5. **The link is the product.** Text on a card is not linkage. An item must carry its thread, its contract, its action and its value — otherwise it is just a note.

---

## 2. Core Flow

The overall workflow is defined as:

**Capture → AI Parse → Link → View → Follow-up**

### 2.1 Capture

Capture sources and their current state:

- Airline meetings — captured from calendar automatically;
- Day-to-day conversations — manual input form, one field, low friction;
- Email — captured automatically per BD mailbox and clustered;
- WhatsApp — not yet covered;
- BD Calendar — covered via Graph for the leader mailbox; per-BD calendars pending;
- Other internal system inputs — future.

Capture minimizes BD effort: email and calendar land without any manual organization.

### 2.2 AI Parse

AI parses raw captured content and identifies different types of information, rather than simply generating a meeting summary.

The object types remain: Resource / Commercial Resource; Insight / Intelligence; Airline Need; Thread; Opportunity / Lead; Potential Action Item.

Current state: parse produces topics with one-line leadership summaries, quote-verified dollar impact, status, priority, and airline/Trip owners. Noise threads are dropped entirely at this stage. Typed classification of each item into the object list above is the next iteration.

### 2.3 Link

"Link" means more than saving information under an Airline Profile. The system should determine whether a piece of information can be directly linked to an existing business object in the production environment.

Links that exist today:

- An email thread promotes into an Opportunity and keeps its thread reference;
- An Opportunity links to its account's Contract;
- Every item is tagged against the theme taxonomy (campaigns, rebates/commissions, fares, airline internal developments, NDC/systems, contracts/clauses, QBR, marketing funds, plus five minor directions);
- Accounts carry ownership hierarchy — a global owner and local market owners;
- Calendar events are matched to airlines by attendee domain and name;
- Airline stakeholders are tied to Trip counterparts with interaction volume.

Links that do not exist yet: a specific incentive under discussion, a specific fare resource, an existing KPI/OKR. These require registries of those objects — see Section 7.

The core idea of "Link" is unchanged:

> **Connect information generated from a conversation back to real objects in the business world.**

---

## 3. Information Objects

### 3.1 Resource

Represents resources that can directly support production or commercial cooperation — fares, commissions, backend incentives, campaign resources, other airline commercial support. Where possible, Resources should be linked to actual production or commercial data objects rather than existing only as text records.

Current state: not yet an object. Incentives and fares exist as text inside opportunities. A Resource registry is needed before link can point at real resources.

### 3.2 Insight / Intelligence

Information obtained from airline interactions that may influence future decisions. It does not necessarily require immediate action, but should become part of the airline knowledge base and be retrievable when relevant in future contexts.

Current state: market intelligence and parsed insights surface in the coming/happening/happened views and in the airline profile buckets. They are not yet a persisted, searchable asset — retrieval is the open half of this object.

### 3.3 Need

Records explicit or implicit needs expressed by an airline. Needs can be structured through tags and categories and accumulated over time to form an airline-level need profile.

Current state: not built. No need profile accumulates per airline yet.

### 3.4 Thread

A Thread is an ongoing business discussion that requires continuity, but does not necessarily constitute an Opportunity yet. A Thread can continue across multiple meetings and conversations, accumulate new information over time, link to multiple stakeholders, develop into an Opportunity, and generate specific action items.

Current state: clustered email topics function as threads within email — they carry thread counts, lifecycle status and airline/Trip owners. A cross-source Thread object does not exist yet: a discussion that moves from email into a meeting starts a new, unlinked item. This is the first build priority, because it unblocks continuity, follow-up discipline, and retrieval.

### 3.5 Opportunity / Lead

Opportunity / Lead is related to Thread, but is treated as a dedicated object rather than being mixed into generic capture content. The relationship is represented as:

**Conversation → Thread → Opportunity → Task / Action**

Current state: built. Opportunities carry theme tags, status (open / won / lost / stalled), priority (P1–P3), maturity confidence, dollar value tied to the action, a due date with past-due flagging, and links to the originating thread and the account's contract. Not every thread must become an opportunity, and not every action needs to originate from an opportunity.

---

## 4. Airline Profile

The Airline Profile is not merely a static airline information page. It is the business workspace for that airline.

### 4.1 Basic Airline Information

Airline identity, headquarters, region, market/POS coverage through ownership layers (global owner plus local market owners), and performance metrics where data coverage exists. Metric coverage currently spans 4 of 30 carriers and extends with each data refresh.

### 4.2 Stakeholders / Contacts

The system captures key airline contacts: name, title/role, responsible area, relationship owner on the Trip side, and interaction volume from email threads.

Each stakeholder carries an influence score with traits, movers and approach notes. The score is currently synthesized judgment; it must become evidence-derived — who sets terms, who signs off, counterpart seniority — rather than curated. Stakeholder coverage exists for 5 airlines; the remaining portfolio shows an explicit coverage gap rather than fabricated data.

### 4.3 Airline Org Chart

Contacts do not exist only as a flat contact list. The org chart represents internal organizational relationships within the airline, seniority and hierarchy, reporting lines, and Trip.com counterparts at each level.

Current state: seeded for one airline. The coverage lens — which key stakeholders are currently covered by Trip.com — is not built yet and is the foundation for relationship management.

---

## 5. From Information to Action

The system does not automatically convert every identified piece of information into a Task. Different information objects have different lifecycles:

- Resource → Link to production / commercial resources;
- Insight → Retain and surface again in relevant future contexts;
- Need → Build the Airline Need Profile;
- Thread → Track continuously;
- Opportunity → Drive commercial progression;
- Action Item → Enter the execution layer.

Current state: opportunities drive actions with dollar values attached; dated events that pass are flagged for closure; completed events surface as captured insights rather than open work. Follow-up generation itself is still manual — the rules above are the design target for automation.

The role of AI is therefore not simply to "automatically create Tasks," but to determine:

> **What is this information, where should it be linked, and does it require an action next?**

---

## 6. Structuring and View

The view layer is structured in three surfaces:

- **Overview (home)** — the portfolio map with browse-by-BD, a selection scope (portfolio, BD, BD + region, or account) driving cumulative uber-metrics, and three time tabs — Coming, Happening, Happened — carrying mega updates only. Each row expands to its detail, the BD action item behind it, and the linked opportunity with its status controls.
- **Workspace** — Opportunities & Threats (the tagged board with priority, status actions, thread and contract links), Activity, Contracts & Financials, Metrics.
- **Airline Profile** — Overview (opportunity value tied to action, ownership hierarchy with BD interaction), Intel & Activity (all evidence sources bucketed by theme with a priority × theme matrix), Performance, People.

---

## 7. Database Needs

The current store is file-based JSON, version-controlled and served directly. It works at current volume and carries no concurrent-write safety, no relational integrity, and no history.

What the object model requires as it matures:

- A relational store with integrity across objects and an audit trail;
- First-class tables for Resource, Need, Thread, and stakeholder events;
- A Contract registry — real terms, renewals and clauses that opportunities link into;
- A KPI/OKR registry that intel can link to;
- Capacity and seat-level data feeds, so quantified opportunities rest on inventory math rather than estimated yield;
- An event log recording what changed, when, and by whom.

---

## 8. Gaps and Uncovered Use Cases

Use cases from the original brief that are not yet covered, and what each needs:

1. **Typed classification at parse** — each capture identified as Resource, Insight, Need, Thread, Opportunity or Action rather than a generic topic. Needs: the parse step extended to emit object type and proposed links.
2. **Link to concrete production objects** — a specific incentive, fare resource, or KPI/OKR. Needs: Resource and KPI registries.
3. **Airline Need Profile** — needs accumulated over time per airline. Needs: the Need object and a profile view.
4. **Thread continuity across meetings** — one discussion, many touches across email, meetings and manual input. Needs: the cross-source Thread object; the first build priority.
5. **Stakeholder coverage map** — which key airline stakeholders Trip.com actually covers. Needs: org-chart seeds portfolio-wide and a coverage lens.
6. **Quantified opportunity generation** — capacity math producing defensible dollar values. Needs: seat-level inventory and a yield model.
7. **Follow-up discipline** — the right actions created per object type, not everything turned into tasks. Needs: the lifecycle rules of Section 5 implemented.
8. **Organizational memory** — captured knowledge retrievable in future contexts. Needs: retrieval across threads, insights and digests, surfaced when an airline or theme comes up again.
9. **WhatsApp and meeting-notes capture** — ingestion beyond mail and calendar.

---

## 9. What Is Needed Next

In build order, each step unblocking the next:

1. The cross-source Thread object — the spine of continuity, follow-up and retrieval;
2. Typed parse emitting object type and proposed links;
3. Resource and KPI registries, then the Need profile;
4. Evidence-derived stakeholder scoring and org-chart coverage portfolio-wide;
5. Capacity feed and value model for quantified opportunities;
6. The retrieval layer that delivers "never think from zero twice";
7. Migration to a persistent relational store before write volume outgrows files.
