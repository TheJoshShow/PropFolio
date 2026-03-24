/**
 * Property import orchestration: geocode + rent enrichment, manual-address validation.
 * Link imports (Zillow/Redfin) skip strict manual verification — listing-derived lines are trusted.
 */

import { geocodeAddress, rentEstimate } from './edgeFunctions';
import { isGeocodeNoResultsError } from './edgeFunctionResponses';
import { logImportStep, reportIntegrationStatus } from './diagnostics';
import { recordFlowException, recordFlowIssue } from './monitoring/flowInstrumentation';
import { isUsAddressLineLikelyComplete } from './importAddressValidation';
import type { ImportErrorCode } from './importErrorCodes';
import type { ImportSource } from './importLimits';

export interface EnrichedAddressForImport {
  addressLine: string;
  geocodeLat?: number;
  geocodeLng?: number;
  rent?: number;
  rentUnavailable: boolean;
}

export type EnrichAddressResult =
  | { ok: true; enriched: EnrichedAddressForImport }
  | { ok: false; code: ImportErrorCode };

/** RentCast / edge may return rent as number or numeric string. */
function coerceMonthlyRent(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[,_$]/g, ''));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

function isGeocodeZeroMatch(data: { lat: number | null; lng: number | null; formatted_address: string | null } | null): boolean {
  if (!data) return true;
  return (
    data.formatted_address == null &&
    (data.lat == null || data.lng == null || !Number.isFinite(data.lat) || !Number.isFinite(data.lng))
  );
}

/**
 * Geocode + rent for import. Manual source applies verification when geocode cannot confirm.
 * Link sources: always proceed with best-effort line (slug or geocoded).
 */
export async function enrichAddressForImport(params: {
  trimmedAddressLine: string;
  hasSupabase: boolean;
  source: ImportSource;
}): Promise<EnrichAddressResult> {
  const { trimmedAddressLine, hasSupabase, source } = params;
  const isManual = source === 'manual';

  if (!hasSupabase) {
    if (isManual && !isUsAddressLineLikelyComplete(trimmedAddressLine)) {
      return { ok: false, code: 'ADDRESS_NOT_VERIFIED' };
    }
    return {
      ok: true,
      enriched: { addressLine: trimmedAddressLine, rentUnavailable: true },
    };
  }

  let addressLine = trimmedAddressLine;
  let geocodeLat: number | undefined;
  let geocodeLng: number | undefined;
  let rent: number | undefined;
  let rentUnavailable = false;

  try {
    const geocodeRes = await geocodeAddress(trimmedAddressLine);
    reportIntegrationStatus({
      integration: 'google_maps',
      configured: hasSupabase,
      requestSuccess: !geocodeRes.error,
      lastFailureReason: geocodeRes.error ?? null,
      fallbackUsed: Boolean(geocodeRes.error),
      featureImpact: isManual ? 'partial' : 'none',
    });

    if (geocodeRes.error && __DEV__) {
      logImportStep('geocode_warning', { stage: 'import_enrich', hasError: true, manual: isManual });
    }

    const structural = isUsAddressLineLikelyComplete(trimmedAddressLine);
    const zeroMatch = isGeocodeZeroMatch(geocodeRes.data);
    const hardGeocodeError = Boolean(geocodeRes.error && !isGeocodeNoResultsError(geocodeRes.error));

    if (isManual) {
      if (hardGeocodeError && !structural) {
        recordFlowIssue('import_enrich_blocked', { code: 'GEOCODE_FAILED', source });
        return { ok: false, code: 'GEOCODE_FAILED' };
      }
      if (zeroMatch && !geocodeRes.error && !structural) {
        recordFlowIssue('import_enrich_blocked', { code: 'ADDRESS_NOT_FOUND', source });
        return { ok: false, code: 'ADDRESS_NOT_FOUND' };
      }
    }

    if (!geocodeRes.error && geocodeRes.data?.formatted_address) {
      addressLine = geocodeRes.data.formatted_address;
    }
    const lat = geocodeRes.data?.lat;
    const lng = geocodeRes.data?.lng;
    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      geocodeLat = lat;
      geocodeLng = lng;
    }

    const rentRes = await rentEstimate({ address: addressLine });
    const raw = rentRes.data?.rent ?? (rentRes.data as { monthlyRent?: unknown; rentAmount?: unknown })?.monthlyRent ?? (rentRes.data as { rentAmount?: unknown })?.rentAmount;
    rent = coerceMonthlyRent(raw);
    rentUnavailable = Boolean(rentRes.error && rent == null);
    reportIntegrationStatus({
      integration: 'rentcast',
      configured: hasSupabase,
      requestSuccess: !rentRes.error && rent != null,
      lastFailureReason: rentRes.error ?? (rent == null ? 'No rent value returned' : null),
      fallbackUsed: rentUnavailable,
      featureImpact: rentUnavailable ? 'partial' : 'none',
    });
  } catch (e) {
    recordFlowException('import_enrich_exception', e, { stage: 'enrich', recoverable: true });
    if (isManual && !isUsAddressLineLikelyComplete(trimmedAddressLine)) {
      return { ok: false, code: 'ADDRESS_NOT_VERIFIED' };
    }
    return {
      ok: true,
      enriched: {
        addressLine: trimmedAddressLine,
        rentUnavailable: true,
      },
    };
  }

  return {
    ok: true,
    enriched: {
      addressLine,
      geocodeLat,
      geocodeLng,
      rent,
      rentUnavailable,
    },
  };
}
