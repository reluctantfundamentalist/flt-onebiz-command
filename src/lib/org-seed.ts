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
    // Airline side — derived from Anuj's Outlook (last 90 days, @emirates.com threads)
    { id: "ek-emre",     name: "Emre Coskun",       title: "Commercial Manager",                    side: "airline", level: "regional", market: "GMEI" },
    { id: "ek-alshaiba", name: "Mohamed Alshaiba",  title: "Commercial Manager",                    side: "airline", level: "regional", market: "GMEI",   parentId: "ek-emre" },
    { id: "ek-nadia",    name: "Nadia Mohamed Ali", title: "Manager, Trade Partnerships",           side: "airline", level: "regional", market: "GMEI",   parentId: "ek-emre" },
    { id: "ek-rehab",    name: "Rehab Mansoor",     title: "Manager Leisure",                       side: "airline", level: "regional",                   parentId: "ek-emre" },
    { id: "ek-abbygail", name: "Abbygail Cross",    title: "Contract Manager",                      side: "airline", level: "regional",                   parentId: "ek-emre" },
    { id: "ek-fernanda", name: "Fernanda Pilli",    title: "Skywards Partnerships",                 side: "airline", level: "global"                                            },
    { id: "ek-logi",     name: "Logi George",       title: "Distribution",                          side: "airline", level: "global"                                            },
    { id: "ek-taiba",    name: "Taiba Alnasser",    title: "Sales",                                 side: "airline", level: "regional", market: "GMEI"                          },

    // Trip.com counterparts
    { id: "trip-pj",      name: "PJ Zhou",              title: "Global Head, Airline Partnerships",  side: "trip", level: "global"                                              },
    { id: "trip-shrey",   name: "Shrey Nayar",          title: "Global Head, Airline Marketing",     side: "trip", level: "global",   parentId: "trip-pj", counterpartOf: "ek-fernanda" },
    { id: "trip-kirk",    name: "Kirk Wong",            title: "Regional Director",                  side: "trip", level: "regional", parentId: "trip-pj", counterpartOf: "ek-emre"     },
    { id: "trip-anuj",    name: "Anuj Bansal",          title: "Director, Middle East & Africa",     side: "trip", level: "regional", parentId: "trip-kirk"                              },
    { id: "trip-praveen", name: "Praveen Das Kulangara",title: "Regional Manager, GCC",              side: "trip", level: "local",    parentId: "trip-anuj",counterpartOf: "ek-emre"     },
  ],
};

const EY_SEED: OrgSeed = {
  iata: "EY",
  nodes: [
    // Airline side — derived from Anuj's Outlook (last 90 days, @etihad.ae threads)
    { id: "ey-sreejith", name: "Sreejith Rajamohanan", title: "Commercial (primary contact)",           side: "airline", level: "regional", market: "GMEI" },
    { id: "ey-lorena",   name: "M.L. Rodessa Manalastas", title: "Sales Support",                       side: "airline", level: "regional", market: "GMEI",   parentId: "ey-sreejith" },
    { id: "ey-ksa",      name: "Sales Support KSA",    title: "Sales Support, KSA",                     side: "airline", level: "local",    market: "KSA",    parentId: "ey-sreejith" },

    // Trip.com counterparts
    { id: "trip-pj",      name: "PJ Zhou",              title: "Global Head, Airline Partnerships",   side: "trip", level: "global"                                                                },
    { id: "trip-kirk",    name: "Kirk Wong",            title: "Regional Director",                   side: "trip", level: "regional", parentId: "trip-pj",   counterpartOf: "ey-sreejith" },
    { id: "trip-anuj",    name: "Anuj Bansal",          title: "Director, Middle East & Africa",      side: "trip", level: "regional", parentId: "trip-kirk"                                        },
    { id: "trip-praveen", name: "Praveen Das Kulangara",title: "Regional Manager, GCC",               side: "trip", level: "local",    parentId: "trip-anuj",counterpartOf: "ey-sreejith" },
  ],
};

const SEEDS: OrgSeed[] = [EK_SEED, EY_SEED];

export function orgFor(iata: string): OrgSeed | undefined {
  return SEEDS.find((s) => s.iata === iata);
}
