/**
 * Fetch user's portfolio properties and compute list-item analysis (deal score, confidence, cash flow).
 * Returns list, loading, error, refresh. Handles offline/API errors.
 */

import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '../services/supabase';
import { getPortfolioProperties, type PropertyRow } from '../services/portfolio';
import { runPropertyDetailAnalysis } from '../features/property-analysis';
import type { DealScoreBand } from '../lib/scoring/types';
import type { ConfidenceMeterBand } from '../lib/confidence/types';

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
}

function rowToListItem(row: PropertyRow): PortfolioListItem {
  const analysis = runPropertyDetailAnalysis({
    listPrice: row.list_price ?? null,
    rent: row.rent ?? null,
    streetAddress: row.street_address ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    postalCode: row.postal_code ?? '',
    unitCount: 1,
  });
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
  };
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
      // `getPortfolioProperties` handles both Supabase and local/offline storage.
      const { properties, error: err } = await getPortfolioProperties(getSupabase(), userId);
      if (err) {
        setError(err);
        setList([]);
        setRawProperties([]);
      } else {
        setRawProperties(properties);
        setList(properties.map(rowToListItem));
      }
    } catch (e) {
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

  return { list, rawProperties, loading, error, refresh: fetchList };
}
