/**
 * Retry transient failures (network blips). Do not retry 4xx from providers.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries: number; baseDelayMs: number; label: string },
): Promise<T> {
  let last: unknown;
  for (let i = 0; i <= opts.retries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < opts.retries) {
        await new Promise((r) => setTimeout(r, opts.baseDelayMs * (i + 1)));
      }
    }
  }
  throw last instanceof Error ? last : new Error(`${opts.label} failed`);
}
