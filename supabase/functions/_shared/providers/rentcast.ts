/**
 * RentCast HTTP client — API key from Edge secrets only (RENTCAST_API_KEY).
 * Shared across import-property and rent-estimate functions.
 */

const BASE = 'https://api.rentcast.io/v1';

export async function fetchWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function fetchPropertyRecord(
  addressLine: string,
  apiKey: string,
  timeoutMs: number,
): Promise<{ ok: true; record: Record<string, unknown> | null } | { ok: false; error: string }> {
  const u = new URL(`${BASE}/properties`);
  u.searchParams.set('address', addressLine);
  u.searchParams.set('limit', '1');

  try {
    const res = await fetchWithTimeout(
      u.toString(),
      { Accept: 'application/json', 'X-Api-Key': apiKey },
      timeoutMs,
    );
    if (!res.ok) {
      return { ok: false, error: `properties ${res.status}` };
    }
    const data = (await res.json()) as unknown;
    const arr = Array.isArray(data) ? data : [];
    const record = (arr[0] as Record<string, unknown>) ?? null;
    return { ok: true, record };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'network';
    return { ok: false, error: msg };
  }
}

export async function fetchRentLongTerm(
  addressLine: string,
  apiKey: string,
  timeoutMs: number,
): Promise<{ ok: true; data: Record<string, unknown> | null } | { ok: false; error: string }> {
  const u = new URL(`${BASE}/avm/rent/long-term`);
  u.searchParams.set('address', addressLine);

  try {
    const res = await fetchWithTimeout(
      u.toString(),
      { Accept: 'application/json', 'X-Api-Key': apiKey },
      timeoutMs,
    );
    if (!res.ok) {
      return { ok: false, error: `rent_avm ${res.status}` };
    }
    const data = (await res.json()) as Record<string, unknown>;
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'network';
    return { ok: false, error: msg };
  }
}

export function extractRentMonthly(rentJson: Record<string, unknown> | null): number | null {
  if (!rentJson) {
    return null;
  }
  const candidates = [
    rentJson.rent,
    rentJson.estimatedRent,
    rentJson.longTermRent,
    (rentJson as { rentEstimate?: { value?: number } }).rentEstimate?.value,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) {
      return c;
    }
  }
  return null;
}
