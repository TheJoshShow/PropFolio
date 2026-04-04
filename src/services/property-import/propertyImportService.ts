import { generateUuid } from '@/lib/uuid';

import { invokeEdgeFunction } from '../import/edgeInvoke';
import type { InvestmentStrategy } from '@/lib/investmentStrategy';

import type {
  PlacesAutocompleteResponse,
  PlacesResolveResponse,
  PropertyImportResult,
  ResolvedPlaceDto,
} from './types';

export const propertyImportService = {
  async placesAutocomplete(
    input: string,
    sessionToken: string,
    correlationId: string,
  ): Promise<PlacesAutocompleteResponse> {
    return invokeEdgeFunction<PlacesAutocompleteResponse>('places-autocomplete', {
      input: input.trim().slice(0, 200),
      sessionToken,
      correlationId,
    });
  },

  async placesResolve(
    placeId: string,
    correlationId: string,
  ): Promise<PlacesResolveResponse> {
    return invokeEdgeFunction<PlacesResolveResponse>('places-resolve', {
      placeId,
      correlationId,
    });
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
    return invokeEdgeFunction<PropertyImportResult>('import-property', body, { retries: 0 });
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
      { retries: 0 },
    );
  },
};
