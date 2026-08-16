# Information Flow and Command Center Structure — discussion log

Captures the 2026-08-15/16 scoping exercise between Anuj and Claude. The live BRD on Lark is the source of truth; an appendix with the structure was appended there on 2026-08-16 (rev 202). This file records the reasoning, principles, and decisions behind that appendix so nothing is missed when we build.

## The problem we started from

- All information flow was Anuj-initiated. The team executes well but originates nothing.
- Proactiveness and forecasting were missing; action followed damage instead of avoiding it.
- Goal: proactiveness, structure to the chaos, full visibility, operational efficiency.

## Principles we settled

- Scope before solutioning. Structure first, building later.
- The structure must produce proactivity, not just capture it. The structure initiates (prompts, hunts, raises smoke); humans respond.
- Both opportunity and risk, never risk alone.
- No new forms. Read what people already produce; BD active input is an optional override.
- Anuj is prompted, and is fine being prompted.
- Two-sided contract: BDs push signals; Anuj stops floating ad-hoc forms and recurring questions become standing fields.
- Structure displaces repetition.

## The three flows

Information up. Decisions down. Commitments through.

## Intakes

- Bookings CSV (daily) into per-airline revenue, YoY, EU-APAC, pax, ticket value. Already running.
- Email bodies and attachments, clustered into topics with headline, dollar impact, next step, owners. Running for EK/EY/G9; widen to the region.
- The team's group chat (FBU_MEIN), the team's working conversation. Access proven.
- Playbook docs via the bot (BRD, Circle, carrier maps, campaign and QBR sheets). Already readable.
- Parked for later: company-wide KB search and the AI Notes minutes, blocked on approvals.

## Shared brain (FBU-wide)

Every item tagged by airline, global or local, zone, region, bucket B1 to B16. Nothing gated at the door. The brain cleans itself (dedup, decay, conflict) and correlates one zone's signal into another zone's flag.

## Account state, as a tree

Each airline is a tree: a global node (contract, target, fund, HQ contacts, owner) with local nodes under it (per-country revenue, activation, local owner). This tree is the baseline smoke measures against.

## Playbook to application

The playbook (docs plus email plus group) is what the hunting layer reads to write the application for an opportunity.

## Smoke and hunting

- Smoke: drift against the account tree at the global or local level, shaped as drift plus intervention plus owner. Produced by synthesis and by BD flags.
- Hunting: opportunity plus application plus owner, routed to the BD's tab and the leader console at once.

## Surfaces

- Leader console, five views: airline as tree, BD, opportunities, smoke, cross-zone.
- BD tabs, four: signals, opportunities, commitments, state, direction.
- OBL digest: the morning push.

## Access model

- Anuj (project admin), Shrey, Kirk Wong: full leadership view across all regions, accounts, and BDs, and can open any BD's tab. Kirk's access replicates Shrey's.
- Praveen, Snehal, Nabil, Dinit: their own full BD tab for their zone.
- Dinit also gets an India leadership slice.

## Closing the loop

Decisions captured with what and why, feed the brain, become the direction. Commitments form in the 1:1, are tracked, progress read from activity not self-reported. A missed 1:1 is made visible.

## Gaps we closed

Cross-zone correlation lives in the brain. Commitment status inferred from activity. First-mile participation is a rollout track, not runtime. Brain hygiene deferred to scale. Tuesday weekly consumes the cross-zone roll-up. Goodhart guard: assess outcomes not signal volume. Substantive threshold learned from decision closure.

## Build phasing and realistic estimate

- Phase 1, about 2 to 3 weeks: restore the app, widen intake to the region, account tree, four BD tabs, role-scoped access.
- Phase 2, about 2 to 3 weeks: brain curation and cross-zone correlation, smoke, hunting with application, OBL digest.
- Phase 3, about 2 weeks: decision closure, the prompts, direction emergence, commitment layer.
- First credible version in roughly 6 to 8 weeks of active build; the forecasting payoff lags by the data-maturation window, so plan on about a quarter to feel it.

## BD email sync scoping

- Who: the four contributors, phased, one volunteer first.
- What: carrier-domain mail only, never the whole inbox.
- Consent: per-BD, read-only, opt-in.
- Feeds: their own tab and the shared brain, tagged to their zone.

## Already built versus new

Already running in this repo: the bookings pipeline, the email engine, the org chart, the leader console shell, per-account and per-BD drilldowns. New: widen intake to the region plus Feishu, wire the B1 to B16 tags, smoke and hunting, the direction and decision and commitment loops, the five-view regroup, and the role-scoped access.
