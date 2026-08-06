// Field schemas for the 3 form types derived from Sample1–3 files.
// Each schema mirrors the fields found in the actual BD workbooks.

export type FieldType =
  | "text" | "textarea" | "number" | "money" | "select"
  | "multiselect" | "date" | "daterange" | "people" | "attachment";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  section: string;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: string[];
  autofilled?: boolean;
  flag?: boolean;
}

// ── Sample1: Flight Incentive Program ──

export const FLIGHT_INCENTIVE_FIELDS: FieldDef[] = [
  // Deal Setup
  { key: "requestSummary", label: "Request Summary", type: "textarea", section: "Deal Setup", placeholder: "Describe the incentive program…" },
  { key: "stackedWithExisting", label: "Stacked with existing deals", type: "select", section: "Deal Setup", options: ["N", "Y"] },
  { key: "stackingRequirements", label: "Stacking Requirements", type: "textarea", section: "Deal Setup", placeholder: "e.g. No existing deals, no stacking needed" },

  // Agent & Carrier
  { key: "agentCode", label: "Agent Code", type: "text", section: "Agent & Carrier", required: true, placeholder: "e.g. All EY agent codes as shared earlier" },
  { key: "priorityAgentCode", label: "Priority Agent Code", type: "text", section: "Agent & Carrier", placeholder: "e.g. UKXC,DEXC,NLXC,FRTV,HKXC,AUXC" },
  { key: "vc", label: "VC (Validating Carrier)", type: "text", section: "Agent & Carrier", required: true, placeholder: "e.g. EY" },
  { key: "mc", label: "MC (Marketing Carrier)", type: "text", section: "Agent & Carrier", required: true, placeholder: "e.g. EY" },
  { key: "oc", label: "OC (Operating Carrier)", type: "text", section: "Agent & Carrier", placeholder: "e.g. EY" },

  // Periods
  { key: "sellingPeriod", label: "Selling Period", type: "text", section: "Periods", required: true, placeholder: "e.g. 2026/08/01>2026/08/31" },
  { key: "sellingBlackoutPeriod", label: "Selling Blackout Period", type: "text", section: "Periods", placeholder: "e.g. 2026/08/15>2026/09/30" },
  { key: "outboundPeriod", label: "Outbound Period", type: "text", section: "Periods", placeholder: "e.g. 2026/08/15>2026/09/30" },
  { key: "outboundBlackoutPeriod", label: "Outbound Blackout Period", type: "text", section: "Periods" },
  { key: "inboundPeriod", label: "Inbound Period", type: "text", section: "Periods", placeholder: "e.g. 2026/08/15>2026/09/30" },
  { key: "inboundBlackoutPeriod", label: "Inbound Blackout Period", type: "text", section: "Periods" },

  // Fare & Booking
  { key: "gdsType", label: "GDS Type", type: "multiselect", section: "Fare & Booking", options: ["Abacus", "Amadeus", "Sabre", "Travelport", "Travelsky", "Infini", "NewTravelFusion"] },
  { key: "fareType", label: "Fare Type", type: "multiselect", section: "Fare & Booking", options: ["Publish", "Private"] },
  { key: "cabin", label: "Cabin", type: "multiselect", section: "Fare & Booking", options: ["Economy", "Premium Economy", "Business", "First"] },
  { key: "rbd", label: "RBD", type: "textarea", section: "Fare & Booking", placeholder: "As per fare brands below\n\nBasic - USD 20\nValue - USD 30\nComfort - USD 35\nDeluxe - USD 40" },
  { key: "tripType", label: "Trip type", type: "select", section: "Fare & Booking", options: ["OW", "RT", "OJ", "All (All=OW+RT+OJ+Others)"] },
  { key: "channel", label: "Channel", type: "text", section: "Fare & Booking" },

  // Routing
  { key: "codeShare", label: "Code Share", type: "select", section: "Routing", options: ["1. Allowed", "2. Not allowed"] },
  { key: "codeShareScope", label: "Code Share Scope", type: "text", section: "Routing" },
  { key: "interline", label: "Interline", type: "select", section: "Routing", options: ["Yes", "No"] },
  { key: "interlineScope", label: "Interline Scope", type: "text", section: "Routing" },
  { key: "routeOriginDest", label: "Route (Origin to Destination)", type: "textarea", section: "Routing", required: true, placeholder: "Origin\n\nPMI/GVA/LHR/MXP/AGP/CDG/DUB/DUB/AMS/CPH/VIE/PRG/ZRH/MUC/BRU/BCN/NCE/MAN/LIS/MAD/FRA/FCO/WAW/…" },
  { key: "reverseRoute", label: "Applicable to reversed routes (Destination to Origin)", type: "select", section: "Routing", options: ["Yes", "No"] },
  { key: "transferPoint", label: "Transfer Point", type: "text", section: "Routing" },

  // Ticketing
  { key: "tourCode", label: "Tour Code", type: "text", section: "Ticketing" },
  { key: "accountCode", label: "Account Code", type: "text", section: "Ticketing" },
  { key: "ticketDesignator", label: "Ticket Designator", type: "text", section: "Ticketing" },
  { key: "fareBasis", label: "Fare Basis", type: "text", section: "Ticketing" },
  { key: "passengerType", label: "Passenger Type", type: "select", section: "Ticketing", options: ["ADT", "CHD", "INF", "ALL"] },

  // Incentive & Payment
  { key: "backendIncentive", label: "Backend Incentive Amount/Rate per Ticket", type: "textarea", section: "Incentive & Payment", placeholder: "e.g. Basic - USD 20\nValue - USD 30\nComfort - USD 35\nDeluxe - USD 40" },
  { key: "currency", label: "Currency", type: "select", section: "Incentive & Payment", options: ["USD", "AED", "SAR", "GBP", "EUR"] },
  { key: "isYr", label: "Is applicable to YR", type: "select", section: "Incentive & Payment", options: ["Yes", "No"] },
  { key: "isYq", label: "Is applicable to YQ", type: "select", section: "Incentive & Payment", options: ["Yes", "No"] },
  { key: "tripEntity", label: "Trip Entity", type: "select", section: "Incentive & Payment", options: ["TRIP AIR TICKETING (UK) LIMITED", "TRIP.COM TRAVEL SINGAPORE PTE. LTD.", "TRIP.COM INTERNATIONAL GMBH", "TRAVIX TRAVEL INDIA PVT LTD", "TRIP AIR TICKETING JAPAN", "TRIP DOT COM MENA TRAVEL AGENCY L.L.C", "TRIP.COM KOREA CO., LTD."] },
  { key: "otherEntities", label: "Other Entities", type: "text", section: "Incentive & Payment", placeholder: "e.g. NA" },
  { key: "paymentMethod", label: "Payment Method", type: "select", section: "Incentive & Payment", options: ["Bank Transfer", "Wire", "BSP Settlement"] },
  { key: "paymentDate", label: "Payment Date", type: "text", section: "Incentive & Payment", placeholder: "e.g. 90 days post completion of the flown period" },
];

// ── Sample2: Commission Management ──

export const COMMISSION_FIELDS: FieldDef[] = [
  // Deal Setup
  { key: "requestSummary", label: "Request Summary", type: "textarea", section: "Deal Setup", required: true, placeholder: "e.g. To release the upfront commission with RX." },
  { key: "stackedWithExisting", label: "Stacked with existing deals", type: "select", section: "Deal Setup", options: ["N", "Y"] },
  { key: "stackingRequirements", label: "Stacking Requirements", type: "textarea", section: "Deal Setup", placeholder: "e.g. We will be having a bonus deal with RX" },

  // Agent & Carrier
  { key: "agentCode", label: "Agent Code", type: "text", section: "Agent & Carrier", required: true, placeholder: "e.g. AEDC" },
  { key: "airline", label: "Airline", type: "text", section: "Agent & Carrier", required: true, placeholder: "e.g. RX" },
  { key: "mc", label: "MC (Marketing Carrier)", type: "text", section: "Agent & Carrier", required: true },
  { key: "oc", label: "OC (Operating Carrier)", type: "text", section: "Agent & Carrier" },

  // Periods
  { key: "travelPeriod", label: "Travel Period", type: "text", section: "Periods", required: true, placeholder: "e.g. 2026/07/26>2026/08/31" },
  { key: "sellingPeriod", label: "Selling Period", type: "text", section: "Periods", placeholder: "e.g. 2026/08/01>2026/08/31" },
  { key: "travelBlackoutPeriod", label: "Travel Blackout Period", type: "text", section: "Periods", placeholder: "e.g. NIL" },
  { key: "salesPeriod", label: "Sales Period", type: "text", section: "Periods", required: true, placeholder: "e.g. 2026/07/26>2026/08/31" },
  { key: "salesBlackoutPeriod", label: "Sales Blackout Period", type: "text", section: "Periods", placeholder: "e.g. NIL" },

  // Fare & Booking
  { key: "gdsType", label: "GDS Type", type: "select", section: "Fare & Booking", options: ["Abacus", "Amadeus", "Sabre", "Travelport", "Travelsky", "Infini", "NewTravelFusion"] },
  { key: "fareType", label: "Fare Type", type: "multiselect", section: "Fare & Booking", options: ["Publish", "Private"] },
  { key: "cabin", label: "Cabin", type: "select", section: "Fare & Booking", options: ["Economy", "Premium Economy", "Business", "First", "All"] },
  { key: "rbd", label: "RBD", type: "text", section: "Fare & Booking", placeholder: "e.g. ALL" },
  { key: "flightType", label: "Flight Type", type: "select", section: "Fare & Booking", options: ["OW", "RT", "OJ", "All (All=OW+RT+OJ+Others)"] },
  { key: "channel", label: "Channel", type: "text", section: "Fare & Booking" },

  // Routing
  { key: "codeShare", label: "Code Share", type: "select", section: "Routing", options: ["Allowed", "Not allowed"] },
  { key: "codeShareScope", label: "Code Share Scope", type: "text", section: "Routing", placeholder: "e.g. NA" },
  { key: "interline", label: "Interline", type: "select", section: "Routing", options: ["Allowed", "Not allowed"] },
  { key: "interlineScope", label: "Interline Scope", type: "text", section: "Routing" },
  { key: "routeOriginDest", label: "Route (Origin to Destination)", type: "text", section: "Routing" },
  { key: "reverseRoute", label: "Above reverse route applicable?", type: "select", section: "Routing", options: ["Yes", "No"] },
  { key: "designatedAirport", label: "Designated Airport Restriction", type: "text", section: "Routing" },
  { key: "transferPoint", label: "Transfer Point", type: "text", section: "Routing" },

  // Ticketing
  { key: "tourCode", label: "Tour Code", type: "text", section: "Ticketing" },
  { key: "formOfTourCode", label: "Form of Tour Code", type: "text", section: "Ticketing" },
  { key: "accountCode", label: "Account Code", type: "text", section: "Ticketing" },
  { key: "ticketDesignator", label: "Ticket Designator", type: "text", section: "Ticketing" },
  { key: "fareBasis", label: "Fare Basis", type: "text", section: "Ticketing" },
  { key: "passengerType", label: "Passenger Type", type: "select", section: "Ticketing", options: ["ADT", "CHD", "INF", "ALL"] },

  // Commission & Payment
  { key: "upfrontCommissionType", label: "Upfront Commission Type", type: "select", section: "Commission", options: ["Rate", "Amount"] },
  { key: "commissionRate", label: "Commission Amount/Rate", type: "textarea", section: "Commission", required: true, placeholder: "e.g. Economy – 4%\nPremium Economy – 6%\nBusiness Class – 8%" },
  { key: "currency", label: "Currency", type: "multiselect", section: "Commission", options: ["USD", "AED", "SAR", "GBP"], placeholder: "e.g. SAR,GBP,AED" },
];

// ── Sample3: Promotional Campaign ──

export const CAMPAIGN_FIELDS: FieldDef[] = [
  // Campaign Setup
  { key: "couponMechanism", label: "Coupon Mechanism", type: "select", section: "Campaign Setup", required: true, options: ["General Coupon", "Ladder Discount", "Flat Discount", "Percentage Off"] },
  { key: "campaignName", label: "Campaign Name", type: "text", section: "Campaign Setup", required: true, placeholder: "e.g. CRM - Summer Sale" },
  { key: "campaignPeriod", label: "Campaign Period", type: "text", section: "Campaign Setup", required: true, placeholder: "e.g. 2026/07/21>2026/07/26" },
  { key: "couponEffectiveTime", label: "Coupon Effective Time", type: "text", section: "Campaign Setup", placeholder: "e.g. 2026/07/21>2026/07/26" },
  { key: "objectives", label: "Objectives", type: "textarea", section: "Campaign Setup", placeholder: "e.g. - Retargeting customers searched in 7.7 that didn't book during 7.7.\n- And target passengers booked OW, and push them to book the Return with us" },
  { key: "costCenter", label: "Cost Center", type: "text", section: "Campaign Setup", placeholder: "e.g. 1409" },
  { key: "ancillaryProduct", label: "Ancillary Product", type: "text", section: "Campaign Setup" },
  { key: "xProductLine", label: "X Product Line", type: "text", section: "Campaign Setup" },

  // Budget
  { key: "usePreviousBudget", label: "Using Previous Campaign Remaining Budget?", type: "select", section: "Budget", options: ["Y", "N"] },
  { key: "previousCampaign", label: "Which Campaign's Remaining Budget?", type: "text", section: "Budget", placeholder: "e.g. SA_SAR125_2026.07.01 / SA_SAR250_2026.07.01" },
  { key: "budgetCurrency", label: "Budget Currency", type: "select", section: "Budget", options: ["USD", "SAR", "AED", "GBP", "EUR"] },
  { key: "totalBudget", label: "Total Budget Amount", type: "money", section: "Budget", placeholder: "e.g. 6000" },
  { key: "budgetFundSource", label: "Budget Fund Source", type: "select", section: "Budget", options: ["Internal", "External", "Shared"] },
  { key: "fundLevel", label: "Fund Level", type: "select", section: "Budget", options: ["Global Level Funding", "Local Level Funding", "Market Level Funding"] },
  { key: "estimatedFundReceiveDay", label: "Estimated Fund Receive Day", type: "date", section: "Budget", placeholder: "e.g. 2026/06/01" },

  // Coupon Configuration
  { key: "couponDropMarket", label: "Coupon Drop Market", type: "text", section: "Coupon Config", required: true, placeholder: "e.g. SA" },
  { key: "couponType", label: "Coupon Type", type: "select", section: "Coupon Config", options: ["Public", "Private", "Internal"] },
  { key: "couponDiscountType", label: "Coupon Discount Type", type: "select", section: "Coupon Config", options: ["Ladder Discount", "Flat Discount", "Percentage Off"] },
  { key: "valuePerCoupon", label: "Value per Coupon (tiered)", type: "textarea", section: "Coupon Config", required: true, placeholder: "Spend 500 - 999: SAR 30 discount\nSpend 1000 - 1999: SAR 60\n2000 - 3499: SAR 100\n3500 - 4999: SAR 175\n5000+: SAR 250" },
  { key: "cappingAmount", label: "Capping Amount", type: "money", section: "Coupon Config", placeholder: "e.g. SAR 250" },
  { key: "minSpendPerOrder", label: "Min Spend Amount per Order", type: "money", section: "Coupon Config", placeholder: "e.g. 500" },
  { key: "couponQuantity", label: "Coupon Quantity", type: "number", section: "Coupon Config", placeholder: "e.g. 90" },
  { key: "maxUsagesPerUid", label: "Max Count Usages per UID", type: "number", section: "Coupon Config", placeholder: "e.g. 1" },

  // Targeting
  { key: "targetedAirlines", label: "Targeted Airline(s)", type: "multiselect", section: "Targeting", options: ["SV", "F3", "MS", "EY", "GF", "EK", "QR", "AI"] },
  { key: "odPairType", label: "OD Pair Type", type: "select", section: "Targeting", options: ["Country", "City", "Route", "Region"] },
  { key: "odPairs", label: "OD Pair(s)", type: "textarea", section: "Targeting", placeholder: "SA-EG\nSA-TR\nSA-IN\nSA-ID\nSA-PK\nSA-TH\nSA-PH\nSA-AE\nSA-MA\nSA-GB" },
  { key: "cabinClass", label: "Cabin Class", type: "multiselect", section: "Targeting", options: ["Economy", "Premium Economy", "Business", "First"] },
  { key: "tripType", label: "Trip Type", type: "multiselect", section: "Targeting", options: ["OW", "RT"] },
  { key: "travelPeriod", label: "Travel Period", type: "text", section: "Targeting", placeholder: "e.g. 2026/07/07>2026/09/15 OB" },
  { key: "additionalRestrictions", label: "Any Additional Restrictions Needed?", type: "textarea", section: "Targeting" },
  { key: "additionalInfo", label: "Additional Information", type: "textarea", section: "Targeting" },
];

// Form type discriminant
export type FormCategory = "flight-incentive" | "commission" | "campaign";

export function getFormCategoryName(cat: FormCategory): string {
  switch (cat) {
    case "flight-incentive": return "Flight Incentive Program";
    case "commission": return "Commission Management";
    case "campaign": return "Promotional Campaign";
  }
}
