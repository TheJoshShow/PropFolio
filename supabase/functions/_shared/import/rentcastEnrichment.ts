/**
 * RentCast parallel fetch with optional DB cache (import_provider_cache).
 * Reduces duplicate API calls for the same place within TTL.
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { fetchPropertyRecord, fetchRentLongTerm } from '../providers/rentcast.ts';

export type CachedRentcastPayloadV1 = {
  version: 1;
  rcProp: Record<string, unknown> | null;
  rcRent: Record<string, unknown> | null;
  propErr: string | null;
  rentErr: string | null;
};

export type RentcastEnrichmentResult = {
  rcProp: Record<string, unknown> | null;
  rcRent: Record<string, unknown> | null;
  propErr: string | null;
  rentErr: string | null;
  fromCache: boolean;
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Never block import on cache RPC — stalled PostgREST would otherwise exceed client timeouts before RentCast runs. */
const CACHE_READ_BUDGET_MS = 5_000;
const CACHE_WRITE_BUDGET_MS = 4_000;

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  return new Promise((resolve) => {
    const id = setTimeout(() => resolve(onTimeout()), ms);
    promise
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch(() => {
        clearTimeout(id);
        resolve(onTimeout());
      });
  });
}

function buildCacheKey(placeId: string | null | undefined, addressLine: string): string {
  const pid = typeof placeId === 'string' ? placeId.trim() : '';
  if (pid.length > 0) {
    return `rentcast:place:${pid}`;
  }
  const fp = addressLine
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
  return `rentcast:addr:${fp}`;
}

async function readCache(
  admin: SupabaseClient,
  cacheKey: string,
): Promise<CachedRentcastPayloadV1 | null> {
  try {
    const { data, error } = await admin
      .from('import_provider_cache')
      .select('payload, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error || !data?.payload) {
      return null;
    }
    const exp = data.expires_at ? new Date(String(data.expires_at)).getTime() : 0;
    if (!Number.isFinite(exp) || exp <= Date.now()) {
      return null;
    }
    const p = data.payload as CachedRentcastPayloadV1;
    if (p?.version !== 1) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

async function writeCache(
  admin: SupabaseClient,
  args: {
    cacheKey: string;
    placeId: string | null;
    payload: CachedRentcastPayloadV1;
  },
): Promise<void> {
  const now = Date.now();
  try {
    await admin.from('import_provider_cache').upsert(
      {
        cache_key: args.cacheKey,
        provider: 'rentcast',
        place_id: args.placeId,
        payload: args.payload,
        fetched_at: new Date(now).toISOString(),
        expires_at: new Date(now + CACHE_TTL_MS).toISOString(),
      },
      { onConflict: 'cache_key' },
    );
  } catch {
    /* non-fatal */
  }
}

export async function loadOrFetchRentcastEnrichment(args: {
  supabaseAdmin: SupabaseClient | null;
  placeId: string | null | undefined;
  addressLine: string;
  apiKey: string;
  timeoutMs: number;
}): Promise<RentcastEnrichmentResult> {
  const { supabaseAdmin, placeId, addressLine, apiKey, timeoutMs } = args;
  const key = buildCacheKey(placeId, addressLine);

  if (supabaseAdmin) {
    const cached = await withTimeout(readCache(supabaseAdmin, key), CACHE_READ_BUDGET_MS, () => null);
    if (cached) {
      return {
        rcProp: cached.rcProp,
        rcRent: cached.rcRent,
        propErr: cached.propErr,
        rentErr: cached.rentErr,
        fromCache: true,
      };
    }
  }

  let rcProp: Record<string, unknown> | null = null;
  let rcRent: Record<string, unknown> | null = null;
  let propErr: string | null = null;
  let rentErr: string | null = null;

  if (apiKey) {
    const [pr, rr] = await Promise.all([
      fetchPropertyRecord(addressLine, apiKey, timeoutMs),
      fetchRentLongTerm(addressLine, apiKey, timeoutMs),
    ]);

    if (pr.ok && pr.record) {
      rcProp = pr.record;
    } else if (!pr.ok) {
      propErr = pr.error;
    }

    if (rr.ok && rr.data) {
      rcRent = rr.data;
    } else if (!rr.ok) {
      rentErr = rr.error;
    }
  } else {
    propErr = 'rentcast_not_configured';
    rentErr = 'rentcast_not_configured';
  }

  const payload: CachedRentcastPayloadV1 = {
    version: 1,
    rcProp,
    rcRent,
    propErr,
    rentErr,
  };

  if (supabaseAdmin) {
    const pid = typeof placeId === 'string' && placeId.trim() ? placeId.trim() : null;
    await withTimeout(
      writeCache(supabaseAdmin, { cacheKey: key, placeId: pid, payload }),
      CACHE_WRITE_BUDGET_MS,
      () => undefined,
    );
  }

  return {
    rcProp,
    rcRent,
    propErr,
    rentErr,
    fromCache: false,
  };
}
