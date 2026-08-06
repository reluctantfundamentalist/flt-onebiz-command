// Users + accounts. Users from Map_Accounts.xlsx + leadership list.
// Accounts scoped to the 5 AE-HQ carriers currently in the historic CSV
// (noSave_13989_*.csv). More carriers will be added when their raw-data
// files land — the code paths are ready.

export type Role = "bd" | "leader";

export interface User {
  id: string;
  name: string;
  title: string;
  role: Role;
  passwordHash: string;
  reportsTo?: string;
}

export type AccountRegion =
  | "GCC"
  | "ME"
  | "KSA"
  | "AFRICA"
  | "IND"
  | "CAUCASUS"
  | "OTHER";

export interface Account {
  iata: string;
  name: string;
  hqCountry: string;
  region: AccountRegion;
  lat: number;
  lng: number;
  ownerId: string;
}

const SEED_HASH =
  "$2b$10$v57QPvSzpH/P91hMpflUr.KMv7lC0xMbCi/EEdbf4yPbElh4kXVi.";

export const USERS: User[] = [
  { id: "anuj",    name: "Anuj Bansal",             title: "Director, Middle East and Africa",       role: "leader", passwordHash: SEED_HASH },
  { id: "shrey",   name: "Shrey Nayar",             title: "Global Head, Airline Marketing",         role: "leader", passwordHash: SEED_HASH },
  { id: "pj",      name: "PJ Zhou",                 title: "Global Head, Airline Partnerships",      role: "leader", passwordHash: SEED_HASH },
  { id: "kirk",    name: "Kirk Wong",               title: "Regional Director, Airline Partnerships",role: "leader", passwordHash: SEED_HASH },
  { id: "praveen", name: "Praveen Das Kulangara",   title: "Regional Manager, GCC",                  role: "bd",     passwordHash: SEED_HASH, reportsTo: "anuj" },
  { id: "dinit",   name: "Dinit Mehta",             title: "Airline Director, ISC",                  role: "bd",     passwordHash: SEED_HASH, reportsTo: "anuj" },
  { id: "nabil",   name: "Mohammad Nabil Dodin",    title: "Senior Manager, KSA",                    role: "bd",     passwordHash: SEED_HASH, reportsTo: "anuj" },
  { id: "snehal",  name: "Snehal Bagal",            title: "Partnerships Manager, UAE and Africa",   role: "bd",     passwordHash: SEED_HASH, reportsTo: "praveen" },
];

export function findUser(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}

export function ownerForRegion(region: AccountRegion): string {
  switch (region) {
    case "KSA":       return "nabil";
    case "IND":       return "dinit";
    case "AFRICA":    return "snehal";
    case "GCC":
    case "ME":
    case "CAUCASUS":  return "praveen";
    default:          return "anuj";
  }
}

// 5 AE-HQ carriers (matches historic CSV). Wave 2 adds more from KSA/India/Africa
// slices when those files land.
export const ACCOUNTS: Account[] = [
  { iata: "EK", name: "Emirates",             hqCountry: "United Arab Emirates", region: "GCC", lat: 25.253, lng: 55.365, ownerId: "praveen" },
  { iata: "EY", name: "Etihad Airways",       hqCountry: "United Arab Emirates", region: "GCC", lat: 24.443, lng: 54.651, ownerId: "praveen" },
  { iata: "FZ", name: "flydubai",             hqCountry: "United Arab Emirates", region: "GCC", lat: 25.253, lng: 55.365, ownerId: "praveen" },
  { iata: "G9", name: "Air Arabia",           hqCountry: "United Arab Emirates", region: "GCC", lat: 25.328, lng: 55.517, ownerId: "praveen" },
  { iata: "3L", name: "Air Arabia Abu Dhabi", hqCountry: "United Arab Emirates", region: "GCC", lat: 24.443, lng: 54.651, ownerId: "praveen" },
];

export function findAccount(iata: string): Account | undefined {
  return ACCOUNTS.find((a) => a.iata.toUpperCase() === iata.toUpperCase());
}

export function accountsForUser(user: User): Account[] {
  if (user.role === "leader") return ACCOUNTS;
  const scope = new Set<string>([user.id]);
  for (const u of USERS) if (u.reportsTo === user.id) scope.add(u.id);
  return ACCOUNTS.filter((a) => scope.has(a.ownerId));
}
