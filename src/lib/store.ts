// JSON-file backed store. Simple in v0 — replace with Turso when data
// volume matters. All writes go through this module so the swap is a
// one-file change later.

import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "src", "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, value: T): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(value, null, 2), "utf-8");
}

// ── Updates ──

export interface UpdateRecord {
  id: string;
  accountIata: string;
  createdBy: string;      // user id or "graph_pull_llm"
  createdAt: string;      // ISO
  scope: "global" | "local";
  market?: string;
  meetingDate?: string;
  bd: string;
  headline: string;
  detail: string;
  dollarImpact?: { amountUsd: number; note: string } | null;
  nextStep?: string | null;
  isChild?: boolean;
  parentOwner?: string;
  // LLM-clustered topic extensions
  status?: "active" | "in_progress" | "dormant" | "closed";
  priority?: "high" | "medium" | "low";
  airlineOwners?: string[];
  tripOwners?: string[];
  threadCount?: number;
  source?: string;
}

export async function listUpdates(): Promise<UpdateRecord[]> {
  return readJson<UpdateRecord[]>("updates.json", []);
}

export async function writeUpdates(all: UpdateRecord[]): Promise<void> {
  await writeJson("updates.json", all);
}

// ── Meetings (pulled from Outlook later) ──

export interface MeetingRecord {
  id: string;
  accountIata: string;
  when: string;                // ISO
  attendees: string[];
  agenda: string;
  outcome?: string;
  nextStep?: string;
  bd: string;                  // user id
}

export async function listMeetings(): Promise<MeetingRecord[]> {
  return readJson<MeetingRecord[]>("meetings.json", []);
}

export async function writeMeetings(all: MeetingRecord[]): Promise<void> {
  await writeJson("meetings.json", all);
}

// ── Contracts (period + completion tracking) ──

export interface ContractRecord {
  accountIata: string;
  periodStart: string;         // ISO date
  periodEnd: string;           // ISO date
  targetUsd: number;
  ytdFlownUsd: number;
  updatedAt: string;
  source?: string;             // e.g. "FBU_MEIN_Chatroom/2026-07-28.pdf"
}

export async function listContracts(): Promise<ContractRecord[]> {
  return readJson<ContractRecord[]>("contracts.json", []);
}

export async function writeContracts(all: ContractRecord[]): Promise<void> {
  await writeJson("contracts.json", all);
}

// ── Leadership_Report hover metrics ──

export interface AccountMetrics {
  iata: string;
  ytdFlownRevUsd: number;
  ytdFlownRevLyUsd?: number;
  ytdFlownRevVlyPct?: number;
  euApacRevUsd: number;
  euApacRevLyUsd?: number;
  euApacRevVlyPct?: number;
  npbrUsd: number;
  ondPax?: number;
  atvUsd?: number;
  lastUpdated: string;
  source: string;
}

export async function listMetrics(): Promise<AccountMetrics[]> {
  return readJson<AccountMetrics[]>("metrics.json", []);
}

export async function writeMetrics(all: AccountMetrics[]): Promise<void> {
  await writeJson("metrics.json", all);
}

// ── Opportunities & threats (the CRM backbone) ──
// No traditional deal funnel: airline work is multi-theme, so each record
// carries theme tags (src/lib/themes.ts), a 4-state status, and a maturity
// confidence. statusChangedAt drives the dwell chip ("Open · 23d").

export type OpportunityStatus = "open" | "won" | "lost" | "stalled";
export type OpportunityConfidence = "high" | "low";
export type OpportunityPriority = "high" | "medium" | "low";
export type OpportunityKind = "opportunity" | "threat";

export interface OpportunityRecord {
  id: string;
  accountIata: string;
  kind: OpportunityKind;
  title: string;
  detail?: string;
  themes: string[];            // theme ids from src/lib/themes.ts
  status: OpportunityStatus;
  statusChangedAt: string;     // ISO — dwell = days since this changed
  confidence: OpportunityConfidence;
  priority: OpportunityPriority;
  valueUsd?: number | null;    // expected value, quote-verified only
  nextAction?: string | null;
  ownerBdId: string;
  source: string;              // "bd_report" | "market_intel" | "mail" | "metrics" | "manual"
  createdAt: string;
  dueDate?: string;            // dated event this hangs off (campaign, go-live, review)
  // Referential links — the Conversation → Thread → Opportunity chain and
  // the tie to a concrete business object.
  sourceUpdateId?: string;     // the update/email thread this came from
  contractIata?: string;       // the contract this opportunity belongs to
}

export async function listOpportunities(): Promise<OpportunityRecord[]> {
  return readJson<OpportunityRecord[]>("opportunities.json", []);
}

export async function writeOpportunities(all: OpportunityRecord[]): Promise<void> {
  await writeJson("opportunities.json", all);
}
