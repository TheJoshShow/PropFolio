/**
 * Stable JSON shapes returned by Supabase Edge Functions (invoke with generics).
 * Keep in sync with each Edge Function index handler under `supabase/functions`.
 */

export type EdgeErrorBody = {
  ok: false;
  error: { code: string; message: string };
};

export type NormalizeAddressSuccess = {
  ok: true;
  normalized: {
    formattedAddress: string;
    placeId: string | null;
    latitude: number | null;
    longitude: number | null;
    addressComponents: unknown[];
  } | null;
  googleStatus?: string;
  correlationId?: string;
};

export type NormalizeAddressResponse = NormalizeAddressSuccess | EdgeErrorBody;

export type RentEstimateSuccess = {
  ok: true;
  rentEstimateMonthly: number | null;
  hasProviderPayload: boolean;
  correlationId?: string;
};

export type RentEstimateResponse = RentEstimateSuccess | EdgeErrorBody;

export type GeneratePropertySummarySuccess = {
  ok: true;
  summary: string | null;
  mode: 'ai' | 'placeholder';
  message?: string;
  correlationId?: string;
};

export type GeneratePropertySummaryResponse = GeneratePropertySummarySuccess | EdgeErrorBody;

/** Server-to-server; documented for integration tests only. */
export type RevenueCatWebhookResponse =
  | { ok: true; accepted: true }
  | { ok: true; accepted: false; reason: string }
  | EdgeErrorBody;
