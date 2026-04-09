/**
 * Server-side address normalization via Google Geocoding API (legacy JSON endpoint).
 * Keys: GOOGLE_MAPS_API_KEY (Edge secret only).
 */
import { requireAuthedUser } from '../_shared/auth.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logStructured } from '../_shared/logger.ts';
import { clampStr, isNonEmptyString, optionalString } from '../_shared/validate.ts';
import { withRetry } from '../_shared/retry.ts';

type Body = { addressLine?: string; correlationId?: string };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  let correlationId = '';
  try {
    const { userId } = await requireAuthedUser(req);
    const body = (await req.json()) as Body;
    correlationId = optionalString(body.correlationId, 64) ?? '';

    const raw = body.addressLine;
    if (!isNonEmptyString(raw, 500)) {
      return jsonResponse(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'addressLine required (max 500 chars)' } },
        400,
      );
    }
    const addressLine = clampStr(raw.trim(), 500);
    if (addressLine.length < 5) {
      return jsonResponse(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'addressLine too short' } },
        400,
      );
    }

    const key = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!key) {
      logStructured(
        {
          scope: 'address',
          step: 'geocode',
          status: 'fail',
          correlationId,
          userId,
          message: 'GOOGLE_MAPS_API_KEY missing',
        },
        'error',
      );
      return jsonResponse(
        { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Address normalization unavailable' } },
        503,
      );
    }

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?address=${
        encodeURIComponent(addressLine)
      }&key=${encodeURIComponent(key)}`;

    const geo = await withRetry(
      async () => {
        const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
        if (!res.ok) {
          throw new Error(`geocode_http_${res.status}`);
        }
        return res.json() as Promise<{
          status: string;
          results?: Array<{
            formatted_address?: string;
            place_id?: string;
            geometry?: { location?: { lat: number; lng: number } };
            address_components?: unknown[];
          }>;
        }>;
      },
      { retries: 2, baseDelayMs: 300, label: 'geocode' },
    );

    if (geo.status !== 'OK' || !geo.results?.length) {
      logStructured({
        scope: 'address',
        step: 'geocode',
        status: 'fail',
        correlationId,
        userId,
        message: geo.status,
      });
      return jsonResponse({
        ok: true,
        normalized: null,
        googleStatus: geo.status,
        correlationId,
      });
    }

    const r = geo.results[0];
    logStructured({
      scope: 'address',
      step: 'geocode',
      status: 'ok',
      correlationId,
      userId,
    });

    return jsonResponse({
      ok: true,
      normalized: {
        formattedAddress: r.formatted_address ?? '',
        placeId: r.place_id ?? null,
        latitude: r.geometry?.location?.lat ?? null,
        longitude: r.geometry?.location?.lng ?? null,
        addressComponents: r.address_components ?? [],
      },
      correlationId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') {
      return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }
    if (msg === 'SERVER_MISCONFIGURED') {
      return jsonResponse(
        { ok: false, error: { code: 'SERVER_MISCONFIGURED', message: 'Server misconfigured' } },
        500,
      );
    }
    logStructured(
      { scope: 'address', step: 'fatal', status: 'fail', correlationId, message: msg },
      'error',
    );
    return jsonResponse({ ok: false, error: { code: 'INTERNAL', message: 'Server error' } }, 500);
  }
});
