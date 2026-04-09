/**
 * import-property — canonical property import Edge Function.
 * Persists: properties, property_imports (audit), property_snapshots (history).
 * Consumes one server credit only when the saved property is `ready` (complete import), via
 * consume_import_credit (idempotent per correlationId). Draft/error/partial imports do not charge.
 */
import { requireAuthedUser } from '../_shared/auth.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logStructured } from '../_shared/logger.ts';
import { loadOrFetchRentcastEnrichment } from '../_shared/import/rentcastEnrichment.ts';
import { getServiceSupabase } from '../_shared/supabaseAdmin.ts';
import {
  checkImportSubscriptionPreflight,
  finalizeCreditForSavedImport,
  findCompletedPropertyIdForCorrelation,
  getWalletBalance,
  loadPropertyForReplay,
} from './credits.ts';
import { prepareListingUrlForImport, type ListingParseResult } from './listingUrl.ts';
import { buildSnapshotAndMissing, type ResolvedPlace } from './snapshot.ts';

type Mode = 'listing_url' | 'manual_place';

type Body = {
  mode: Mode;
  correlationId?: string;
  url?: string;
  resolvedPlace?: ResolvedPlace;
  investmentStrategy?: unknown;
};

/** RentCast property + rent AVM run in parallel; allow slow provider responses without premature abort. */
const RENTCAST_TIMEOUT_MS = 22_000;

type SupabaseUserClient = Awaited<ReturnType<typeof requireAuthedUser>>['supabase'];

async function insertPropertyImportRow(
  supabase: SupabaseUserClient,
  row: {
    user_id: string;
    property_id?: string | null;
    correlation_id: string;
    source_type: string;
    step: string;
    status: string;
    payload: Record<string, unknown>;
    error_code?: string | null;
    duration_ms?: number | null;
  },
) {
  const { error } = await supabase.from('property_imports').insert(row);
  if (error) {
    console.warn('property_imports insert failed', error.message);
  }
}

async function recordSnapshotVersion(
  supabase: SupabaseUserClient,
  args: {
    user_id: string;
    property_id: string;
    snapshot: Record<string, unknown>;
    correlation_id: string;
  },
) {
  const { error } = await supabase.from('property_snapshots').insert({
    user_id: args.user_id,
    property_id: args.property_id,
    snapshot: args.snapshot,
    schema_version: '1',
    source: 'import',
    correlation_id: args.correlation_id,
  });
  if (error) {
    console.warn('property_snapshots insert failed', error.message);
  }
}

function normalizePropertyStatus(s: string): 'draft' | 'ready' | 'error' {
  if (s === 'ready' || s === 'error' || s === 'draft') {
    return s;
  }
  return 'draft';
}

function tryServiceSupabase(): ReturnType<typeof getServiceSupabase> | null {
  try {
    return getServiceSupabase();
  } catch {
    return null;
  }
}

/**
 * Shared path: RentCast enrichment (with cache) → snapshot → DB → credit → audit log.
 */
async function executeImportSave(args: {
  supabase: SupabaseUserClient;
  userId: string;
  correlationId: string;
  investmentStrategy: 'buy_hold' | 'fix_flip';
  listing: ListingParseResult | null;
  place: ResolvedPlace | null;
  addressLine: string;
  sourceType: 'zillow_url' | 'redfin_url' | 'manual_address';
  sourceUrl: string | null;
  rawInput: string;
  rentcastKey: string;
  auditSourceType: string;
  completeGeocoding: 'place_resolved' | 'slug_hint';
  auditGeocoding: 'resolved' | 'hint_only' | 'place_resolved';
}): Promise<Response> {
  const t0 = Date.now();
  const admin = tryServiceSupabase();

  const tRc = Date.now();
  const enrichment = await loadOrFetchRentcastEnrichment({
    supabaseAdmin: admin,
    placeId: args.place?.placeId,
    addressLine: args.addressLine,
    apiKey: args.rentcastKey,
    timeoutMs: RENTCAST_TIMEOUT_MS,
  });

  logStructured({
    scope: 'import',
    step: enrichment.fromCache ? 'rentcast_cache_hit' : 'rentcast_fetched',
    status: 'ok',
    correlationId: args.correlationId,
    userId: args.userId,
    sourceType: args.auditSourceType,
    extra: { ms: Date.now() - tRc, fromCache: enrichment.fromCache },
  });

  if (!args.rentcastKey) {
    logStructured(
      {
        scope: 'import',
        step: 'rentcast_property',
        status: 'skip',
        correlationId: args.correlationId,
        userId: args.userId,
        message: 'RENTCAST_API_KEY missing',
      },
      'warn',
    );
  } else if (!enrichment.fromCache) {
    logStructured({
      scope: 'import',
      step: 'rentcast_property',
      status: enrichment.rcProp ? 'ok' : 'fail',
      correlationId: args.correlationId,
      userId: args.userId,
      sourceType: args.auditSourceType,
      provider: 'rentcast',
      message: enrichment.rcProp ? 'ok' : (enrichment.propErr ?? ''),
    });
    logStructured({
      scope: 'import',
      step: 'rentcast_rent',
      status: enrichment.rcRent ? 'ok' : 'partial',
      correlationId: args.correlationId,
      userId: args.userId,
      sourceType: args.auditSourceType,
      provider: 'rentcast',
      message: enrichment.rcRent ? 'ok' : (enrichment.rentErr ?? ''),
    });
  }

  const { rcProp, rcRent, propErr, rentErr } = enrichment;

  const { snapshot: snapBase, missingFields } = buildSnapshotAndMissing({
    listing: args.listing,
    place: args.place,
    addressForRentcast: args.addressLine,
    rentcastProperty: rcProp,
    rentcastRent: rcRent,
  });
  const snapshot = { ...snapBase, investmentStrategy: args.investmentStrategy };

  const formatted = snapshot.address.formatted?.trim() ?? '';
  const status = !formatted ? 'error' : missingFields.length ? 'draft' : 'ready';

  const { data: inserted, error: insErr } = await args.supabase
    .from('properties')
    .insert({
      user_id: args.userId,
      source_type: args.sourceType,
      source_url: args.sourceUrl,
      raw_input: args.rawInput,
      status,
      missing_fields: missingFields,
      snapshot: snapshot as unknown as Record<string, unknown>,
      place_id: args.place?.placeId ?? null,
      formatted_address: formatted || null,
      latitude: snapshot.geo.lat,
      longitude: snapshot.geo.lng,
      last_import_error: propErr || rentErr || null,
    })
    .select('id')
    .single();

  if (insErr || !inserted) {
    logStructured(
      {
        scope: 'import',
        step: 'db_insert',
        status: 'fail',
        correlationId: args.correlationId,
        userId: args.userId,
        message: insErr?.message ?? 'insert failed',
      },
      'error',
    );
    return jsonResponse({
      ok: false,
      error:
        insErr?.message?.includes('row-level security') || insErr?.message?.includes('RLS')
          ? 'Could not save this import due to account permissions. Try signing out and back in.'
          : 'Could not save property. Check your connection and try again.',
      code: 'DB_ERROR',
    });
  }

  const propertyId = inserted.id as string;
  const duration = Date.now() - t0;

  await recordSnapshotVersion(args.supabase, {
    user_id: args.userId,
    property_id: propertyId,
    snapshot: snapshot as unknown as Record<string, unknown>,
    correlation_id: args.correlationId,
  });

  const creditResult = await finalizeCreditForSavedImport(
    args.supabase,
    args.userId,
    propertyId,
    args.correlationId,
    status,
  );
  if (!creditResult.ok) {
    return jsonResponse(creditResult.body, creditResult.httpStatus);
  }

  const importPayload: Record<string, unknown> = {
    geocoding: args.auditGeocoding,
    providerProperty: rcProp ? 'ok' : propErr,
    providerRent: rcRent ? 'ok' : rentErr,
    missingFields,
  };
  if (args.listing?.parsingStatus != null) {
    importPayload.parsing = args.listing.parsingStatus;
  }

  await insertPropertyImportRow(args.supabase, {
    user_id: args.userId,
    property_id: propertyId,
    correlation_id: args.correlationId,
    source_type: args.auditSourceType,
    step: 'complete',
    status,
    payload: importPayload,
    duration_ms: duration,
  });

  logStructured({
    scope: 'import',
    step: 'complete',
    status: status === 'ready' ? 'ok' : 'partial',
    correlationId: args.correlationId,
    userId: args.userId,
    sourceType: args.auditSourceType,
    parsing: args.listing?.parsingStatus,
    geocoding: args.completeGeocoding,
    provider: 'rentcast',
    missingFields,
  });

  return jsonResponse({
    ok: true,
    propertyId,
    status,
    missingFields,
    snapshot,
    balance_after: creditResult.balanceAfter,
    credit_consumed: creditResult.creditConsumed,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  }

  let correlationId = '';
  try {
    const { userId, supabase } = await requireAuthedUser(req);
    const body = (await req.json()) as Body;
    correlationId = body.correlationId ?? crypto.randomUUID();

    const investmentStrategy =
      body.investmentStrategy === 'buy_hold' || body.investmentStrategy === 'fix_flip'
        ? body.investmentStrategy
        : null;
    if (!investmentStrategy) {
      return jsonResponse({
        ok: false,
        error: 'investmentStrategy is required and must be buy_hold or fix_flip',
        code: 'VALIDATION_ERROR',
      });
    }

    const rentcastKey = Deno.env.get('RENTCAST_API_KEY') ?? '';

    if (body.mode === 'listing_url') {
      const rawUrl = (body.url ?? '').trim();
      if (!rawUrl) {
        return jsonResponse({
          ok: false,
          error: 'Enter a valid Zillow or Redfin property link.',
          code: 'VALIDATION_ERROR',
        });
      }

      logStructured({
        scope: 'import',
        step: 'listing_url_received',
        status: 'ok',
        correlationId,
        userId,
        extra: { rawLen: rawUrl.length },
      });

      const { parsed, resolvedUrl } = await prepareListingUrlForImport(rawUrl);

      logStructured({
        scope: 'import',
        step: 'listing_url_normalized',
        status: parsed && !('unsupported' in parsed) ? 'ok' : 'fail',
        correlationId,
        userId,
        extra: { resolvedHost: (() => {
          try {
            return new URL(resolvedUrl).hostname;
          } catch {
            return '';
          }
        })() },
      });

      if (!parsed) {
        return jsonResponse({
          ok: false,
          error: 'We couldn’t read this listing link. Try copying the main property page URL again.',
          code: 'INVALID_URL',
        });
      }
      if ('unsupported' in parsed) {
        return jsonResponse({
          ok: false,
          error: parsed.message,
          code: parsed.code ?? 'UNSUPPORTED_PAGE',
        });
      }

      const place = body.resolvedPlace ?? null;
      const addressLine =
        place?.formattedAddress?.trim() ||
        parsed.addressHint ||
        null;

      const sourceTypeLog = parsed.provider === 'zillow' ? 'zillow_url' : 'redfin_url';

      if (!addressLine) {
        logStructured({
          scope: 'import',
          step: 'validate',
          status: 'partial',
          correlationId,
          userId,
          sourceType: sourceTypeLog,
          parsing: parsed.parsingStatus,
          message: 'NEEDS_ADDRESS',
        });
        await insertPropertyImportRow(supabase, {
          user_id: userId,
          property_id: null,
          correlation_id: correlationId,
          source_type: sourceTypeLog,
          step: 'validate',
          status: 'needs_address',
          payload: { listing: parsed },
        });
        return jsonResponse({
          ok: false,
          code: 'NEEDS_ADDRESS',
          listing: {
            provider: parsed.provider,
            canonicalUrl: parsed.canonicalUrl,
            addressHint: parsed.addressHint,
            externalIds: parsed.externalIds,
          },
        });
      }

      const existingListingPid = await findCompletedPropertyIdForCorrelation(
        supabase,
        userId,
        correlationId,
      );
      if (existingListingPid) {
        const replay = await loadPropertyForReplay(supabase, userId, existingListingPid);
        if (replay) {
          const replayBal = await getWalletBalance(supabase, userId);
          return jsonResponse({
            ok: true,
            propertyId: existingListingPid,
            status: normalizePropertyStatus(replay.status),
            missingFields: replay.missingFields,
            snapshot: replay.snapshot,
            idempotentReplay: true,
            balance_after: replayBal,
            credit_consumed: false,
          });
        }
      }

      const listingSub = await checkImportSubscriptionPreflight(supabase, userId);
      if (!listingSub.ok) {
        const listingSubBal = await getWalletBalance(supabase, userId);
        return jsonResponse({
          ok: false,
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'An active PropFolio membership is required to import properties.',
          balance_after: listingSubBal,
        });
      }

      const listingPreflightBal = await getWalletBalance(supabase, userId);
      if (listingPreflightBal < 1) {
        return jsonResponse({
          ok: false,
          code: 'INSUFFICIENT_CREDITS',
          message: 'You have no import credits left. Add credits or subscribe to continue.',
          balance_after: listingPreflightBal,
        });
      }

      const stUrl = parsed.provider === 'zillow' ? 'zillow_url' : 'redfin_url';
      return executeImportSave({
        supabase,
        userId,
        correlationId,
        investmentStrategy,
        listing: parsed,
        place,
        addressLine,
        sourceType: stUrl,
        sourceUrl: parsed.canonicalUrl,
        rawInput: rawUrl.slice(0, 2048),
        rentcastKey,
        auditSourceType: stUrl,
        completeGeocoding: place ? 'place_resolved' : 'slug_hint',
        auditGeocoding: place ? 'resolved' : 'hint_only',
      });
    }

    const place = body.resolvedPlace;
    if (!place?.placeId || !place.formattedAddress?.trim()) {
      return jsonResponse({
        ok: false,
        error: 'resolvedPlace required',
        code: 'VALIDATION_ERROR',
      });
    }

    const existingManualPid = await findCompletedPropertyIdForCorrelation(
      supabase,
      userId,
      correlationId,
    );
    if (existingManualPid) {
      const replayManual = await loadPropertyForReplay(supabase, userId, existingManualPid);
      if (replayManual) {
        const replayBalManual = await getWalletBalance(supabase, userId);
        return jsonResponse({
          ok: true,
          propertyId: existingManualPid,
          status: normalizePropertyStatus(replayManual.status),
          missingFields: replayManual.missingFields,
          snapshot: replayManual.snapshot,
          idempotentReplay: true,
          balance_after: replayBalManual,
          credit_consumed: false,
        });
      }
    }

    const manualSub = await checkImportSubscriptionPreflight(supabase, userId);
    if (!manualSub.ok) {
      const manualSubBal = await getWalletBalance(supabase, userId);
      return jsonResponse({
        ok: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'An active PropFolio membership is required to import properties.',
        balance_after: manualSubBal,
      });
    }

    const manualPreflightBal = await getWalletBalance(supabase, userId);
    if (manualPreflightBal < 1) {
      return jsonResponse({
        ok: false,
        code: 'INSUFFICIENT_CREDITS',
        message: 'You have no import credits left. Add credits or subscribe to continue.',
        balance_after: manualPreflightBal,
      });
    }

    const addressLine = place.formattedAddress.trim();

    return executeImportSave({
      supabase,
      userId,
      correlationId,
      investmentStrategy,
      listing: null,
      place,
      addressLine,
      sourceType: 'manual_address',
      sourceUrl: null,
      rawInput: addressLine.slice(0, 500),
      rentcastKey,
      auditSourceType: 'manual_address',
      completeGeocoding: 'place_resolved',
      auditGeocoding: 'place_resolved',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') {
      return jsonResponse({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (msg === 'SERVER_MISCONFIGURED') {
      return jsonResponse({
        ok: false,
        error: 'Server misconfigured',
        code: 'SERVER_MISCONFIGURED',
      });
    }
    logStructured(
      {
        scope: 'import',
        step: 'fatal',
        status: 'fail',
        correlationId,
        message: msg,
      },
      'error',
    );
    return jsonResponse({
      ok: false,
      error: 'Something went wrong. Please try again in a moment.',
      code: 'INTERNAL',
    });
  }
});
