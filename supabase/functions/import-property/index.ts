/**
 * import-property — canonical property import Edge Function.
 * Persists: properties, property_imports (audit), property_snapshots (history).
 * Consumes one server credit per successful import via consume_import_credit (idempotent per correlationId).
 */
import { requireAuthedUser } from '../_shared/auth.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logStructured } from '../_shared/logger.ts';
import { fetchPropertyRecord, fetchRentLongTerm } from '../_shared/providers/rentcast.ts';
import {
  checkImportSubscriptionPreflight,
  consumeImportCreditAfterSave,
  deletePropertyAfterFailedCredit,
  findCompletedPropertyIdForCorrelation,
  getWalletBalance,
  loadPropertyForReplay,
} from './credits.ts';
import { parseListingUrl, sanitizeListingUrl } from './listingUrl.ts';
import { buildSnapshotAndMissing, type ResolvedPlace } from './snapshot.ts';

type Mode = 'listing_url' | 'manual_place';

type Body = {
  mode: Mode;
  correlationId?: string;
  url?: string;
  resolvedPlace?: ResolvedPlace;
  investmentStrategy?: unknown;
};

const RENTCAST_TIMEOUT_MS = 14_000;

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
      return jsonResponse(
        {
          error: 'investmentStrategy is required and must be buy_hold or fix_flip',
          code: 'VALIDATION_ERROR',
        },
        400,
      );
    }

    const rentcastKey = Deno.env.get('RENTCAST_API_KEY') ?? '';

    if (body.mode === 'listing_url') {
      const rawUrl = (body.url ?? '').trim();
      if (!rawUrl) {
        return jsonResponse({ error: 'url required', code: 'VALIDATION_ERROR' }, 400);
      }
      const safeUrl = sanitizeListingUrl(rawUrl);
      const parsed = parseListingUrl(safeUrl);
      if (!parsed) {
        return jsonResponse({ error: 'Invalid listing URL', code: 'VALIDATION_ERROR' }, 400);
      }
      if ('unsupported' in parsed) {
        return jsonResponse({ error: parsed.message, code: 'UNSUPPORTED_HOST' }, 400);
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
          return jsonResponse({
            ok: true,
            propertyId: existingListingPid,
            status: normalizePropertyStatus(replay.status),
            missingFields: replay.missingFields,
            snapshot: replay.snapshot,
            idempotentReplay: true,
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

      const t0 = Date.now();
      let rcProp: Record<string, unknown> | null = null;
      let rcRent: Record<string, unknown> | null = null;
      let propErr: string | null = null;
      let rentErr: string | null = null;

      if (rentcastKey) {
        const pr = await fetchPropertyRecord(addressLine, rentcastKey, RENTCAST_TIMEOUT_MS);
        logStructured({
          scope: 'import',
          step: 'rentcast_property',
          status: pr.ok && pr.record ? 'ok' : 'fail',
          correlationId,
          userId,
          sourceType: sourceTypeLog,
          provider: 'rentcast',
          message: pr.ok ? 'ok' : pr.ok === false ? pr.error : '',
        });
        if (pr.ok && pr.record) {
          rcProp = pr.record;
        } else if (!pr.ok) {
          propErr = pr.error;
        }

        const rr = await fetchRentLongTerm(addressLine, rentcastKey, RENTCAST_TIMEOUT_MS);
        logStructured({
          scope: 'import',
          step: 'rentcast_rent',
          status: rr.ok && rr.data ? 'ok' : 'partial',
          correlationId,
          userId,
          sourceType: sourceTypeLog,
          provider: 'rentcast',
          message: rr.ok ? 'ok' : rr.ok === false ? rr.error : '',
        });
        if (rr.ok && rr.data) {
          rcRent = rr.data;
        } else if (!rr.ok) {
          rentErr = rr.error;
        }
      } else {
        logStructured(
          {
            scope: 'import',
            step: 'rentcast_property',
            status: 'skip',
            correlationId,
            userId,
            message: 'RENTCAST_API_KEY missing',
          },
          'warn',
        );
        propErr = 'rentcast_not_configured';
        rentErr = 'rentcast_not_configured';
      }

      const { snapshot: snapBase, missingFields } = buildSnapshotAndMissing({
        listing: parsed,
        place,
        addressForRentcast: addressLine,
        rentcastProperty: rcProp,
        rentcastRent: rcRent,
      });
      const snapshot = { ...snapBase, investmentStrategy };

      const formatted = snapshot.address.formatted?.trim() ?? '';
      const status = !formatted ? 'error' : missingFields.length ? 'draft' : 'ready';

      const sourceType = parsed.provider === 'zillow' ? 'zillow_url' : 'redfin_url';

      const { data: inserted, error: insErr } = await supabase
        .from('properties')
        .insert({
          user_id: userId,
          source_type: sourceType,
          source_url: parsed.canonicalUrl,
          raw_input: rawUrl.slice(0, 2048),
          status,
          missing_fields: missingFields,
          snapshot: snapshot as unknown as Record<string, unknown>,
          place_id: place?.placeId ?? null,
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
            correlationId,
            userId,
            message: insErr?.message ?? 'insert failed',
          },
          'error',
        );
        return jsonResponse({ error: 'Could not save property', code: 'DB_ERROR' }, 500);
      }

      const propertyId = inserted.id as string;
      const duration = Date.now() - t0;

      await recordSnapshotVersion(supabase, {
        user_id: userId,
        property_id: propertyId,
        snapshot: snapshot as unknown as Record<string, unknown>,
        correlation_id: correlationId,
      });

      const creditListing = await consumeImportCreditAfterSave(
        supabase,
        userId,
        propertyId,
        correlationId,
      );
      if (!creditListing.ok) {
        await deletePropertyAfterFailedCredit(supabase, propertyId);
        if (creditListing.code === 'insufficient_credits') {
          return jsonResponse({
            ok: false,
            code: 'INSUFFICIENT_CREDITS',
            message: 'You have no import credits left. Add credits or subscribe to continue.',
            balance_after: creditListing.balanceAfter ?? 0,
          });
        }
        if (creditListing.code === 'subscription_required') {
          return jsonResponse({
            ok: false,
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'An active PropFolio membership is required to import properties.',
            balance_after: creditListing.balanceAfter ?? 0,
          });
        }
        return jsonResponse({
          ok: false,
          code: 'CREDIT_CONSUME_FAILED',
          message: creditListing.rpcMessage ?? 'Could not apply import credit.',
        });
      }

      await insertPropertyImportRow(supabase, {
        user_id: userId,
        property_id: propertyId,
        correlation_id: correlationId,
        source_type: sourceType,
        step: 'complete',
        status,
        payload: {
          parsing: parsed.parsingStatus,
          geocoding: place ? 'resolved' : 'hint_only',
          providerProperty: rcProp ? 'ok' : propErr,
          providerRent: rcRent ? 'ok' : rentErr,
          missingFields,
        },
        duration_ms: duration,
      });

      logStructured({
        scope: 'import',
        step: 'complete',
        status: status === 'ready' ? 'ok' : 'partial',
        correlationId,
        userId,
        sourceType,
        parsing: parsed.parsingStatus,
        geocoding: place ? 'place_resolved' : 'slug_hint',
        provider: 'rentcast',
        missingFields,
      });

      return jsonResponse({
        ok: true,
        propertyId,
        status,
        missingFields,
        snapshot,
        balance_after: creditListing.balanceAfter,
      });
    }

    const place = body.resolvedPlace;
    if (!place?.placeId || !place.formattedAddress?.trim()) {
      return jsonResponse({ error: 'resolvedPlace required', code: 'VALIDATION_ERROR' }, 400);
    }

    const existingManualPid = await findCompletedPropertyIdForCorrelation(
      supabase,
      userId,
      correlationId,
    );
    if (existingManualPid) {
      const replayManual = await loadPropertyForReplay(supabase, userId, existingManualPid);
      if (replayManual) {
        return jsonResponse({
          ok: true,
          propertyId: existingManualPid,
          status: normalizePropertyStatus(replayManual.status),
          missingFields: replayManual.missingFields,
          snapshot: replayManual.snapshot,
          idempotentReplay: true,
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

    const t0 = Date.now();
    let rcProp: Record<string, unknown> | null = null;
    let rcRent: Record<string, unknown> | null = null;
    let propErr: string | null = null;
    let rentErr: string | null = null;

    const addressLine = place.formattedAddress.trim();

    if (rentcastKey) {
      const pr = await fetchPropertyRecord(addressLine, rentcastKey, RENTCAST_TIMEOUT_MS);
      if (pr.ok && pr.record) {
        rcProp = pr.record;
      } else if (!pr.ok) {
        propErr = pr.error;
      }

      const rr = await fetchRentLongTerm(addressLine, rentcastKey, RENTCAST_TIMEOUT_MS);
      if (rr.ok && rr.data) {
        rcRent = rr.data;
      } else if (!rr.ok) {
        rentErr = rr.error;
      }
    } else {
      propErr = 'rentcast_not_configured';
      rentErr = 'rentcast_not_configured';
    }

    const { snapshot: snapBase, missingFields } = buildSnapshotAndMissing({
      listing: null,
      place,
      addressForRentcast: addressLine,
      rentcastProperty: rcProp,
      rentcastRent: rcRent,
    });
    const snapshot = { ...snapBase, investmentStrategy };

    const formatted = snapshot.address.formatted?.trim() ?? '';
    const status = !formatted ? 'error' : missingFields.length ? 'draft' : 'ready';

    const { data: inserted, error: insErr } = await supabase
      .from('properties')
      .insert({
        user_id: userId,
        source_type: 'manual_address',
        source_url: null,
        raw_input: addressLine.slice(0, 500),
        status,
        missing_fields: missingFields,
        snapshot: snapshot as unknown as Record<string, unknown>,
        place_id: place.placeId,
        formatted_address: formatted || null,
        latitude: snapshot.geo.lat,
        longitude: snapshot.geo.lng,
        last_import_error: propErr || rentErr || null,
      })
      .select('id')
      .single();

    if (insErr || !inserted) {
      return jsonResponse({ error: 'Could not save property', code: 'DB_ERROR' }, 500);
    }

    const propertyId = inserted.id as string;
    const duration = Date.now() - t0;

    await recordSnapshotVersion(supabase, {
      user_id: userId,
      property_id: propertyId,
      snapshot: snapshot as unknown as Record<string, unknown>,
      correlation_id: correlationId,
    });

    const creditManual = await consumeImportCreditAfterSave(
      supabase,
      userId,
      propertyId,
      correlationId,
    );
    if (!creditManual.ok) {
      await deletePropertyAfterFailedCredit(supabase, propertyId);
      if (creditManual.code === 'insufficient_credits') {
        return jsonResponse({
          ok: false,
          code: 'INSUFFICIENT_CREDITS',
          message: 'You have no import credits left. Add credits or subscribe to continue.',
          balance_after: creditManual.balanceAfter ?? 0,
        });
      }
      if (creditManual.code === 'subscription_required') {
        return jsonResponse({
          ok: false,
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'An active PropFolio membership is required to import properties.',
          balance_after: creditManual.balanceAfter ?? 0,
        });
      }
      return jsonResponse({
        ok: false,
        code: 'CREDIT_CONSUME_FAILED',
        message: creditManual.rpcMessage ?? 'Could not apply import credit.',
      });
    }

    await insertPropertyImportRow(supabase, {
      user_id: userId,
      property_id: propertyId,
      correlation_id: correlationId,
      source_type: 'manual_address',
      step: 'complete',
      status,
      payload: {
        geocoding: 'place_resolved',
        providerProperty: rcProp ? 'ok' : propErr,
        providerRent: rcRent ? 'ok' : rentErr,
        missingFields,
      },
      duration_ms: duration,
    });

    logStructured({
      scope: 'import',
      step: 'complete',
      status: status === 'ready' ? 'ok' : 'partial',
      correlationId,
      userId,
      sourceType: 'manual_address',
      geocoding: 'place_resolved',
      provider: 'rentcast',
      missingFields,
    });

    return jsonResponse({
      ok: true,
      propertyId,
      status,
      missingFields,
      snapshot,
      balance_after: creditManual.balanceAfter,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') {
      return jsonResponse({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (msg === 'SERVER_MISCONFIGURED') {
      return jsonResponse({ error: 'Server misconfigured', code: 'SERVER_MISCONFIGURED' }, 500);
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
    return jsonResponse({ error: 'Server error', code: 'INTERNAL' }, 500);
  }
});
