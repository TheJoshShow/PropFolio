/**
 * Isolated RentCast long-term rent AVM — same adapter as import; no property row writes.
 */
import { requireAuthedUser } from '../_shared/auth.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logStructured } from '../_shared/logger.ts';
import {
  extractRentMonthly,
  fetchRentLongTerm,
} from '../_shared/providers/rentcast.ts';
import { clampStr, isNonEmptyString, optionalString } from '../_shared/validate.ts';
import { withRetry } from '../_shared/retry.ts';

type Body = { addressLine?: string; correlationId?: string };

const TIMEOUT_MS = 14_000;

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
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'addressLine required' } },
        400,
      );
    }
    const addressLine = clampStr(raw.trim(), 500);

    const apiKey = Deno.env.get('RENTCAST_API_KEY') ?? '';
    if (!apiKey) {
      return jsonResponse(
        { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Rent estimate unavailable' } },
        503,
      );
    }

    const result = await withRetry(
      async () => {
        const r = await fetchRentLongTerm(addressLine, apiKey, TIMEOUT_MS);
        if (!r.ok) {
          throw new Error(r.error);
        }
        return r;
      },
      { retries: 2, baseDelayMs: 400, label: 'rentcast_rent' },
    );

    const monthly = extractRentMonthly(result.data);

    logStructured({
      scope: 'rent_estimate',
      step: 'complete',
      status: monthly != null ? 'ok' : 'partial',
      correlationId,
      userId,
      provider: 'rentcast',
    });

    return jsonResponse({
      ok: true,
      rentEstimateMonthly: monthly,
      hasProviderPayload: result.data != null,
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
      { scope: 'rent_estimate', step: 'fatal', status: 'fail', correlationId, message: msg },
      'error',
    );
    return jsonResponse(
      { ok: false, error: { code: 'PROVIDER_ERROR', message: 'Rent estimate failed' } },
      502,
    );
  }
});
