import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { tryGetSupabaseClient } from '@/services/supabase';
import type { PropertyRow } from '@/types/property';

export function useProperties() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const client = tryGetSupabaseClient();
    if (!client) {
      setProperties([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await client
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (qErr) {
      setError(qErr.message);
      setProperties([]);
      return;
    }
    setProperties((data ?? []) as PropertyRow[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { properties, loading, error, refresh };
}
