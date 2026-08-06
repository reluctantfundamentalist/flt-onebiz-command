// Per-airline hierarchy. Airline side comes from real Outlook thread
// participants (via scripts/graph_pull.py). Trip.com side is the fixed
// reporting chain: PJ Zhou → Kirk Wong → Shrey Nayar → Anuj Bansal.

export type OrgSide = "airline" | "trip";
export type OrgLevel = "global" | "regional" | "local";

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  side: OrgSide;
  level: OrgLevel;
  market?: string;
  parentId?: string;
  counterpartOf?: string; // node id on the opposite side
}

export interface OrgSeed {
  iata: string;
  nodes: OrgNode[];
}

// Standard Trip.com reporting chain. `counterpartOf` is set per-airline
// so the same chain can point at different airline nodes.
function tripChain(
  counterparts: { pj?: string; kirk?: string; shrey?: string; anuj?: string } = {},
): OrgNode[] {
  return [
    { id: "trip-pj",    name: "PJ Zhou",     title: "Global Head, Airline Partnerships", side: "trip", level: "global",                        counterpartOf: counterparts.pj },
    { id: "trip-kirk",  name: "Kirk Wong",   title: "Regional Director",                 side: "trip", level: "regional", parentId: "trip-pj",  counterpartOf: counterparts.kirk },
    { id: "trip-shrey", name: "Shrey Nayar", title: "Global Head, Airline Marketing",    side: "trip", level: "regional", parentId: "trip-kirk", counterpartOf: counterparts.shrey },
    { id: "trip-anuj",  name: "Anuj Bansal", title: "Director, Middle East & Africa",    side: "trip", level: "local",    parentId: "trip-shrey", counterpartOf: counterparts.anuj },
  ];
}

// ─── Emirates ────────────────────────────────────────────────────────────────
const EK_SEED: OrgSeed = {
  iata: "EK",
  nodes: [
    { id: "ek-emre",     name: "Emre Coskun",       title: "Commercial Manager",              side: "airline", level: "regional", market: "GMEI" },
    { id: "ek-alshaiba", name: "Mohamed Alshaiba",  title: "Commercial Manager",              side: "airline", level: "regional", market: "GMEI",   parentId: "ek-emre" },
    { id: "ek-nadia",    name: "Nadia Mohamed Ali", title: "Manager, Trade Partnerships",     side: "airline", level: "regional", market: "GMEI",   parentId: "ek-emre" },
    { id: "ek-rehab",    name: "Rehab Mansoor",     title: "Manager Leisure",                 side: "airline", level: "regional",                   parentId: "ek-emre" },
    { id: "ek-abbygail", name: "Abbygail Cross",    title: "Contract Manager",                side: "airline", level: "regional",                   parentId: "ek-emre" },
    { id: "ek-fernanda", name: "Fernanda Pilli",    title: "Skywards Partnerships",           side: "airline", level: "global" },
    { id: "ek-logi",     name: "Logi George",       title: "Distribution",                    side: "airline", level: "global" },
    { id: "ek-taiba",    name: "Taiba Alnasser",    title: "Sales",                           side: "airline", level: "regional", market: "GMEI" },
    ...tripChain({ kirk: "ek-emre", shrey: "ek-fernanda", anuj: "ek-emre" }),
  ],
};

// ─── Etihad ──────────────────────────────────────────────────────────────────
const EY_SEED: OrgSeed = {
  iata: "EY",
  nodes: [
    { id: "ey-sreejith", name: "Sreejith Rajamohanan",       title: "Commercial (primary contact)", side: "airline", level: "regional", market: "GMEI" },
    { id: "ey-lorena",   name: "M.L. Rodessa Manalastas",    title: "Sales Support",                side: "airline", level: "regional", market: "GMEI",   parentId: "ey-sreejith" },
    { id: "ey-ksa",      name: "Sales Support KSA",          title: "Sales Support, KSA",           side: "airline", level: "local",    market: "KSA",    parentId: "ey-sreejith" },
    ...tripChain({ kirk: "ey-sreejith", anuj: "ey-sreejith" }),
  ],
};

// ─── Air Arabia Group (G9 + 3L) ──────────────────────────────────────────────
const G9_SEED: OrgSeed = {
  iata: "G9",
  nodes: [
    { id: "g9-tarun",   name: "Tarun Chanana",       title: "Commercial (primary contact)",  side: "airline", level: "regional", market: "GMEI" },
    { id: "g9-rajiv",   name: "Rajiv Bhattacharjee", title: "Commercial",                    side: "airline", level: "regional", market: "GMEI", parentId: "g9-tarun" },
    { id: "g9-yasemin", name: "Yasemin Serce",       title: "Sales",                         side: "airline", level: "regional",                 parentId: "g9-tarun" },
    { id: "g9-lvr",     name: "Trade Support",       title: "Trade Support desk",            side: "airline", level: "local",                    parentId: "g9-tarun" },
    ...tripChain({ kirk: "g9-tarun", anuj: "g9-tarun" }),
  ],
};

const SEEDS: OrgSeed[] = [EK_SEED, EY_SEED, G9_SEED];

export function orgFor(iata: string): OrgSeed | undefined {
  return SEEDS.find((s) => s.iata === iata);
}
