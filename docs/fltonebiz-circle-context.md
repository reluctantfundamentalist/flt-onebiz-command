# Flt OneBiz Circle — context notes (2026-08-12)

Not a dev spec. Context for when we pick this up again: where the ask evolved, what got merged where, and the access quirks that cost time.

## The evolving ask

1. Started as the BD-intelligence BRD: BD pastes unstructured meeting notes, the engine turns them into structured account records (compartments C1–C11, triggers, contact map). Live source of truth: [Flt OneBiz Command — BRD](https://trip.larkenterprise.com/docx/MOgedf0MwoTS6mxMjIccdNnBn5g). The old v0.1/v0.2 BRD in this folder (`BRD_FltOneBiz_BD_Intelligence.md`) is superseded by that live doc.
2. Anuj's next ask: fit the BRD's unstructured-intel flow into Carrie Yan Wang's airline metrics framework, so the two complete one circle. Metrics doc: [Airline Account Key Metrics](https://trip.sg.larkenterprise.com/docx/J73Bd74q6oo4PZxAr6wlZxEHgFg). Five sessions: Strategic Value, Commercial Assets, Supply Health, Business Performance, Opportunity & Risk. Body stops mid Session 2 (at Marketing Fund / Remaining Balance); sessions 3–5 were headings only.
3. Resolution: a new merged doc rather than editing Carrie's. Created 2026-08-12: [Flt OneBiz Circle — Airline Account Key Metrics × BD Intel](https://trip.larkenterprise.com/docx/T2rkd6RT3oLBMrxn3mHcnk9Znpr) (main tenant, bot-owned, tenant link-editable). Structure: circle diagram → six sessions (1–3 keep Carrie's metrics + "field intel feeding this session" tables; 4 and 5 built out; new 6 "Intel flow & proof") → B1–B16 glossary → engine appendix (compartments, triggers, contacts, inputs S1–S6, EK worked example).

The one-line thesis: doc2 is the WHAT (metrics per account), the BRD is the WHY and WHAT-NEXT (structured intel + routing). Every bucket of field intel lands next to the metric it moves; every metric alert ships with its reason attached.

## Key links

| What | Where |
|-|-|
| BRD (doc1, source of truth) | trip.larkenterprise.com/docx/MOgedf0MwoTS6mxMjIccdNnBn5g |
| Airline Account Key Metrics (doc2) | trip.sg.larkenterprise.com/docx/J73Bd74q6oo4PZxAr6wlZxEHgFg |
| Flt OneBiz Circle (merged) | trip.larkenterprise.com/docx/T2rkd6RT3oLBMrxn3mHcnk9Znpr |
| Demo render referenced in doc2 | airline-dashboard.html (Carrie, numbers indicative) |
| Desktop copy of the original fit proposal | ~/Desktop/Airline_Key_Metrics_Intel_Fit_Proposal.md |

Token gotcha: the doc2 link Anuj first pasted had `Ar6nl` instead of `Ar6wl`. If that URL ever 404s, suspect the wl/nl swap before anything else.

## Bucket set B1–B16 (closed set)

B1 pricing & fee changes · B2 incentives & contract moves · B3 network & capacity · B4 distribution & payments · B5 strategy & people · B6 performance explainers · B7 opportunity & threat · B8 campaign & promo collaboration · B9 payment/settlement & disputes (ADM) · B10 content & product · B11 ops & service quality · B12 regulatory & geopolitical · B13 demand & seasonality · B14 airline financial health · B15 platform & integration issues · B16 booking discipline & compliance.

Session mapping in short: B1→S2-B/S3-B · B2→S2-A/C + S1 payout · B3→S3-A + S1 · B4→S3-C/D · B5→S1 + contact map · B6/B11/B13→S4 · B7/B9/B12/B14→S5 · B8→S2-C · B10→S2-D · B15→S3-C/D · B16→S2-B. Whatever fits none goes to C11 Unclassified.

The bucket set and the session mapping still need BD Ops sign-off (BRD §10 list).

## Access learnings (SG tenant)

- The lark-cli bot app (cli_aaadb49e37f8dce1) is bound to the main tenant only. Anything on trip.sg.larkenterprise.com is invisible to it; WebFetch hits a login redirect.
- Working route: the iClaw browser relay (gateway.mjs at ~/projects/iclaw-cdp/, facade :8090) driving Anuj's logged-in Chrome. Start the gateway on demand; close tabs via /close when done.
- Lark docx pages virtualize: scroll `.bear-web-x-container` incrementally and accumulate innerText, or you only get the first viewport.
- Drive list rows carry no href/token attributes. Pull the file record out of React internals: `__reactInternalInstance$*` (old React, not `__reactFiber$`), walk `.return` until memoizedProps contains the file object with the real URL/token.
- Old React quirks aside, `docs +fetch/+update` remain the tool for the main tenant; append/block_insert only on live docs, never overwrite.

## State of the surrounding pieces

- Both Vercel apps (flt-onebiz-command, flt-onebiz) are OFFLINE since 2026-08-11 behind a maintenance page. Restore = `vercel --prod` from this repo. Nothing was deleted.
- Metric spine for Session 4 = the daily noSave CSV aggregates (revenue, segments, pax, share, paid seat/bag/meal segments; grain: validating carrier × countrypair × class × brand), same feed this repo's aggregator already uses.
- Email intelligence pipeline (graph_pull.py + cluster_topics.py) is the proven engine the Circle doc references; dollarImpact is quote-verified mechanically after the $1.62B hallucination incident.

## Open threads for next time

- Mirror the Circle doc to the SG tenant if the team wants it next to Carrie's doc (browser relay or manual move).
- BD Ops sign-off: bucket set B1–B16, session mapping, trigger→team routing table.
- Wire the B buckets into the parser's tag set so parsed intel carries its bucket label end-to-end.
- Session 4 spine columns: confirm they mirror Carrie's airline-dashboard.html field list before we surface them side by side.
