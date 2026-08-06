export interface TrendlinePoint {
  month: string;
  revenue: number;
  pax: number;
}

/** A single month's computed report (KPIs + insights + POS + rankings). */
export interface AirlineSnapshot {
  kpis: KPIs;
  insights: Insights;
  pos: POSData;
  rankings: Rankings;
}

/**
 * One date dimension the dashboard can anchor on. `outbound` is anchored on the
 * outbound departure date (the default); `order` is anchored on the booking date.
 * `byMonth` holds a snapshot per month; `trendline` spans every month.
 */
export interface MonthView {
  months: string[];
  byMonth: Record<string, AirlineSnapshot>;
  trendline: TrendlinePoint[];
}

/** The full per-airline dataset served to the dashboard. */
export interface AirlineDataset {
  meta: ReportMeta;
  outbound: MonthView;
  order: MonthView;
}

export interface ReportMeta {
  airlineCode: string;
  airlineName: string;
  reportMonth: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  currency: string;
  orderDateMin: string;
  orderDateMax: string;
}

export interface MetricWithTrend {
  value: number;
  vly: number;
  mom: number;
}

export interface YieldMetric {
  value: number;
  vly: number;
}

export interface KPIs {
  revenue: MetricWithTrend;
  ondPax: MetricWithTrend;
  atv: MetricWithTrend;
  premium: MetricWithTrend;
  yield: {
    economy: YieldMetric;
    premium: YieldMetric;
  };
}

export interface DistributionRow {
  channel: string;
  revenue: number;
  revenueShare: number;
}

/** Ancillary row. The report carries paid-segment counts (not $ revenue), so
 *  each row reports total paid segments and the attach rate (share of bookings
 *  with at least one paid ancillary of that type). */
export interface AncillaryRow {
  type: string;
  segments: number;
  attachRate: number;
}

export interface ShareRow {
  label: string;
  paxShare: number;
}

export interface ProductRow {
  product: string;
  revenue: number;
}

export interface Insights {
  distribution: DistributionRow[];
  ancillary: AncillaryRow[];
  trafficType: ShareRow[];
  cabinSplit: ShareRow[];
  tripType: ShareRow[];
  productType: ProductRow[];
  bookingWindow: ShareRow[];
}

export interface POSRegion {
  region: string;
  country: string | null;
  revenue: number;
  revVly: number;
  pax: number;
  paxVly: number;
  atv: number;
  atvVly: number;
}

export interface POSData {
  regions: POSRegion[];
  grandTotal: {
    revenue: number;
    revVly: number;
    pax: number;
    paxVly: number;
    atv: number;
    atvVly: number;
  };
  topOriginCountries: CountryRank[];
  topDestCountries: CountryRank[];
}

export interface CountryRank {
  rank: number;
  country: string;
  revenue: number;
}

export interface RBDRank {
  rank: number;
  rbd: string;
  revenue: number;
  revVly: number;
}

export interface NDRank {
  rank: number;
  ond: string;
  revenue: number;
  revVly: number;
  pax: number;
  paxVly: number;
}

export interface Rankings {
  topRBD: RBDRank[];
  topNDCountry: NDRank[];
  topNDOND: NDRank[];
}
