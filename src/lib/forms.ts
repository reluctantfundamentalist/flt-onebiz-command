// Real fltonebiz form field schemas for Promo Fund and Upfront Commission.
// `open` = the label for the "keep open / all" choice when the structurer can't
// fill the field (e.g. RBD not in attachment -> "All RBDs").

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "select"
  | "multiselect"
  | "date"
  | "daterange"
  | "people"
  | "attachment"
  | "fixed";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: string[];
  open?: string; // label for the "All / open" quick choice
  autofilled?: boolean;
  flag?: boolean;
}

export interface FormSection {
  title: string;
  fields: Field[];
}

export interface FormSchema {
  sheetType: string;
  sections: FormSection[];
}

export const PROMO_FUND_SCHEMA: FormSchema = {
  sheetType: "Promo Fund",
  sections: [
    {
      title: "Basic Info",
      fields: [
        { key: "market", label: "Market", type: "select", required: true, options: ["AE", "SA", "QA", "BH", "KW", "OM", "EU", "IN", "SG", "CN", "KR", "NA"] },
        { key: "theme", label: "Theme", type: "text", required: true, helper: "Auto: Agentcode_AirlineCode_AppDate", autofilled: true },
        { key: "approvers", label: "Approvers", type: "people", required: true, helper: "Fixed per market" },
        { key: "sheetType", label: "Sheet type", type: "fixed", required: true },
        { key: "requestSummary", label: "Request Summary", type: "textarea" },
        { key: "ccList", label: "CCList", type: "people", helper: "Fixed per market" },
      ],
    },
    {
      title: "Budget Approval Info",
      fields: [
        { key: "fundPoolApprovalKey", label: "Fund Pool Approval Key", type: "select", required: true, options: [], open: "Standard pool" },
      ],
    },
    {
      title: "Trip Info",
      fields: [
        { key: "validatingCarrier", label: "Validating Carrier", type: "select", required: true, helper: "From note/attachment; fallback sender email domain" },
        { key: "operatingCarrier", label: "Operating Carrier", type: "text", helper: "If all, leave empty", open: "Same as validating" },
        { key: "rbd", label: "RBD", type: "text", helper: "From attachment", open: "All RBDs" },
        { key: "brandnames", label: "Brandnames", type: "text", helper: "From attachment", open: "All brands" },
        { key: "interline", label: "Interline", type: "select", options: ["All allowed", "Not allowed"] },
        { key: "arrivalArea", label: "Arrival Area", type: "text", placeholder: "City", open: "All cities" },
        { key: "outboundBlackout", label: "Outbound Blackout Period", type: "daterange", open: "None" },
        { key: "inboundBlackout", label: "Inbound Blackout Period", type: "daterange", open: "None" },
      ],
    },
    {
      title: "Fund Info",
      fields: [
        { key: "totalBudget", label: "Total Budget", type: "money", required: true },
        { key: "currency", label: "Currency", type: "select", options: ["USD", "EUR", "AED", "SAR", "SGD"] },
        { key: "marketingCarrier", label: "Marketing Carrier", type: "text", helper: "If all, leave empty", open: "All" },
        { key: "cabin", label: "Cabin", type: "multiselect", required: true, options: [], open: "All cabins" },
        { key: "tripType", label: "Trip Type", type: "multiselect", required: true, options: ["OW", "RT", "MT", "ALL"], open: "All trip types" },
        { key: "validity", label: "Fund Validity", type: "daterange", open: "All dates" },
        { key: "passengerType", label: "Passenger Type", type: "multiselect", required: true, options: ["ADT", "CHD", "INF", "STU"], open: "All passenger types" },
      ],
    },
    {
      title: "Supply Info",
      fields: [
        { key: "agentCode", label: "Agent Code", type: "multiselect", required: true, options: [], open: "All agents", helper: "From theme (agentcode_airlinecode_date)" },
        { key: "farebasis", label: "Farebasis", type: "text", helper: "From attachment", open: "All farebasis" },
        { key: "fareType", label: "FareType", type: "multiselect", options: ["Publish", "Private"], open: "All fare types" },
      ],
    },
    {
      title: "Campaign Info",
      fields: [
        { key: "channel", label: "Channel", type: "text", helper: "If all, leave empty", open: "All channels" },
        { key: "gds", label: "GDS", type: "multiselect", required: true, options: ["1A", "1B", "1S", "TF", "1G", "1E"], open: "All GDSs" },
        { key: "accountCode", label: "AccountCode", type: "text", helper: "From attachment", open: "All account codes" },
        { key: "ringfence", label: "Need POS=POC Ringfence?", type: "select", options: ["No", "Yes"] },
        { key: "displayMode", label: "Display Mode", type: "select", options: [], open: "Airline logo shown" },
      ],
    },
    {
      title: "Appendix",
      fields: [{ key: "attachment", label: "Upload attachment", type: "attachment" }],
    },
  ],
};

export const UPFRONT_COMMISSION_SCHEMA: FormSchema = {
  sheetType: "Upfront Commission",
  sections: [
    {
      title: "Basic Info",
      fields: [
        { key: "market", label: "Market", type: "select", required: true, options: ["AE", "SA", "QA", "BH", "KW", "OM", "EU", "IN", "SG", "CN", "KR", "NA"] },
        { key: "theme", label: "Theme", type: "text", required: true, helper: "Auto: Agentcode_AirlineCode_AppDate", autofilled: true },
        { key: "commissionType", label: "Commission type", type: "select", required: true, options: ["Market Commission"] },
        { key: "validatingCarrier", label: "Validating Carrier", type: "select", required: true, helper: "From note/attachment; fallback sender email domain" },
        { key: "operatingCarrier", label: "Operating Carrier", type: "text", helper: "Always same as validating carrier", open: "Same as validating" },
        { key: "vvReverseRoute", label: "V.V. (reverse route)", type: "text" },
        { key: "transferPoint", label: "Transfer Point", type: "text" },
        { key: "amountType", label: "Amount type", type: "select", required: true, options: ["%", "Absolute"] },
        { key: "sheetType", label: "Sheet type", type: "fixed", required: true },
        { key: "requestSummary", label: "Request Summary", type: "textarea" },
        { key: "agentCode", label: "Agent Code", type: "multiselect", required: true, options: [], open: "All agents", helper: "From theme (agentcode_airlinecode_date)" },
        { key: "marketingCarrier", label: "Marketing Carrier", type: "text", helper: "Same as validating carrier", open: "All" },
        { key: "routeRestriction", label: "Route restriction", type: "select", required: true, options: ["POC = POS only (SITI only)", "All POS"], helper: "POS=POC only → restrict; else All POS" },
        { key: "stackedCommission", label: "Stacked with existing commission", type: "select", required: true, options: ["Yes", "No"] },
        { key: "stackedIncentive", label: "Stacked with existing incentive", type: "select", required: true, options: ["Yes", "No"] },
        { key: "outboundTravel", label: "Outbound travel date", type: "daterange", open: "All dates" },
        { key: "inboundTravel", label: "Inbound travel date", type: "daterange", open: "All dates" },
        { key: "salesStart", label: "Sales Start Date", type: "date", open: "All dates" },
        { key: "salesEnd", label: "Sales End Date", type: "date", open: "All dates" },
        { key: "salesBlackout", label: "Sales Blackout Period", type: "daterange", open: "None" },
        { key: "travelBlackout", label: "Travel Blackout Period", type: "daterange", open: "None" },
        { key: "fareType", label: "Fare Type", type: "select", required: true, options: ["Publish", "Private"], open: "All fare types" },
        { key: "gdsEngineType", label: "GDS Engine Type", type: "multiselect", required: true, options: ["1A", "1B", "1S", "TF", "1G", "1E"], open: "All GDS engines" },
        { key: "cabin", label: "Cabin", type: "multiselect", required: true, options: [], open: "All cabins" },
        { key: "tripType", label: "Trip Type", type: "multiselect", options: ["OW", "RT", "MT", "ALL"], open: "All trip types" },
        { key: "codeShare", label: "Code Share", type: "select", required: true, options: ["Y", "N"], open: "All code-share" },
        { key: "channel", label: "Channel", type: "text", open: "All channels" },
        { key: "codeShareScope", label: "Code Share Scope", type: "text", open: "All scope" },
        { key: "designatedAirport", label: "Designated Airport", type: "text", open: "All airports" },
        { key: "tourCode", label: "Tour Code", type: "text", open: "All tour codes" },
      ],
    },
    {
      title: "Others",
      fields: [
        { key: "accountCode", label: "Account Code", type: "text", helper: "From attachment", open: "All account codes" },
        { key: "farebasis", label: "fare basis", type: "text", helper: "From attachment", open: "All farebasis" },
        { key: "attachment", label: "Attachment", type: "attachment" },
        { key: "ticketDesignator", label: "Ticket Designator", type: "text", open: "All" },
        { key: "passengerType", label: "Passenger Type", type: "multiselect", options: ["ADT", "CHD", "INF", "STU"], open: "All passenger types" },
      ],
    },
  ],
};
