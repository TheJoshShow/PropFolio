/**
 * Fetch user's portfolio properties and compute list-item analysis (deal score, confidence, cash flow).
 * Returns list, loading, error, refresh. Handles offline/API errors.
 */

import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '../services/supabase';
import { subscribePortfolioRefresh } from '../services/portfolioRefresh';
import { getPortfolioProperties, type PropertyRow } from '../services/portfolio';
import { logErrorSafe } from '../services/diagnostics';
import { setMonitoringPortfolioPropertyCount } from '../services/monitoring/sessionContext';
import { runPropertyDetailAnalysis } from '../features/property-analysis';
import type { DealScoreBand } from '../lib/scoring/types';
import type { ConfidenceMeterBand } from '../lib/confidence/types';

function isUsablePortfolioRow(row: PropertyRow): boolean {
  return (
    typeof row.id === 'string' &&
    row.id.trim().length > 0 &&
    typeof row.portfolio_id === 'string' &&
    row.portfolio_id.trim().length > 0
  );
}

export interface PortfolioListItem {
  id: string;
  streetAddress: string;
  unit: string | null;
  city: string;
  state: string;
  postalCode: string;
  listPrice: number | null;
  rent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  fetchedAt: string;
  updatedAt: string;
  displayedDealScore: number | null;
  dealBand: DealScoreBand;
  confidenceScore: number;
  confidenceBand: ConfidenceMeterBand;
  monthlyCashFlow: number | null;
  /** WGS84 when stored or backfilled; used for Home map */
  latitude: number | null;
  longitude: number | null;
  geocodeStatus: 'pending' | 'in_progress' | 'resolved' | 'failed' | null;
  geocodeError: string | null;
}

function fallbackListItemFromRow(row: PropertyRow): PortfolioListItem {
  const updatedAt = row.updated_at ?? row.fetched_at ?? '';
  return {
    id: row.id,
    streetAddress: row.street_address,
    unit: row.unit,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    listPrice: row.list_price,
    rent: row.rent ?? null,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sqft: row.sqft,
    fetchedAt: row.fetched_at,
    updatedAt,
    displayedDealScore: null,
    dealBand: 'insufficientData',
    confidenceScore: 0,
    confidenceBand: 'veryLow',
    monthlyCashFlow: null,
    latitude: typeof row.latitude === 'number' && Number.isFinite(row.latitude) ? row.latitude : null,
    longitude: typeof row.longitude === 'number' && Number.isFinite(row.longitude) ? row.longitude : null,
    geocodeStatus: row.geocode_status ?? null,
    geocodeError: row.geocode_error ?? null,
  };
}

function rowToListItem(row: PropertyRow): PortfolioListItem {
  try {
    const analysis = runPropertyDetailAnalysis({
      listPrice: row.list_price ?? null,
      rent: row.rent ?? null,
      streetAddress: row.street_address ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      postalCode: row.postal_code ?? '',
      unitCount: 1,
      geocodeStatus: row.geocode_status ?? null,
      geocodeError: row.geocode_error ?? null,
    });
    if (analysis.pipelineError) {
      logErrorSafe(`usePortfolioProperties rowToListItem pipeline (${row.id})`, analysis.pipelineError);
      return fallbackListItemFromRow(row);
    }
    const updatedAt = row.updated_at ?? row.fetched_at ?? '';
    return {
      id: row.id,
      streetAddress: row.street_address,
      unit: row.unit,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      listPrice: row.list_price,
      rent: row.rent ?? null,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      sqft: row.sqft,
      fetchedAt: row.fetched_at,
      updatedAt,
      displayedDealScore: analysis.dealScore.totalScore,
      dealBand: analysis.dealScore.band,
      confidenceScore: analysis.confidence.score,
      confidenceBand: analysis.confidence.band,
      monthlyCashFlow: analysis.keyMetrics.monthlyCashFlow,
      latitude: typeof row.latitude === 'number' && Number.isFinite(row.latitude) ? row.latitude : null,
      longitude: typeof row.longitude === 'number' && Number.isFinite(row.longitude) ? row.longitude : null,
      geocodeStatus: row.geocode_status ?? null,
      geocodeError: row.geocode_error ?? null,
    };
  } catch (e) {
    logErrorSafe(`usePortfolioProperties rowToListItem (${row.id})`, e);
    return fallbackListItemFromRow(row);
  }
}

export interface UsePortfolioPropertiesResult {
  list: PortfolioListItem[];
  /** Raw rows from Supabase (map backfill, diagnostics) */
  rawProperties: PropertyRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePortfolioProperties(
  userId: string | null
): UsePortfolioPropertiesResult {
  const [list, setList] = useState<PortfolioListItem[]>([]);
  const [rawProperties, setRawProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!userId) {
      setList([]);
      setRawProperties([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // `getPortfolioProperties` reads Supabase-backed portfolio records.
      const { properties, error: err } = await getPortfolioProperties(getSupabase(), userId);
      if (err) {
        setError(err);
        setList([]);
        setRawProperties([]);
      } else {
        const usable = properties.filter(isUsablePortfolioRow);
        if (usable.length < properties.length) {
          logErrorSafe(
            'usePortfolioProperties dropped invalid rows',
            new Error(`${properties.length - usable.length} row(s) missing id/portfolio_id`)
          );
        }
        setRawProperties(usable);
        setList(usable.map(rowToListItem));
      }
    } catch (e) {
      logErrorSafe('usePortfolioProperties fetchList', e);
      const message = e instanceof Error ? e.message : 'Failed to load portfolio';
      setError(message);
      setList([]);
      setRawProperties([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(
    () => subscribePortfolioRefresh(() => void fetchList()),
    [fetchList]
  );

  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(() => {
      setMonitoringPortfolioPropertyCount(list.length);
    }, 1600);
    return () => clearTimeout(t);
  }, [userId, list.length]);

  return { list, rawProperties, loading, error, refresh: fetchList };
}
