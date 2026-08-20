// Opportunity theme taxonomy. Source: PJ Zhou "BD × Airline Meetings —
// Structured Theme Review of Weekly Reports" (Lark AbAld9xgHoQDcOxJirWlQo2FgQg,
// 450 airline-meeting entries, Jun–Aug 2026). 8 major themes + 5 minor
// recurring directions, adopted as-is so weekly-report language maps 1:1.

export interface Theme {
  id: string;
  num: string;      // ①–⑧ for majors, · for minors
  label: string;
  short: string;    // chip text
  minor?: boolean;
  keywords: RegExp; // auto-tag suggestions for promoted signals
}

export const THEMES: Theme[] = [
  {
    id: "campaigns",
    num: "①",
    label: "Campaigns & joint marketing",
    short: "Campaigns",
    keywords: /campaign|mega|8\.8|9\.9|11\.11|natas|matta|co-market|kol|livestream|exposure/i,
  },
  {
    id: "rebates",
    num: "②",
    label: "Rebates / commissions / incentives",
    short: "Rebates",
    keywords: /rebate|commission|incentive|backend|payout|reconcil/i,
  },
  {
    id: "fares",
    num: "③",
    label: "Special / exclusive fares",
    short: "Fares",
    keywords: /fare|private fare|exclusive|discount|bundle|b&s|net fare/i,
  },
  {
    id: "internal",
    num: "④",
    label: "Airline internal developments",
    short: "Internal",
    keywords: /ceo|gm |management|personnel|merger|network|fleet|load factor/i,
  },
  {
    id: "ndc",
    num: "⑤",
    label: "NDC / systems / technical enablement",
    short: "NDC",
    keywords: /ndc|api |tps|l2b|vcc|gds|system|go-live|technical/i,
  },
  {
    id: "contracts",
    num: "⑥",
    label: "Contracts / agreements / clauses",
    short: "Contract",
    keywords: /contract|agreement|clause|renewal|framework|signing/i,
  },
  {
    id: "qbr",
    num: "⑦",
    label: "Performance reviews / QBR",
    short: "QBR",
    keywords: /qbr|quarterly|review|performance meeting/i,
  },
  {
    id: "funds",
    num: "⑧",
    label: "Marketing funds / budgets",
    short: "Funds",
    keywords: /fund|budget|marketing spend|invoic/i,
  },
  {
    id: "iata_pos",
    num: "·",
    label: "IATA / POS activation & authority",
    short: "IATA/POS",
    minor: true,
    keywords: /iata|pos |ticketing authority|sub-iata|pcc/i,
  },
  {
    id: "loyalty",
    num: "·",
    label: "Membership / loyalty",
    short: "Loyalty",
    minor: true,
    keywords: /member|loyalty|skywards|frequent flyer/i,
  },
  {
    id: "ancillary",
    num: "·",
    label: "Ancillary products",
    short: "Ancillary",
    minor: true,
    keywords: /ancillar|seat|baggage|meal|moment/i,
  },
  {
    id: "interline",
    num: "·",
    label: "Virtual interline",
    short: "Interline",
    minor: true,
    keywords: /interline/i,
  },
  {
    id: "aftersales",
    num: "·",
    label: "After-sales / ADMs",
    short: "ADM",
    minor: true,
    keywords: /adm|refund|re-issue|after-sales|post-ticketing/i,
  },
];

export const THEME_BY_ID: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);

// Keyword-match a free-text signal to suggested theme ids (auto-tag on promote).
export function suggestThemes(text: string): string[] {
  return THEMES.filter((t) => t.keywords.test(text)).map((t) => t.id);
}
