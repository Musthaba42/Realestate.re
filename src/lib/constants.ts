export type Option = { value: string; label: string };

export const PROPERTY_TYPES = [
  { value: "land", label: "Land" },
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "commercial", label: "Commercial" },
] as const satisfies readonly Option[];

export const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((t) => t.value);

/** Types where BHK / bedrooms make sense. */
export const RESIDENTIAL_TYPES = ["house", "apartment"];

export const PROPERTY_STATUSES = [
  { value: "available", label: "For Sale" },
  { value: "new", label: "New" },
  { value: "under_construction", label: "Under Construction (For Sale)" },
  { value: "ready_to_move", label: "Ready to Move" },
  { value: "coming_soon", label: "Coming Soon" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
  { value: "not_available", label: "Not Available" },
] as const satisfies readonly Option[];

/** Statuses a buyer can still enquire about. */
export const OPEN_STATUSES = ["available", "new", "under_construction", "ready_to_move", "coming_soon"];

export const FACINGS = [
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "north-east", label: "North-East" },
  { value: "north-west", label: "North-West" },
  { value: "south-east", label: "South-East" },
  { value: "south-west", label: "South-West" },
] as const satisfies readonly Option[];

export const CONSTRUCTION_STAGES = [
  { value: "not_started", label: "Not Started" },
  { value: "planning", label: "Planning" },
  { value: "foundation", label: "Foundation" },
  { value: "structure", label: "Structure" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
] as const satisfies readonly Option[];

export const ROAD_TYPES = [
  { value: "main_road", label: "Main Road" },
  { value: "40ft", label: "40 Feet Road" },
  { value: "30ft", label: "30 Feet Road" },
  { value: "20ft", label: "20 Feet Road" },
  { value: "internal", label: "Internal Road" },
  { value: "tar", label: "Tar Road" },
  { value: "concrete", label: "Concrete Road" },
  { value: "proposed", label: "Proposed Road" },
  { value: "under_construction", label: "Road Under Construction" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const APPROVAL_TYPES = [
  { value: "dtcp", label: "DTCP" },
  { value: "cmda", label: "CMDA" },
  { value: "rera", label: "RERA" },
  { value: "panchayat", label: "Panchayat" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const MEDIA_CATEGORIES = [
  { value: "exterior", label: "Exterior" },
  { value: "interior", label: "Interior" },
  { value: "road", label: "Road / Location" },
  { value: "construction", label: "Construction Progress" },
  { value: "walkthrough", label: "Walkthrough" },
  { value: "promo", label: "Promotional" },
] as const satisfies readonly Option[];

export const LANDMARK_KINDS = [
  { value: "transport", label: "Railway / Metro / Bus" },
  { value: "highway", label: "Highway / Main road" },
  { value: "airport", label: "Airport" },
  { value: "school", label: "School / College" },
  { value: "hospital", label: "Hospital" },
  { value: "temple", label: "Temple / Place of worship" },
  { value: "shopping", label: "Market / Mall" },
  { value: "office", label: "IT park / Offices" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const MAX_LANDMARKS = 12;

export const LEAD_SOURCES = [
  { value: "interested", label: "I am Interested" },
  { value: "no_results", label: "Search – no results" },
  { value: "loan", label: "Loan enquiry" },
  { value: "contact", label: "Contact form" },
] as const satisfies readonly Option[];

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "site_visit", label: "Site Visit" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed", label: "Closed (Won)" },
  { value: "lost", label: "Lost" },
] as const satisfies readonly Option[];

export const SELLER_STATUSES = [
  { value: "pending", label: "Pending Review" },
  { value: "needs_info", label: "Needs More Info" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const satisfies readonly Option[];

export const PREFERRED_TIMES = [
  { value: "anytime", label: "Anytime" },
  { value: "morning", label: "Morning (9am – 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm – 4pm)" },
  { value: "evening", label: "Evening (4pm – 8pm)" },
] as const satisfies readonly Option[];

export const BHK_OPTIONS = [
  { value: "1", label: "1 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4 BHK" },
  { value: "5", label: "5+ BHK" },
] as const satisfies readonly Option[];

export const BUDGET_PRESETS = [
  { value: "1000000", label: "₹10 Lakhs" },
  { value: "2000000", label: "₹20 Lakhs" },
  { value: "3000000", label: "₹30 Lakhs" },
  { value: "4000000", label: "₹40 Lakhs" },
  { value: "5000000", label: "₹50 Lakhs" },
  { value: "7500000", label: "₹75 Lakhs" },
  { value: "10000000", label: "₹1 Crore" },
  { value: "20000000", label: "₹2 Crore" },
  { value: "50000000", label: "₹5 Crore" },
] as const satisfies readonly Option[];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const satisfies readonly Option[];

export function labelOf(list: readonly Option[], value: string | null | undefined): string {
  if (!value) return "";
  return list.find((o) => o.value === value)?.label ?? value;
}

export const LOAN_DISCLAIMER =
  "Loan/financing is subject to lender approval, applicant eligibility, property valuation and documentation. We assist with the process; we do not guarantee loan approval or amount.";

export const CONSENT_TEXT =
  "By submitting, you agree to be contacted by our team by call or WhatsApp about this enquiry.";

export const SELL_MAX_PHOTOS = 15;
export const SELL_MAX_VIDEOS = 2;
