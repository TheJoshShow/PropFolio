import { requireAuthedUser } from './auth.ts';
import { corsHeaders, jsonResponse } from './cors.ts';
import { logStructured } from './logger.ts';
import { buildNormalizedOneLine, parsePlacesAddressComponents } from './placesAddressParse.ts';

export type ResolveBody = { placeId?: string; correlationId?: string; sessionToken?: string };

/**
 * Shared handler for `places-resolve` (deploy under that folder name).
 * Place Details (New) — normalized address + lat/lng for import pipeline.
 */
export async function serveResolvePlaceDetails(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let correlationId = '';
  try {
    const { userId } = await requireAuthedUser(req);
    const body = (await req.json()) as ResolveBody;
    correlationId = body.correlationId ?? '';
    const rawId = (body.placeId ?? '').trim();
    if (!rawId) {
      return jsonResponse({ error: 'placeId required' }, 400);
    }

    const resourceName = rawId.startsWith('places/') ? rawId : `places/${rawId}`;
    const sessionTok = (body.sessionToken ?? '').trim();
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

    const placeUrl = new URL(`https://places.googleapis.com/v1/${resourceName}`);
    if (sessionTok) {
      placeUrl.searchParams.set('sessionToken', sessionTok);
    }
    const res = await fetch(placeUrl.toString(), {
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
      error?: { message?: string; status?: string; code?: number };
      id?: string;
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
    };

    if (place.error && typeof place.error === 'object') {
      const msg =
        typeof place.error.message === 'string' && place.error.message.trim()
          ? place.error.message.trim()
          : 'Could not resolve place';
      logStructured({
        scope: 'places',
        step: 'resolve',
        status: 'fail',
        correlationId,
        userId,
        geocoding: 'place_details',
        message: msg,
        extra: { code: place.error.code, status: place.error.status },
      });
      return jsonResponse({ error: msg }, 502);
    }

    const shortPlaceId = place.id?.replace(/^places\//, '') ?? rawId.replace(/^places\//, '');

    const parsed = parsePlacesAddressComponents(place.addressComponents);
    const formatted = (place.formattedAddress ?? '').trim();
    const normalizedOneLine = buildNormalizedOneLine(formatted, parsed);

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
      formattedAddress: formatted,
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
      addressComponents: place.addressComponents ?? [],
      normalizedOneLine,
      streetNumber: parsed.streetNumber,
      route: parsed.route,
      city: parsed.city,
      state: parsed.state,
      postalCode: parsed.postalCode,
      country: parsed.country,
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
}
