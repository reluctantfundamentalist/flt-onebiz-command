import { promises as fs } from "node:fs";
import path from "node:path";

const EDGES_PATH = path.join(process.cwd(), "src", "data", "participants.json");

export interface ParticipantEdge {
  airline: string;
  trip: string;
  threads: number;
  iata: string;
}

export async function loadEdges(): Promise<ParticipantEdge[]> {
  try {
    return JSON.parse(await fs.readFile(EDGES_PATH, "utf-8")) as ParticipantEdge[];
  } catch {
    return [];
  }
}

export async function loadEdgesForAccount(iata: string): Promise<ParticipantEdge[]> {
  const all = await loadEdges();
  return all.filter((e) => e.iata === iata);
}

// Normalize a display name for fuzzy matching: lowercase, strip titles/suffixes.
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*-\s*.*$/, "")   // "Rehab Mansoor - Manager Leisure" -> "Rehab Mansoor"
    .replace(/\s+/g, " ")
    .trim();
}
