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
