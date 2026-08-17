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
  "$2b$10$nlUKnH4RWhg/DYaG7givwevV1phpYHo1FEk/5BA2WxZlMvi6/VzSC"; // TEMP local-preview only (password: mea-preview). Revert before merging.

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

// Full regional portfolio per the 2026-08-16 confirmed BD/zone mapping. Carrier
// set mirrors AIRLINE_NAMES in scripts/ingest.py so codes always match the data
// pipeline. Air Arabia Group = G9 (Sharjah) + 3L (Abu Dhabi) combined.
export const ACCOUNTS: Account[] = [
  // Praveen — GCC
  { iata: "EK", name: "Emirates",              hqCountry: "United Arab Emirates", region: "GCC", lat: 25.253, lng: 55.365, ownerId: "praveen" },
  { iata: "EY", name: "Etihad Airways",        hqCountry: "United Arab Emirates", region: "GCC", lat: 24.443, lng: 54.651, ownerId: "praveen" },
  { iata: "FZ", name: "flydubai",              hqCountry: "United Arab Emirates", region: "GCC", lat: 25.253, lng: 55.365, ownerId: "praveen" },
  { iata: "G9", name: "Air Arabia Group",      hqCountry: "United Arab Emirates", region: "GCC", lat: 25.328, lng: 55.517, ownerId: "praveen" },
  { iata: "QR", name: "Qatar Airways",         hqCountry: "Qatar",                region: "GCC", lat: 25.273, lng: 51.608, ownerId: "praveen" },
  { iata: "KU", name: "Kuwait Airways",        hqCountry: "Kuwait",               region: "GCC", lat: 29.227, lng: 47.983, ownerId: "praveen" },
  { iata: "J9", name: "Jazeera Airways",       hqCountry: "Kuwait",               region: "GCC", lat: 29.227, lng: 47.983, ownerId: "praveen" },
  { iata: "GF", name: "Gulf Air",              hqCountry: "Bahrain",              region: "GCC", lat: 26.271, lng: 50.633, ownerId: "praveen" },
  { iata: "WY", name: "Oman Air",              hqCountry: "Oman",                 region: "GCC", lat: 23.588, lng: 58.382, ownerId: "praveen" },
  { iata: "IY", name: "Yemenia",               hqCountry: "Yemen",                region: "GCC", lat: 15.470, lng: 44.191, ownerId: "praveen" },
  // Praveen — Levant
  { iata: "LY", name: "El Al",                 hqCountry: "Israel",               region: "ME", lat: 32.005, lng: 34.887, ownerId: "praveen" },
  { iata: "IZ", name: "Arkia",                 hqCountry: "Israel",               region: "ME", lat: 32.005, lng: 34.887, ownerId: "praveen" },
  { iata: "6H", name: "Israir",                hqCountry: "Israel",               region: "ME", lat: 32.005, lng: 34.887, ownerId: "praveen" },
  { iata: "MA", name: "Middle East Airlines",  hqCountry: "Lebanon",              region: "ME", lat: 33.821, lng: 35.491, ownerId: "praveen" },
  // Praveen — Caucasus
  { iata: "J2", name: "Azerbaijan Airlines",   hqCountry: "Azerbaijan",           region: "CAUCASUS", lat: 40.495, lng: 50.028, ownerId: "praveen" },
  { iata: "A9", name: "Georgian Airways",      hqCountry: "Georgia",              region: "CAUCASUS", lat: 41.667, lng: 44.955, ownerId: "praveen" },
  // Nabil — KSA + Pakistan
  { iata: "SV", name: "Saudia",                hqCountry: "Saudi Arabia",         region: "KSA", lat: 21.676, lng: 39.156, ownerId: "nabil" },
  { iata: "XY", name: "flynas",                hqCountry: "Saudi Arabia",         region: "KSA", lat: 24.958, lng: 46.698, ownerId: "nabil" },
  { iata: "F3", name: "flyadeal",              hqCountry: "Saudi Arabia",         region: "KSA", lat: 21.676, lng: 39.156, ownerId: "nabil" },
  { iata: "PK", name: "Pakistan International",hqCountry: "Pakistan",            region: "KSA", lat: 31.520, lng: 74.358, ownerId: "nabil" },
  // Snehal — Africa + Jordan
  { iata: "MS", name: "EgyptAir",              hqCountry: "Egypt",                region: "AFRICA", lat: 30.122, lng: 31.406, ownerId: "snehal" },
  { iata: "RJ", name: "Royal Jordanian",       hqCountry: "Jordan",               region: "AFRICA", lat: 31.953, lng: 35.235, ownerId: "snehal" },
  { iata: "KQ", name: "Kenya Airways",         hqCountry: "Kenya",                region: "AFRICA", lat: -1.319, lng: 36.921, ownerId: "snehal" },
  { iata: "SA", name: "South African Airways", hqCountry: "South Africa",         region: "AFRICA", lat: -26.136, lng: 28.246, ownerId: "snehal" },
  { iata: "FA", name: "FlySafair",             hqCountry: "South Africa",         region: "AFRICA", lat: -25.938, lng: 27.926, ownerId: "snehal" },
  { iata: "AT", name: "Royal Air Maroc",       hqCountry: "Morocco",              region: "AFRICA", lat: 33.367, lng: -7.583, ownerId: "snehal" },
  { iata: "NP", name: "Nile Air",              hqCountry: "Egypt",                region: "AFRICA", lat: 30.122, lng: 31.406, ownerId: "snehal" },
  { iata: "SM", name: "Air Cairo",             hqCountry: "Egypt",                region: "AFRICA", lat: 30.122, lng: 31.406, ownerId: "snehal" },
  // Dinit — India
  { iata: "AI", name: "Air India",             hqCountry: "India",                region: "IND", lat: 28.556, lng: 77.100, ownerId: "dinit" },
  { iata: "IX", name: "Air India Express",     hqCountry: "India",                region: "IND", lat: 28.556, lng: 77.100, ownerId: "dinit" },
  { iata: "6E", name: "IndiGo",                hqCountry: "India",                region: "IND", lat: 28.556, lng: 77.100, ownerId: "dinit" },
  { iata: "SG", name: "SpiceJet",              hqCountry: "India",                region: "IND", lat: 28.556, lng: 77.100, ownerId: "dinit" },
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
