/**
 * When portfolio data loads: geocode properties missing lat/lng (legacy rows), in batches.
 * Uses fingerprint + ref to avoid effect loops from unstable array references.
 */

import { useEffect, useMemo, useRef } from 'react';
import { getSupabase } from '../services/supabase';
import { geocodeAddress } from '../services/edgeFunctions';
import { formatPropertyAddressLine, type PropertyRow } from '../services/portfolio';
import { logErrorSafe, logMapStep } from '../services/diagnostics';

const MAX_PER_RUN = 12;
const DELAY_MS_BETWEEN = 450;
const FAILED_RETRY_COOLDOWN_MS = 30 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function usePortfolioCoordinateBackfill(
  userId: string | null,
  rawRows: PropertyRow[],
  refresh: () => void | Promise<void>
): void {
  const processing = useRef(false);
  const rawRef = useRef(rawRows);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  rawRef.current = rawRows;

  const fingerprint = useMemo(
    () =>
      rawRows
        .map((r) => `${r.id}:${r.latitude ?? ''}:${r.longitude ?? ''}:${r.geocode_status ?? ''}:${r.last_geocoded_at ?? ''}`)
        .join('|'),
    [rawRows]
  );

  useEffect(() => {
    if (!userId || processing.current) return;

    const rows = rawRef.current;
    if (!rows.length) return;

    const now = Date.now();
    const missing = rows.filter((r) => {
      const hasCoords =
        r.latitude != null &&
        r.longitude != null &&
        Number.isFinite(Number(r.latitude)) &&
        Number.isFinite(Number(r.longitude));
      if (hasCoords) return false;
      if (r.geocode_status !== 'failed') return true;
      const last = r.last_geocoded_at ? new Date(r.last_geocoded_at).getTime() : 0;
      return !last || now - last >= FAILED_RETRY_COOLDOWN_MS;
    });
    if (missing.length === 0) return;

    logMapStep('backfill_start', { totalRows: rows.length, missingCount: missing.length });
    processing.current = true;

    void (async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        for (const row of missing.slice(0, MAX_PER_RUN)) {
          const address = row.full_address?.trim() || formatPropertyAddressLine(row);
          if (!address.trim()) {
            await supabase
              .from('properties')
              .update({
                geocode_status: 'failed',
                geocode_source: 'backfill',
                geocode_error: 'Missing address fields',
                last_geocoded_at: new Date().toISOString(),
              })
              .eq('id', row.id);
            continue;
          }
          const geocodeStartedAt = new Date().toISOString();

          try {
            await supabase
              .from('properties')
              .update({
                geocode_status: 'in_progress',
                geocode_source: 'backfill',
                geocode_error: null,
                last_geocoded_at: geocodeStartedAt,
                full_address: address,
              })
              .eq('id', row.id);

            const { data, error } = await geocodeAddress(address);
            if (error || !data) {
              logMapStep('geocode_failed', { propertyId: row.id, reason: error ?? 'no_data' });
              await supabase
                .from('properties')
                .update({
                  geocode_status: 'failed',
                  geocode_source: 'backfill',
                  geocode_error: error ?? 'No geocode result',
                  last_geocoded_at: new Date().toISOString(),
                  full_address: address,
                })
                .eq('id', row.id);
              continue;
            }
            const lat = data.lat;
            const lng = data.lng;
            if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
              logMapStep('geocode_no_coordinates', { propertyId: row.id });
              await supabase
                .from('properties')
                .update({
                  geocode_status: 'failed',
                  geocode_source: 'backfill',
                  geocode_error: 'No coordinates returned for address',
                  last_geocoded_at: new Date().toISOString(),
                  full_address: address,
                })
                .eq('id', row.id);
              continue;
            }
            const { error: upErr } = await supabase
              .from('properties')
              .update({
                latitude: lat,
                longitude: lng,
                geocode_status: 'resolved',
                geocode_source: 'backfill',
                geocode_error: null,
                last_geocoded_at: new Date().toISOString(),
                full_address: address,
                updated_at: new Date().toISOString(),
              })
              .eq('id', row.id);
            if (upErr) logErrorSafe('usePortfolioCoordinateBackfill update', upErr);
            else logMapStep('geocode_persisted', { propertyId: row.id, lat, lng });
          } catch (e) {
            logErrorSafe('usePortfolioCoordinateBackfill geocode', e);
            await supabase
              .from('properties')
              .update({
                geocode_status: 'failed',
                geocode_source: 'backfill',
                geocode_error: e instanceof Error ? e.message : String(e),
                last_geocoded_at: new Date().toISOString(),
              })
              .eq('id', row.id);
          }
          await sleep(DELAY_MS_BETWEEN);
        }
      } finally {
        processing.current = false;
        logMapStep('backfill_complete', {});
        await refreshRef.current();
      }
    })();
  }, [userId, fingerprint]);
}
