import { promises as fs } from "node:fs";
import path from "node:path";
import type { Stakeholder } from "@/components/leader/StakeholderPanel";

const PATH = path.join(process.cwd(), "src", "data", "stakeholders.json");

export async function loadStakeholders(iata?: string): Promise<Stakeholder[]> {
  try {
    const all = JSON.parse(await fs.readFile(PATH, "utf-8")) as Stakeholder[];
    return iata ? all.filter((s) => s.iata === iata) : all;
  } catch {
    return [];
  }
}
