/**
 * Renovation line-item ledger (snapshot + optional user overrides).
 * Keys are stable for import/API mapping; labels are UI-only.
 */

export const RENOVATION_CATEGORY_DEFS = [
  { key: 'roofExteriorEnvelope', label: 'Roof / exterior envelope' },
  { key: 'windowsDoors', label: 'Windows / doors' },
  { key: 'hvac', label: 'HVAC' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'plumbing', label: 'Plumbing' },
  { key: 'foundationStructural', label: 'Foundation / structural' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'bathrooms', label: 'Bathrooms' },
  { key: 'flooring', label: 'Flooring' },
  { key: 'paintDrywall', label: 'Paint / drywall' },
  { key: 'appliances', label: 'Appliances' },
  { key: 'siteWorkExteriorImprovements', label: 'Site work / exterior improvements' },
  { key: 'contingency', label: 'Contingency' },
] as const;

export type RenovationCategoryKey = (typeof RENOVATION_CATEGORY_DEFS)[number]['key'];

/** Partial map; omitted keys = no amount. Values may be null in JSON. */
export type RenovationItemsV1 = Partial<Record<RenovationCategoryKey, number | null>>;

export type RenovationBlockV1 = {
  version?: '1';
  items?: RenovationItemsV1;
};
