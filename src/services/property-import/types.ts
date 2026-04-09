import type { PropertySnapshotV1 } from '@/types/property';

export type ResolvedPlaceDto = {
  placeId: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
  normalizedOneLine?: string | null;
  streetNumber?: string | null;
  route?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

/** Up to 5 items from `places-autocomplete`; `text` mirrors legacy full-line display. */
export type AutocompletePrediction = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
  /** @deprecated prefer fullText */
  text: string;
};

export type PlacesAutocompleteResponse = { predictions: AutocompletePrediction[] };

export type PlacesResolveResponse = ResolvedPlaceDto & {
  addressComponents?: unknown[];
};

export type PropertyImportNeedsAddress = {
  ok: false;
  code: 'NEEDS_ADDRESS';
  listing: {
    provider: 'zillow' | 'redfin';
    canonicalUrl: string;
    addressHint: string | null;
    externalIds: Record<string, string | undefined>;
  };
};

export type PropertyImportSuccess = {
  ok: true;
  propertyId: string;
  status: 'draft' | 'ready' | 'error';
  missingFields: string[];
  snapshot: PropertySnapshotV1;
  /** Wallet balance after this import (when server included it). */
  balance_after?: number | null;
  /** True when the server decremented one import credit (`status === 'ready'`). */
  credit_consumed?: boolean;
  /** Same correlationId already completed — no duplicate charge or property row. */
  idempotentReplay?: boolean;
};

export type PropertyImportFailure = { ok: false; error?: string; message?: string };

export type PropertyImportInsufficientCredits = {
  ok: false;
  code: 'INSUFFICIENT_CREDITS';
  message?: string;
  balance_after?: number;
};

export type PropertyImportSubscriptionRequired = {
  ok: false;
  code: 'SUBSCRIPTION_REQUIRED';
  message?: string;
  balance_after?: number;
};

export type PropertyImportCreditConsumeFailed = {
  ok: false;
  code: 'CREDIT_CONSUME_FAILED';
  message?: string;
};

export type PropertyImportResult =
  | PropertyImportSuccess
  | PropertyImportNeedsAddress
  | PropertyImportFailure
  | PropertyImportInsufficientCredits
  | PropertyImportSubscriptionRequired
  | PropertyImportCreditConsumeFailed;
