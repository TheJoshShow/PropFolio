export type ImportLogLevel = 'info' | 'warn' | 'error';

export type LogScope =
  | 'import'
  | 'places'
  | 'rentcast'
  | 'address'
  | 'rent_estimate'
  | 'summary'
  | 'subscription'
  | 'webhook';

/** Structured logs — Supabase Edge Log Explorer; parse JSON `message` field */
export function logStructured(
  entry: {
    scope: LogScope;
    step: string;
    status: 'ok' | 'fail' | 'partial' | 'skip';
    correlationId?: string;
    userId?: string;
    sourceType?: string;
    parsing?: string;
    geocoding?: string;
    provider?: string;
    missingFields?: string[];
    message?: string;
    extra?: Record<string, unknown>;
  },
  level: ImportLogLevel = 'info',
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...entry,
  });
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}
