import { generateUuid } from '@/lib/uuid';

import {
  IMPORT_PROPERTY_TIMEOUT_MS,
  invokeEdgeFunction,
} from '../import/edgeInvoke';

const PLACES_EDGE_TIMEOUT_MS = 55_000;
import type { InvestmentStrategy } from '@/lib/investmentStrategy';

import type {
  PlacesAutocompleteResponse,
  PlacesResolveResponse,
  PropertyImportResult,
  ResolvedPlaceDto,
} from './types';
import { parsePlacesAutocompletePayload, parseResolvedPlaceDto } from './placesResponseTransforms';

/**
 * Edge functions may return `{ error: string }` in the JSON body; Supabase can still surface that as `data`.
 * Treat that as failure so callers don't silently show an empty suggestion list.
 */
function parsePlacesResolvePayload(payload: unknown): PlacesResolveResponse {
  if (payload == null || typeof payload !== 'object') {
    throw new Error('Invalid response from place details');
  }
  const o = payload as Record<string, unknown>;
  if (typeof o.error === 'string' && o.error.length > 0) {
    throw new Error(o.error);
  }
  const base = parseResolvedPlaceDto(o);
  const raw = o.addressComponents;
  const addressComponents = Array.isArray(raw) ? raw : undefined;
  return {
    ...base,
    addressComponents,
  };
}

/** Deployed Edge folder names (`supabase/functions/<name>`). */
const PLACES_AUTOCOMPLETE_FUNCTION = 'places-autocomplete';
const PLACES_RESOLVE_FUNCTION = 'places-resolve';

export const propertyImportService = {
  async autocompleteAddress(
    input: string,
    sessionToken: string,
    correlationId: string,
    opts?: { signal?: AbortSignal },
  ): Promise<PlacesAutocompleteResponse> {
    const payload = await invokeEdgeFunction<unknown>(
      PLACES_AUTOCOMPLETE_FUNCTION,
      {
        query: input.trim().slice(0, 200),
        sessionToken,
        correlationId,
      },
      { retries: 2, timeoutMs: PLACES_EDGE_TIMEOUT_MS, signal: opts?.signal },
    );
    return parsePlacesAutocompletePayload(payload);
  },

  async placesAutocomplete(
    input: string,
    sessionToken: string,
    correlationId: string,
    opts?: { signal?: AbortSignal },
  ): Promise<PlacesAutocompleteResponse> {
    return propertyImportService.autocompleteAddress(input, sessionToken, correlationId, opts);
  },

  async resolvePlaceDetails(
    placeId: string,
    correlationId: string,
    sessionToken?: string,
  ): Promise<PlacesResolveResponse> {
    const body: Record<string, unknown> = {
      placeId,
      correlationId,
    };
    if (sessionToken?.trim()) {
      body.sessionToken = sessionToken.trim();
    }
    const payload = await invokeEdgeFunction<unknown>(PLACES_RESOLVE_FUNCTION, body, {
      retries: 2,
      timeoutMs: PLACES_EDGE_TIMEOUT_MS,
    });
    return parsePlacesResolvePayload(payload);
  },

  async placesResolve(
    placeId: string,
    correlationId: string,
    sessionToken?: string,
  ): Promise<PlacesResolveResponse> {
    return propertyImportService.resolvePlaceDetails(placeId, correlationId, sessionToken);
  },

  /**
   * Paste Zillow/Redfin URL. If server returns NEEDS_ADDRESS, confirm with Places then call again with resolvedPlace.
   */
  async importFromListingUrl(
    url: string,
    resolvedPlace: ResolvedPlaceDto | null,
    investmentStrategy: InvestmentStrategy,
    correlationId?: string,
  ): Promise<PropertyImportResult> {
    const cid = correlationId ?? generateUuid();
    const body: Record<string, unknown> = {
      mode: 'listing_url',
      url,
      correlationId: cid,
      investmentStrategy,
    };
    if (resolvedPlace) {
      body.resolvedPlace = resolvedPlace;
    }
    return invokeEdgeFunction<PropertyImportResult>('import-property', body, {
      retries: 2,
      timeoutMs: IMPORT_PROPERTY_TIMEOUT_MS,
    });
  },

  async importFromManualPlace(
    resolvedPlace: ResolvedPlaceDto,
    investmentStrategy: InvestmentStrategy,
    correlationId?: string,
  ): Promise<PropertyImportResult> {
    const cid = correlationId ?? generateUuid();
    return invokeEdgeFunction<PropertyImportResult>(
      'import-property',
      {
        mode: 'manual_place',
        correlationId: cid,
        resolvedPlace,
        investmentStrategy,
      },
      { retries: 2, timeoutMs: IMPORT_PROPERTY_TIMEOUT_MS },
    );
  },
};
