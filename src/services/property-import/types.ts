import type { PropertySnapshotV1 } from '@/types/property';

export type ResolvedPlaceDto = {
  placeId: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
};

export type AutocompletePrediction = { placeId: string; text: string };

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
