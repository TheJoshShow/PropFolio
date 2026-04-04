import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { isValidUuid } from '@/lib/uuid';
import { tryGetSupabaseClient } from '@/services/supabase';
import type { PropertyRow } from '@/types/property';

export function usePropertyDetail(id: string | undefined) {
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setProperty(null);
      setLoading(false);
      setError(null);
      return;
    }
    if (!isValidUuid(id)) {
      setProperty(null);
      setLoading(false);
      setError(
        'This link doesn’t look like a valid property. Open the property from your portfolio instead.',
      );
      return;
    }
    const client = tryGetSupabaseClient();
    if (!client) {
      setLoading(false);
      setError('App isn’t connected. Add Supabase keys in `.env` and restart.');
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await client.from('properties').select('*').eq('id', id).maybeSingle();
    setLoading(false);
    if (qErr) {
      setError("We couldn’t load this property. Check your connection and try again.");
      setProperty(null);
      return;
    }
    if (!data) {
      setError('This property isn’t in your portfolio anymore, or you don’t have access.');
      setProperty(null);
      return;
    }
    setProperty(data as PropertyRow);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { property, loading, error, refresh };
}
