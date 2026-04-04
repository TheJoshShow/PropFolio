/** Lightweight validation — no external deps in Deno deploy bundle */

export function isNonEmptyString(v: unknown, maxLen: number): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen;
}

export function optionalString(v: unknown, maxLen: number): string | undefined {
  if (v === undefined || v === null) {
    return undefined;
  }
  if (typeof v !== 'string') {
    return undefined;
  }
  const t = v.trim();
  return t.length <= maxLen ? t : undefined;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function clampStr(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max);
}
