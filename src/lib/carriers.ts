// Airline / market dictionaries for the structurer.

export const CARRIERS: Record<string, { code: string; name: string }> = {
  "egypt air": { code: "MS", name: "Egypt Air" },
  emirates: { code: "EK", name: "Emirates" },
  etihad: { code: "EY", name: "Etihad" },
  "qatar airways": { code: "QR", name: "Qatar Airways" },
  saudia: { code: "SV", name: "Saudia" },
  flydubai: { code: "FZ", name: "flydubai" },
  turkish: { code: "TK", name: "Turkish Airlines" },
  lufthansa: { code: "LH", name: "Lufthansa" },
  qantas: { code: "QF", name: "Qantas" },
  "singapore airlines": { code: "SQ", name: "Singapore Airlines" },
  "air india": { code: "AI", name: "Air India" },
  vistara: { code: "UK", name: "Vistara" },
};

export const MARKETS: Record<string, string> = {
  uae: "AE",
  dubai: "AE",
  "saudi": "SA",
  ksa: "SA",
  gcc: "AE",
  "middle east": "AE",
  europe: "EU",
  india: "IN",
  singapore: "SG",
  china: "CN",
  "na": "NA",
  kr: "KR",
};

export function resolveCarrier(text: string): { code: string; name: string } | null {
  const lower = text.toLowerCase();
  for (const k of Object.keys(CARRIERS)) {
    if (lower.includes(k)) return CARRIERS[k];
  }
  return null;
}

export function resolveMarket(text: string): string | null {
  const lower = text.toLowerCase();
  for (const k of Object.keys(MARKETS)) {
    if (lower.includes(k)) return MARKETS[k];
  }
  return null;
}
