// Users + accounts. Users seeded from Map_Accounts.xlsx (Downloads,
// 2026-08-06) + leadership list. Accounts seeded from the daily CSV
// carrier list (5W excluded per 2026-08-06 decision).
//
// HQ-country -> parent BD via region rules; other BD posts on that
// airline become child records (see accountsForUser + ownerForRegion).

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

// Region rules (per Map_Accounts.xlsx):
//   GCC+ME+Caucasus (ex-KSA)  -> praveen
//   India                     -> dinit
//   KSA                       -> nabil
//   Africa                    -> snehal
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

// 40 accounts from noSave_*.csv (5W excluded 2026-08-06). HQ lat/lng
// public sources. Region derives owner via ownerForRegion.
export const ACCOUNTS: Account[] = [
  // ── GCC / Middle East (owner: praveen) ──
  { iata: "EK", name: "Emirates",                  hqCountry: "United Arab Emirates", region: "GCC",      lat: 25.253, lng: 55.365, ownerId: "praveen" },
  { iata: "EY", name: "Etihad Airways",            hqCountry: "United Arab Emirates", region: "GCC",      lat: 24.443, lng: 54.651, ownerId: "praveen" },
  { iata: "FZ", name: "flydubai",                  hqCountry: "United Arab Emirates", region: "GCC",      lat: 25.253, lng: 55.365, ownerId: "praveen" },
  { iata: "G9", name: "Air Arabia",                hqCountry: "United Arab Emirates", region: "GCC",      lat: 25.328, lng: 55.517, ownerId: "praveen" },
  { iata: "3L", name: "Air Arabia Abu Dhabi",      hqCountry: "United Arab Emirates", region: "GCC",      lat: 24.443, lng: 54.651, ownerId: "praveen" },
  { iata: "QR", name: "Qatar Airways",             hqCountry: "Qatar",                region: "GCC",      lat: 25.273, lng: 51.608, ownerId: "praveen" },
  { iata: "GF", name: "Gulf Air",                  hqCountry: "Bahrain",              region: "GCC",      lat: 26.271, lng: 50.633, ownerId: "praveen" },
  { iata: "WY", name: "Oman Air",                  hqCountry: "Oman",                 region: "GCC",      lat: 23.593, lng: 58.284, ownerId: "praveen" },
  { iata: "OV", name: "Salamair",                  hqCountry: "Oman",                 region: "GCC",      lat: 23.593, lng: 58.284, ownerId: "praveen" },
  { iata: "KU", name: "Kuwait Airways",            hqCountry: "Kuwait",               region: "GCC",      lat: 29.226, lng: 47.968, ownerId: "praveen" },
  { iata: "J9", name: "Jazeera Airways",           hqCountry: "Kuwait",               region: "GCC",      lat: 29.226, lng: 47.968, ownerId: "praveen" },
  { iata: "RJ", name: "Royal Jordanian",           hqCountry: "Jordan",               region: "ME",       lat: 31.723, lng: 35.993, ownerId: "praveen" },
  { iata: "9P", name: "Air Arabia Jordan",         hqCountry: "Jordan",               region: "ME",       lat: 31.723, lng: 35.993, ownerId: "praveen" },
  { iata: "MA", name: "MEA-JU",                    hqCountry: "Lebanon",              region: "ME",      lat: 33.821, lng: 35.489, ownerId: "praveen" },
  { iata: "6H", name: "Israir",                    hqCountry: "Israel",               region: "ME",       lat: 32.011, lng: 34.887, ownerId: "praveen" },
  { iata: "IZ", name: "Arkia",                     hqCountry: "Israel",               region: "ME",       lat: 32.011, lng: 34.887, ownerId: "praveen" },
  { iata: "LY", name: "El Al",                     hqCountry: "Israel",               region: "ME",       lat: 32.011, lng: 34.887, ownerId: "praveen" },
  { iata: "A9", name: "Georgian Airways",          hqCountry: "Georgia",              region: "CAUCASUS", lat: 41.669, lng: 44.955, ownerId: "praveen" },
  { iata: "J2", name: "Azerbaijan Airlines",       hqCountry: "Azerbaijan",           region: "CAUCASUS", lat: 40.467, lng: 50.047, ownerId: "praveen" },

  // ── KSA (owner: nabil) ──
  { iata: "SV", name: "Saudia",                    hqCountry: "Saudi Arabia",         region: "KSA",      lat: 21.679, lng: 39.157, ownerId: "nabil" },
  { iata: "XY", name: "flynas",                    hqCountry: "Saudi Arabia",         region: "KSA",      lat: 24.958, lng: 46.699, ownerId: "nabil" },
  { iata: "F3", name: "flyadeal",                  hqCountry: "Saudi Arabia",         region: "KSA",      lat: 21.680, lng: 39.157, ownerId: "nabil" },
  { iata: "NE", name: "Nesma Airlines",            hqCountry: "Saudi Arabia",         region: "KSA",      lat: 21.680, lng: 39.157, ownerId: "nabil" },

  // ── India (owner: dinit) ──
  { iata: "AI", name: "Air India",                 hqCountry: "India",                region: "IND",      lat: 19.089, lng: 72.868, ownerId: "dinit" },
  { iata: "IX", name: "Air India Express",         hqCountry: "India",                region: "IND",      lat: 12.950, lng: 74.837, ownerId: "dinit" },
  { iata: "6E", name: "IndiGo",                    hqCountry: "India",                region: "IND",      lat: 28.556, lng: 77.100, ownerId: "dinit" },
  { iata: "UK", name: "Vistara",                   hqCountry: "India",                region: "IND",      lat: 28.556, lng: 77.100, ownerId: "dinit" },
  { iata: "SG", name: "SpiceJet",                  hqCountry: "India",                region: "IND",      lat: 28.556, lng: 77.100, ownerId: "dinit" },

  // ── Africa (owner: snehal) ──
  { iata: "MS", name: "EgyptAir",                  hqCountry: "Egypt",                region: "AFRICA",   lat: 30.121, lng: 31.406, ownerId: "snehal" },
  { iata: "SM", name: "Air Cairo",                 hqCountry: "Egypt",                region: "AFRICA",   lat: 30.121, lng: 31.406, ownerId: "snehal" },
  { iata: "NP", name: "Nile Air",                  hqCountry: "Egypt",                region: "AFRICA",   lat: 30.121, lng: 31.406, ownerId: "snehal" },
  { iata: "E5", name: "Air Arabia Egypt",          hqCountry: "Egypt",                region: "AFRICA",   lat: 30.121, lng: 31.406, ownerId: "snehal" },
  { iata: "KQ", name: "Kenya Airways",             hqCountry: "Kenya",                region: "AFRICA",   lat: -1.319, lng: 36.928, ownerId: "snehal" },
  { iata: "SA", name: "South African Airways",     hqCountry: "South Africa",         region: "AFRICA",   lat: -26.139, lng: 28.246, ownerId: "snehal" },
  { iata: "FA", name: "FlySafair",                 hqCountry: "South Africa",         region: "AFRICA",   lat: -26.139, lng: 28.246, ownerId: "snehal" },
  { iata: "4Z", name: "Airlink",                   hqCountry: "South Africa",         region: "AFRICA",   lat: -26.139, lng: 28.246, ownerId: "snehal" },
  { iata: "5Z", name: "CemAir",                    hqCountry: "South Africa",         region: "AFRICA",   lat: -26.139, lng: 28.246, ownerId: "snehal" },

  // ── Other (owner: anuj) ──
  { iata: "PK", name: "Pakistan International",    hqCountry: "Pakistan",             region: "OTHER",    lat: 24.907, lng: 67.161, ownerId: "anuj" },
  { iata: "LV", name: "Level",                     hqCountry: "Spain",                region: "OTHER",    lat: 41.297, lng: 2.078,  ownerId: "anuj" },
  { iata: "GE", name: "Grand International",       hqCountry: "Iran",                 region: "OTHER",    lat: 35.689, lng: 51.313, ownerId: "anuj" },
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
