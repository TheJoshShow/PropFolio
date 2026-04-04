import { requireAuthedUser } from '../_shared/auth.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logStructured } from '../_shared/logger.ts';

type Body = { placeId?: string; correlationId?: string };

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
    const rawId = (body.placeId ?? '').trim();
    if (!rawId) {
      return jsonResponse({ error: 'placeId required' }, 400);
    }

    const resourceName = rawId.startsWith('places/') ? rawId : `places/${rawId}`;
    const key = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!key) {
      logStructured(
        {
          scope: 'places',
          step: 'resolve',
          status: 'fail',
          correlationId,
          userId,
          message: 'GOOGLE_MAPS_API_KEY missing',
        },
        'error',
      );
      return jsonResponse({ error: 'Places is not configured' }, 503);
    }

    const url = `https://places.googleapis.com/v1/${resourceName}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'id,formattedAddress,location,addressComponents',
      },
    });

    if (!res.ok) {
      const t = await res.text();
      logStructured({
        scope: 'places',
        step: 'resolve',
        status: 'fail',
        correlationId,
        userId,
        geocoding: 'place_details',
        message: `google ${res.status}`,
        extra: { body: t.slice(0, 500) },
      });
      return jsonResponse({ error: 'Could not resolve place' }, 502);
    }

    const place = (await res.json()) as {
      id?: string;
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
    };

    const shortPlaceId = place.id?.replace(/^places\//, '') ?? rawId.replace(/^places\//, '');

    logStructured({
      scope: 'places',
      step: 'resolve',
      status: 'ok',
      correlationId,
      userId,
      geocoding: 'place_details',
    });

    return jsonResponse({
      placeId: shortPlaceId,
      formattedAddress: place.formattedAddress ?? '',
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
      addressComponents: place.addressComponents ?? [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    logStructured(
      {
        scope: 'places',
        step: 'resolve',
        status: 'fail',
        correlationId,
        message: msg,
      },
      'error',
    );
    return jsonResponse({ error: 'Server error' }, 500);
  }
});
