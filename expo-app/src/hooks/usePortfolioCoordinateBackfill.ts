/**
 * When portfolio data loads: geocode properties missing lat/lng (legacy rows), in batches.
 * Uses fingerprint + ref to avoid effect loops from unstable array references.
 */

import { useEffect, useMemo, useRef } from 'react';
import { getSupabase } from '../services/supabase';
import { geocodeAddress } from '../services/edgeFunctions';
import { formatPropertyAddressLine, type PropertyRow } from '../services/portfolio';
import { logErrorSafe } from '../services/diagnostics';

const MAX_PER_RUN = 12;
const DELAY_MS_BETWEEN = 450;

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
    () => rawRows.map((r) => `${r.id}:${r.latitude ?? ''}:${r.longitude ?? ''}`).join('|'),
    [rawRows]
  );

  useEffect(() => {
    if (!userId || processing.current) return;

    const rows = rawRef.current;
    if (!rows.length) return;

    const missing = rows.filter(
      (r) =>
        r.latitude == null ||
        r.longitude == null ||
        !Number.isFinite(Number(r.latitude)) ||
        !Number.isFinite(Number(r.longitude))
    );
    if (missing.length === 0) return;

    processing.current = true;

    void (async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        for (const row of missing.slice(0, MAX_PER_RUN)) {
          const address = formatPropertyAddressLine(row);
          if (!address.trim()) continue;

          try {
            const { data, error } = await geocodeAddress(address);
            if (error || !data) continue;
            const lat = data.lat;
            const lng = data.lng;
            if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
              if (__DEV__) console.warn('[MapBackfill] no coordinates for property', row.id);
              continue;
            }
            const { error: upErr } = await supabase
              .from('properties')
              .update({ latitude: lat, longitude: lng, updated_at: new Date().toISOString() })
              .eq('id', row.id);
            if (upErr) logErrorSafe('usePortfolioCoordinateBackfill update', upErr);
          } catch (e) {
            logErrorSafe('usePortfolioCoordinateBackfill geocode', e);
          }
          await sleep(DELAY_MS_BETWEEN);
        }
      } finally {
        processing.current = false;
        await refreshRef.current();
      }
    })();
  }, [userId, fingerprint]);
}
