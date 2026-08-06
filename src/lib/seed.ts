// Seed updates + meetings — will be replaced by Lark bot ingest and
// Outlook calendar pull. Enough here to prove the leadership panel
// layout and hierarchy.

import type { UpdateRecord, MeetingRecord, ContractRecord } from "./store";

export const SEED_UPDATES: UpdateRecord[] = [
  {
    id: "u_ek_g_1",
    accountIata: "EK",
    createdBy: "praveen",
    createdAt: "2026-08-05T09:15:00Z",
    scope: "global",
    bd: "praveen",
    headline: "FY26-27 negotiation kick-off — EK signals 8% threshold uplift",
    detail: "QBR with EK VP Commercial. EK signaled early appetite for revised threshold; next meeting Aug 14 to review payout base incl. student-fare inclusion.",
    nextStep: "Send counterproposal by Aug 12; internal review Aug 11.",
  },
  {
    id: "u_ek_l_1",
    accountIata: "EK",
    createdBy: "snehal",
    createdAt: "2026-08-04T11:30:00Z",
    scope: "local",
    market: "UAE",
    bd: "praveen",
    isChild: true,
    parentOwner: "praveen",
    headline: "UAE POS — Q3 marketing plan approved by EK country team",
    detail: "$125K budget approved; campaign launch mid-Aug tied to summer schedule refresh.",
  },
  {
    id: "u_ey_g_1",
    accountIata: "EY",
    createdBy: "praveen",
    createdAt: "2026-08-05T14:00:00Z",
    scope: "global",
    bd: "praveen",
    headline: "Share recovery lagging — in-scope revenue -29% YoY",
    detail: "EY total up +40% but in-scope share bled 53%→24%. Recovery ladder proposal pending.",
    nextStep: "Present recovery ladder Aug 12.",
  },
  {
    id: "u_sv_g_1",
    accountIata: "SV",
    createdBy: "nabil",
    createdAt: "2026-08-05T08:00:00Z",
    scope: "global",
    bd: "nabil",
    headline: "SV coupon campaign ROI 3:1 vs 10:1 target",
    detail: "Underperformance driven by fare exclusion on booster corridors. Escalation to SV Head of Distribution scheduled.",
    nextStep: "Escalation call Aug 8.",
  },
  {
    id: "u_ai_g_1",
    accountIata: "AI",
    createdBy: "dinit",
    createdAt: "2026-08-05T10:20:00Z",
    scope: "global",
    bd: "dinit",
    headline: "AI merger integration — fare filing gaps flagged on DEL-DXB",
    detail: "Filing gaps persisting on high-vol corridor. AI Revenue VP acknowledged; fix ETA Aug 20.",
    nextStep: "Verify fix Aug 21.",
  },
];

export const SEED_MEETINGS: MeetingRecord[] = [
  { id: "m1", accountIata: "EK", when: "2026-08-14T09:00:00Z", attendees: ["EK VP Commercial", "Praveen"], agenda: "FY26-27 threshold + payout base", bd: "praveen" },
  { id: "m2", accountIata: "EY", when: "2026-08-12T11:00:00Z", attendees: ["EY VP Commercial", "Praveen"], agenda: "Recovery ladder pitch", bd: "praveen" },
  { id: "m3", accountIata: "SV", when: "2026-08-08T13:00:00Z", attendees: ["SV Head Distribution", "Nabil"], agenda: "Coupon ROI escalation", bd: "nabil" },
  { id: "m4", accountIata: "AI", when: "2026-08-21T10:00:00Z", attendees: ["AI VP Revenue", "Dinit"], agenda: "DEL-DXB filing fix verification", bd: "dinit" },
];

export const SEED_CONTRACTS: ContractRecord[] = [
  { accountIata: "EK", periodStart: "2026-04-01", periodEnd: "2027-03-31", targetUsd: 75_000_000, ytdFlownUsd: 71_400_000, updatedAt: "2026-08-05", source: "seed" },
  { accountIata: "EY", periodStart: "2026-04-01", periodEnd: "2027-03-31", targetUsd: 18_000_000, ytdFlownUsd: 12_400_000, updatedAt: "2026-08-05", source: "seed" },
  { accountIata: "QR", periodStart: "2026-04-01", periodEnd: "2027-03-31", targetUsd: 16_000_000, ytdFlownUsd: 15_200_000, updatedAt: "2026-08-05", source: "seed" },
  { accountIata: "SV", periodStart: "2026-04-01", periodEnd: "2027-03-31", targetUsd: 10_000_000, ytdFlownUsd:  8_700_000, updatedAt: "2026-08-05", source: "seed" },
  { accountIata: "MS", periodStart: "2026-04-01", periodEnd: "2027-03-31", targetUsd:  6_500_000, ytdFlownUsd:  5_400_000, updatedAt: "2026-08-05", source: "seed" },
  { accountIata: "AI", periodStart: "2026-04-01", periodEnd: "2027-03-31", targetUsd:  7_500_000, ytdFlownUsd:  6_800_000, updatedAt: "2026-08-05", source: "seed" },
];
