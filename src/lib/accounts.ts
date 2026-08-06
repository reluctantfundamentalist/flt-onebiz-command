// Static data for Business Managers, Airlines, and access control.
// Prototype — a real system would have this in a database with SSO.

export const BUSINESS_MANAGERS = [
  "Anuj Bansal",
  "Praveen Das Kulangara",
  "Mohammad Nabil Dodin",
  "Snehal Bagal",
  "Dinit Mehta",
] as const;

export type BusinessManager = (typeof BUSINESS_MANAGERS)[number];

export const AIRLINES = [
  "Emirates Airline",
  "Etihad Airways",
  "Qatar Airways",
  "Saudia Airlines",
  "Egypt Air",
  "Air India",
] as const;

export type AirlineName = (typeof AIRLINES)[number];

export const ACCESS_PIN = "1142";

export interface Session {
  bm: BusinessManager;
  airline: AirlineName;
}

// Airline → short code mapping for display
export const AIRLINE_CODES: Record<AirlineName, string> = {
  "Emirates Airline": "EK",
  "Etihad Airways": "EY",
  "Qatar Airways": "QR",
  "Saudia Airlines": "SV",
  "Egypt Air": "MS",
  "Air India": "AI",
};

// Airline brand colors for visual identity
export const AIRLINE_BRANDS: Record<AirlineName, { primary: string; accent: string }> = {
  "Emirates Airline": { primary: "#d71921", accent: "#b31418" },
  "Etihad Airways": { primary: "#bd8b21", accent: "#8a6518" },
  "Qatar Airways": { primary: "#762057", accent: "#5c1743" },
  "Saudia Airlines": { primary: "#005a32", accent: "#004024" },
  "Egypt Air": { primary: "#ce1126", accent: "#a00d1e" },
  "Air India": { primary: "#e75a0d", accent: "#b8470a" },
};
