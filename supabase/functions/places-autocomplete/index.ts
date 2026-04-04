import { requireAuthedUser } from '../_shared/auth.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logStructured } from '../_shared/logger.ts';

type Body = { input?: string; sessionToken?: string; correlationId?: string };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let correlationId = '';
  try {
    const { userId } = await requireAuthedUser(req);
    const body = (await req.json()) as Body;
    correlationId = body.correlationId ?? '';
    const input = (body.input ?? '').trim();
    if (input.length < 2) {
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
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text',
      },
      body: JSON.stringify({
        input,
        sessionToken: body.sessionToken || undefined,
        languageCode: 'en',
        regionCode: 'US',
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
      suggestions?: Array<{
        placePrediction?: {
          place?: string;
          placeId?: string;
          text?: { text?: string };
        };
      }>;
    };

    const predictions =
      data.suggestions?.map((s) => {
        const p = s.placePrediction;
        const placeId = p?.placeId ?? p?.place?.replace(/^places\//, '') ?? '';
        const text = p?.text?.text ?? '';
        return { placeId, text };
      }).filter((x) => x.placeId) ?? [];

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
});
