// Per-airline hierarchy seed. v0: hand-shaped for the 4 tier-A accounts.
// v1: derived from update participants + email attendee inference. Two
// swim-lanes: airline (left) + Trip.com (right). parentId is within-lane.

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

const EK_SEED: OrgSeed = {
  iata: "EK",
  nodes: [
    // Airline reporting chain
    { id: "ek-cco",      name: "Adnan Kazim",           title: "Chief Commercial Officer",                       side: "airline", level: "global" },
    { id: "ek-vp-b2b",   name: "Dina Al Herais",        title: "VP Commercial Products B2B (Corporate & Leisure)",side: "airline", level: "global",   parentId: "ek-cco" },
    { id: "ek-contract", name: "Rehab Mansoor",         title: "Contract Owner & Commercial Manager",            side: "airline", level: "global",   parentId: "ek-vp-b2b" },
    { id: "ek-ndc",      name: "Ahmed Al Ali",          title: "Head of NDC & Distribution",                     side: "airline", level: "global",   parentId: "ek-vp-b2b" },
    { id: "ek-me",       name: "Mohammed Al Hashemi",   title: "Regional Manager, Middle East",                  side: "airline", level: "regional", parentId: "ek-vp-b2b", market: "GMEI" },
    { id: "ek-asia",     name: "Sarah Ng",              title: "Regional Manager, Far East & Asia",              side: "airline", level: "regional", parentId: "ek-vp-b2b", market: "Far East" },
    { id: "ek-eu",       name: "Thomas Berg",           title: "Regional Manager, Europe",                       side: "airline", level: "regional", parentId: "ek-vp-b2b", market: "Europe" },
    { id: "ek-uae",      name: "Fatima Al Marri",       title: "UAE Country Manager",                            side: "airline", level: "local",    parentId: "ek-me",     market: "UAE" },
    { id: "ek-sg",       name: "David Lim",             title: "Singapore Country Manager",                      side: "airline", level: "local",    parentId: "ek-asia",   market: "Singapore" },
    { id: "ek-uk",       name: "James Wright",          title: "UK Country Manager",                             side: "airline", level: "local",    parentId: "ek-eu",     market: "United Kingdom" },

    // Trip.com counterparts
    { id: "trip-pj",      name: "PJ Zhou",             title: "Global Head, Airline Partnerships",  side: "trip", level: "global",                        counterpartOf: "ek-cco" },
    { id: "trip-shrey",   name: "Shrey Nayar",         title: "Global Head, Airline Marketing",     side: "trip", level: "global",   parentId: "trip-pj", counterpartOf: "ek-ndc" },
    { id: "trip-kirk",    name: "Kirk Wong",           title: "Regional Director",                  side: "trip", level: "regional", parentId: "trip-pj", counterpartOf: "ek-vp-b2b" },
    { id: "trip-anuj",    name: "Anuj Bansal",         title: "Director, Middle East and Africa",   side: "trip", level: "regional", parentId: "trip-kirk", counterpartOf: "ek-me" },
    { id: "trip-praveen", name: "Praveen Das Kulangara",title: "Regional Manager, GCC",             side: "trip", level: "local",    parentId: "trip-anuj", counterpartOf: "ek-uae" },
  ],
};

const EY_SEED: OrgSeed = {
  iata: "EY",
  nodes: [
    { id: "ey-cco", name: "EY CCO", title: "Chief Commercial Officer", side: "airline", level: "global" },
    { id: "ey-vp", name: "EY VP Commercial", title: "VP Commercial", side: "airline", level: "global", parentId: "ey-cco" },
    { id: "ey-uae", name: "EY UAE Country", title: "UAE Country Manager", side: "airline", level: "local", parentId: "ey-vp", market: "UAE" },
    { id: "trip-pj", name: "PJ Zhou", title: "Global Head, Airline Partnerships", side: "trip", level: "global", counterpartOf: "ey-cco" },
    { id: "trip-kirk", name: "Kirk Wong", title: "Regional Director", side: "trip", level: "regional", parentId: "trip-pj", counterpartOf: "ey-vp" },
    { id: "trip-praveen", name: "Praveen Das Kulangara", title: "Regional Manager, GCC", side: "trip", level: "local", parentId: "trip-kirk", counterpartOf: "ey-uae" },
  ],
};

const SV_SEED: OrgSeed = {
  iata: "SV",
  nodes: [
    { id: "sv-cco", name: "SV CCO", title: "Chief Commercial Officer", side: "airline", level: "global" },
    { id: "sv-dist", name: "SV Head Distribution", title: "Head of Distribution", side: "airline", level: "global", parentId: "sv-cco" },
    { id: "trip-pj", name: "PJ Zhou", title: "Global Head, Airline Partnerships", side: "trip", level: "global", counterpartOf: "sv-cco" },
    { id: "trip-kirk", name: "Kirk Wong", title: "Regional Director", side: "trip", level: "regional", parentId: "trip-pj", counterpartOf: "sv-dist" },
    { id: "trip-nabil", name: "Mohammad Nabil Dodin", title: "Senior Manager, KSA", side: "trip", level: "local", parentId: "trip-kirk", counterpartOf: "sv-dist" },
  ],
};

const AI_SEED: OrgSeed = {
  iata: "AI",
  nodes: [
    { id: "ai-vp", name: "AI VP Revenue", title: "VP Revenue Management", side: "airline", level: "global" },
    { id: "ai-dxb", name: "AI Regional MEA", title: "Regional Manager, MEA", side: "airline", level: "regional", parentId: "ai-vp", market: "MEA" },
    { id: "trip-kirk", name: "Kirk Wong", title: "Regional Director", side: "trip", level: "global", counterpartOf: "ai-vp" },
    { id: "trip-dinit", name: "Dinit Mehta", title: "Airline Director, ISC", side: "trip", level: "local", parentId: "trip-kirk", counterpartOf: "ai-dxb" },
  ],
};

const SEEDS: OrgSeed[] = [EK_SEED, EY_SEED, SV_SEED, AI_SEED];

export function orgFor(iata: string): OrgSeed | undefined {
  return SEEDS.find((s) => s.iata === iata);
}
