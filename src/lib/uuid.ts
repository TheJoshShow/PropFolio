const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID_V4_RE.test(value);
}

/** RFC4122 v4 — no native dependency */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Google Places Autocomplete (New) `sessionToken`: max 36 URL/filename-safe ASCII chars.
 * Hyphenated UUIDs can trigger INVALID_ARGUMENT; use compact hex (32 chars).
 */
export function generatePlacesSessionToken(): string {
  return generateUuid().replace(/-/g, '');
}
