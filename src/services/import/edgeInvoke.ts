import { getSupabaseClient } from '@/services/supabase';

const DEFAULT_TIMEOUT_MS = 28_000;

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Invokes a Supabase Edge Function with JWT, timeout, and limited retries (transient failures).
 */
export async function invokeEdgeFunction<TResponse>(
  name: string,
  body: Record<string, unknown>,
  options?: { retries?: number; timeoutMs?: number },
): Promise<TResponse> {
  const retries = options?.retries ?? 2;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const client = getSupabaseClient();

  let lastMessage = 'Import failed';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const payload = await Promise.race([
        (async () => {
          const { data, error } = await client.functions.invoke<TResponse>(name, { body });
          if (error) {
            throw new Error(error.message || 'Edge function error');
          }
          return data;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Try again.')), timeoutMs),
        ),
      ]);

      if (payload == null) {
        throw new Error('Empty response from server');
      }
      return payload as TResponse;
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : 'Import failed';
      if (attempt < retries) {
        await sleep(350 * (attempt + 1));
      }
    }
  }

  throw new Error(lastMessage);
}
