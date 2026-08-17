# EY two-layer account view + build state check (2026-08-17)

Companion to `information-flow-command-center.md`. Records the critical
global/local account sketch and a state check against the three-phase plan.

## The EY account page, two layers

One airline, two layers, not two accounts. Etihad is a tree: a global node
Praveen owns (HQ contract, global target, NDC, strategic relationship) with a
KSA local node under it that Nabil owns (ticketing authority, local sales setup,
Saudi office relationship, local campaigns).

```
+---------------------------------------------------------------+
| [EY] Etihad Airways          global owner: Praveen            |
| combined: YTD $34.9M · EU-APAC $22.1M · vLY -16.7%            |
| tree:  GLOBAL > KSA-local                                     |
+---------------------------------------------------------------+
| GLOBAL LAYER · Praveen                                        |
|   contract: global NDC + performance agreement · target $X    |
|   intel (12): NDC integration · fare undercutting · marketing |
|               invoicing · IATA & distribution                 |
|   smoke: fare undercutting & marketplace governance           |
+---------------------------------------------------------------+
| LOCAL LAYER · KSA · Nabil                                     |
|   ticketing authority: in progress · local sales setup: live  |
|   intel (1): Etihad ticket sales setup & operations           |
|   smoke: none yet                                             |
|   ^ raises a flag to GLOBAL when it needs HQ leverage         |
+---------------------------------------------------------------+
| (more local nodes appear as onboarded: AE, ...)               |
+---------------------------------------------------------------+
```

Role views:
- Leader (Anuj/Shrey/Kirk): both layers, combined number on top, each layer's
  intel and smoke beneath.
- Praveen: global layer as his, local layers visible as context feeding his
  global picture.
- Nabil: his KSA layer as his, global layer above as the frame he executes in.

Cross-layer mechanic (two arrows):
- A local smoke (KSA ticketing authority stuck) raises a flag on the global
  layer, because only Praveen has HQ leverage.
- A global decision (contract or fund change) posts down as context to the
  local layer so Nabil knows his envelope changed.
Same account, one combined number, two owners, linked intel.

## State check vs three-phase plan

Built and working (on branch):
- Map: full portfolio, region person-chips, zoom-to-detail, logo dropdown,
  side panel follows selection, zoom control fixed, avatar wiring (initials).
- Role-scoped access (leaders full, BD own); login fixed (onebiz2026).
- Email: per-user pull (Anuj + Nabil), read-only guardrail, relationship-owned
  attribution, per-owner storage, no clobber. Nabil feed live.
- Knowledge access: minutes + company-wide KB read cleanly.
- Account tree + attribution at data level; EY two-layer proven in data.
- Docs: BRD appendix, structure doc.

Gaps by phase:
- Phase 1 remainder: BD tabs still thin; nothing deployed (branch only); new
  carriers' metrics need `npm run refresh`; a few logos missing; real faces need
  headshots.
- Phase 2 (all): brain curation + cross-zone/cross-layer correlation, smoke
  synthesis, hunting + application, OBL digest.
- Phase 3 (all): decision closure, prompts, direction emergence, commitment
  layer off the 1:1.
- New: EY two-layer console view (sketched, not built); knowledge access proven
  but not piped into continuous repo feeds.

Shape: we built the eyes; the brain (synthesis) is still to come.

## Since this check (2026-08-17, later)

- Account hierarchy is now a STORED structure: `Account.layers` in
  `src/lib/users.ts` (global node + local nodes), via `layersFor()`. EY and QR
  carry `GLOBAL: praveen` + `KSA: nabil`. The account page renders an
  "Ownership layers" section, splitting inbox intel by layer owner.
- Map: clicking a BD+Region person-chip now updates the side pane with that
  BD's details synced from the inbox (`BdSide`), alongside the airline view.
- So the earlier gap "EY two-layer console view (sketched, not built)" is now
  built for EY/QR; other accounts default to a single global layer until a
  local layer is added to their `layers`.
