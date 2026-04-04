import type { ListingParseResult } from './listingUrl.ts';
import { extractRentMonthly } from '../_shared/providers/rentcast.ts';

export type ResolvedPlace = {
  placeId: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
};

export type SnapshotV1 = {
  version: '1';
  /** Required on every persisted property import (set in index.ts). */
  investmentStrategy?: 'buy_hold' | 'fix_flip';
  address: {
    formatted: string;
    line1?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
  geo: { lat: number | null; lng: number | null; placeId?: string | null };
  listing?: {
    provider: 'zillow' | 'redfin' | null;
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
  };
  financials?: {
    lastSalePrice?: number | null;
    lastSaleDate?: string | null;
    rentEstimateMonthly?: number | null;
    assessedValueLatest?: number | null;
  };
  scoringInputs: Record<string, number | string | boolean | null>;
  providerNotes: { rentcastProperty?: boolean; rentcastRent?: boolean };
  /** Optional renovation line-item ledger — keep in sync with app `PropertySnapshotV1`. */
  renovation?: {
    version?: '1';
    items?: Record<string, number | string | null | undefined>;
  };
  rawProvider?: { property?: Record<string, unknown> | null; rent?: Record<string, unknown> | null };
};

export function buildSnapshotAndMissing(args: {
  listing: ListingParseResult | null;
  place: ResolvedPlace | null;
  addressForRentcast: string | null;
  rentcastProperty: Record<string, unknown> | null;
  rentcastRent: Record<string, unknown> | null;
}): { snapshot: SnapshotV1; missingFields: string[] } {
  const missing: string[] = [];
  const rcProp = args.rentcastProperty;
  const rentMonthly = extractRentMonthly(args.rentcastRent);

  const formatted =
    args.place?.formattedAddress ||
    (typeof rcProp?.formattedAddress === 'string' ? rcProp.formattedAddress : null) ||
    args.addressForRentcast ||
    '';

  if (!formatted.trim()) {
    missing.push('formatted_address');
  }

  const line1 = (rcProp?.addressLine1 as string) ?? null;
  const city = (rcProp?.city as string) ?? null;
  const state = (rcProp?.state as string) ?? null;
  const zip = (rcProp?.zipCode as string) ?? null;

  const lat =
    args.place?.latitude ??
    (typeof rcProp?.latitude === 'number' ? rcProp.latitude : null);
  const lng =
    args.place?.longitude ??
    (typeof rcProp?.longitude === 'number' ? rcProp.longitude : null);

  if (lat == null || lng == null) {
    missing.push('geo_coordinates');
  }

  const beds = typeof rcProp?.bedrooms === 'number' ? rcProp.bedrooms : null;
  const baths = typeof rcProp?.bathrooms === 'number' ? rcProp.bathrooms : null;
  const sqft = typeof rcProp?.squareFootage === 'number' ? rcProp.squareFootage : null;
  const yearBuilt = typeof rcProp?.yearBuilt === 'number' ? rcProp.yearBuilt : null;
  const propertyType = (rcProp?.propertyType as string) ?? null;

  if (beds == null) {
    missing.push('beds');
  }
  if (baths == null) {
    missing.push('baths');
  }
  if (sqft == null) {
    missing.push('square_footage');
  }
  if (rentMonthly == null) {
    missing.push('rent_estimate');
  }
  if (!rcProp) {
    missing.push('rentcast_property');
  }

  const lastSalePrice = typeof rcProp?.lastSalePrice === 'number' ? rcProp.lastSalePrice : null;
  const lastSaleDate = typeof rcProp?.lastSaleDate === 'string' ? rcProp.lastSaleDate : null;

  let assessed: number | null = null;
  const ta = rcProp?.taxAssessments as Record<string, { value?: number }> | undefined;
  if (ta && typeof ta === 'object') {
    const years = Object.keys(ta).sort();
    const last = years[years.length - 1];
    if (last && typeof ta[last]?.value === 'number') {
      assessed = ta[last].value ?? null;
    }
  }

  const snapshot: SnapshotV1 = {
    version: '1',
    address: {
      formatted,
      line1,
      city,
      state,
      zip,
    },
    geo: {
      lat,
      lng,
      placeId: args.place?.placeId ?? null,
    },
    listing: args.listing
      ? {
        provider: args.listing.provider,
        canonicalUrl: args.listing.canonicalUrl,
        externalIds: args.listing.externalIds,
        parsingStatus: args.listing.parsingStatus,
      }
      : undefined,
    structure: {
      beds,
      baths,
      sqft,
      yearBuilt,
      propertyType,
    },
    financials: {
      lastSalePrice,
      lastSaleDate,
      rentEstimateMonthly: rentMonthly,
      assessedValueLatest: assessed,
    },
    scoringInputs: {
      beds,
      baths,
      sqft,
      yearBuilt,
      rentMonthly,
      lastSalePrice,
      lat,
      lng,
    },
    providerNotes: {
      rentcastProperty: Boolean(rcProp),
      rentcastRent: rentMonthly != null,
    },
    rawProvider: {
      property: rcProp,
      rent: args.rentcastRent,
    },
  };

  return { snapshot, missingFields: [...new Set(missing)] };
}
