import type { InvestmentStrategy } from '@/lib/investmentStrategy';
import type { RenovationBlockV1 } from '@/types/renovationLedger';

export type { InvestmentStrategy };
export type { RenovationBlockV1 } from '@/types/renovationLedger';

/**
 * Property snapshot v1 — persisted in `properties.snapshot` (JSON).
 * Keep in sync with Edge `snapshot.ts` for scoring + UI.
 */
export type PropertySnapshotV1 = {
  version: '1';
  /** Set on import; legacy rows may omit until backfilled */
  investmentStrategy?: InvestmentStrategy;
  address: {
    formatted: string;
    line1?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
  geo: { lat: number | null; lng: number | null; placeId?: string | null };
  listing?: {
    provider?: 'zillow' | 'redfin' | null;
    canonicalUrl?: string | null;
    externalIds?: Record<string, string | undefined>;
    parsingStatus?: string;
  };
  structure?: {
    beds?: number | null;
    baths?: number | null;
    sqft?: number | null;
    yearBuilt?: number | null;
    propertyType?: string | null;
    /** Multifamily unit count when provider supplies it (e.g. RentCast features.unitCount). */
    unitCount?: number | null;
  };
  financials?: {
    lastSalePrice?: number | null;
    lastSaleDate?: string | null;
    rentEstimateMonthly?: number | null;
    assessedValueLatest?: number | null;
  };
  scoringInputs?: Record<string, number | string | boolean | null>;
  providerNotes?: { rentcastProperty?: boolean; rentcastRent?: boolean };
  /** Optional renovation line-item ledger (import or future editor). */
  renovation?: RenovationBlockV1;
};

export type PropertyStatus = 'draft' | 'ready' | 'error';

export type PropertyRow = {
  id: string;
  user_id: string;
  source_type: string;
  source_url: string | null;
  raw_input: string | null;
  status: PropertyStatus;
  missing_fields: unknown;
  snapshot: PropertySnapshotV1;
  place_id: string | null;
  formatted_address: string | null;
  latitude: number | null;
  longitude: number | null;
  confidence_score: number | null;
  last_import_error: string | null;
  created_at: string;
  updated_at: string;
};

export function parseMissingFields(row: PropertyRow): string[] {
  const m = row.missing_fields;
  if (Array.isArray(m)) {
    return m.filter((x): x is string => typeof x === 'string');
  }
  return [];
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
