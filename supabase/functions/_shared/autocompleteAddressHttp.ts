import { requireAuthedUser } from './auth.ts';
import { corsHeaders, jsonResponse } from './cors.ts';
import { logStructured } from './logger.ts';

export type AutocompleteBody = { input?: string; query?: string; sessionToken?: string; correlationId?: string };

/** Minimum characters before calling Google. */
export const AUTOCOMPLETE_MIN_QUERY_LENGTH = 3;
export const AUTOCOMPLETE_MAX_RESULTS = 5;

/**
 * Shared handler for `places-autocomplete` (deploy under that folder name).
 * Places API (New) — US-only, Chicagoland bias, max 5 predictions.
 */
export async function serveAutocompleteAddress(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let correlationId = '';
  try {
    const { userId } = await requireAuthedUser(req);
    const body = (await req.json()) as AutocompleteBody;
    correlationId = body.correlationId ?? '';
    const input = (body.query ?? body.input ?? '').trim();
    if (input.length < AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      return jsonResponse({ predictions: [] });
    }
    if (input.length > 200) {
      return jsonResponse({ error: 'Input too long' }, 400);
    }

    const key = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!key) {
      logStructured(
        {
          scope: 'places',
          step: 'autocomplete',
          status: 'fail',
          correlationId,
          userId,
          message: 'GOOGLE_MAPS_API_KEY missing',
        },
        'error',
      );
      return jsonResponse({ error: 'Places search is not configured' }, 503);
    }

    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': '*',
      },
      body: JSON.stringify({
        input,
        sessionToken: body.sessionToken?.trim() || undefined,
        languageCode: 'en',
        regionCode: 'us',
        includedRegionCodes: ['us'],
        locationBias: {
          circle: {
            center: { latitude: 41.8781, longitude: -87.6298 },
            radius: 85_000,
          },
        },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      logStructured({
        scope: 'places',
        step: 'autocomplete',
        status: 'fail',
        correlationId,
        userId,
        message: `google ${res.status}`,
        extra: { body: t.slice(0, 500) },
      });
      return jsonResponse({ error: 'Autocomplete failed' }, 502);
    }

    const data = (await res.json()) as {
      error?: { message?: string; status?: string; code?: number };
      suggestions?: Array<{
        placePrediction?: {
          place?: string;
          placeId?: string;
          text?: { text?: string };
          structuredFormat?: {
            mainText?: { text?: string };
            secondaryText?: { text?: string };
          };
        };
      }>;
    };

    if (data.error && typeof data.error === 'object') {
      const msg =
        typeof data.error.message === 'string' && data.error.message.trim()
          ? data.error.message.trim()
          : 'Autocomplete failed';
      logStructured(
        {
          scope: 'places',
          step: 'autocomplete',
          status: 'fail',
          correlationId,
          userId,
          message: msg,
          extra: { code: data.error.code, status: data.error.status },
        },
        'error',
      );
      return jsonResponse({ error: msg }, 502);
    }

    const rawSuggestions = data.suggestions ?? [];
    const predictions = rawSuggestions
      .map((s) => {
        const p = s.placePrediction;
        if (!p) {
          return null;
        }
        const placeResource =
          typeof p.place === 'string' ? p.place.replace(/^places\//, '').trim() : '';
        const placeId = (typeof p.placeId === 'string' ? p.placeId.trim() : '') || placeResource;
        const primaryText = (p.structuredFormat?.mainText?.text ?? '').trim();
        const secondaryText = (p.structuredFormat?.secondaryText?.text ?? '').trim();
        const fullText =
          p.text?.text?.trim() ||
          [primaryText, secondaryText].filter((x) => x.length > 0).join(', ') ||
          '';
        const text = fullText || primaryText || placeId;
        if (!placeId) {
          return null;
        }
        return {
          placeId,
          primaryText: primaryText || text.split(',')[0]?.trim() || text,
          secondaryText,
          fullText: text,
          text,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null)
      .slice(0, AUTOCOMPLETE_MAX_RESULTS);

    if (rawSuggestions.length > 0 && predictions.length === 0) {
      logStructured(
        {
          scope: 'places',
          step: 'autocomplete',
          status: 'warn',
          correlationId,
          userId,
          message: 'suggestions present but no placeId after map',
          extra: { suggestionKeys: rawSuggestions.slice(0, 2).map((x) => Object.keys(x)) },
        },
        'warn',
      );
    }

    logStructured({
      scope: 'places',
      step: 'autocomplete',
      status: 'ok',
      correlationId,
      userId,
      geocoding: 'autocomplete',
      extra: { count: predictions.length },
    });

    return jsonResponse({ predictions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    logStructured(
      {
        scope: 'places',
        step: 'autocomplete',
        status: 'fail',
        correlationId,
        message: msg,
      },
      'error',
    );
    return jsonResponse({ error: 'Server error' }, 500);
  }
}
