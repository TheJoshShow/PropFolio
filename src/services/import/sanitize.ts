const MAX_URL = 2048;

/** Trim and cap length; server re-validates. */
export function sanitizePastedUrl(raw: string): string {
  return raw.replace(/^\s+|\s+$/g, '').slice(0, MAX_URL);
}

export function isNonEmptyUrl(raw: string): boolean {
  return sanitizePastedUrl(raw).length >= 8;
}
