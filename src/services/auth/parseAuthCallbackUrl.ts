/**
 * Extracts Supabase auth tokens from deep-link URLs (hash or query).
 * Password reset and magic links often use #access_token=...&refresh_token=...
 */
export function parseAuthTokensFromUrl(url: string): {
  access_token: string | null;
  refresh_token: string | null;
  type: string | null;
} {
  let access_token: string | null = null;
  let refresh_token: string | null = null;
  let type: string | null = null;

  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  const parsePart = (part: string) => {
    const normalized = part.startsWith('#') || part.startsWith('?') ? part.slice(1) : part;
    const params = new URLSearchParams(normalized);
    access_token = params.get('access_token') ?? access_token;
    refresh_token = params.get('refresh_token') ?? refresh_token;
    type = params.get('type') ?? type;
  };

  if (hashIndex >= 0) {
    parsePart(url.slice(hashIndex));
  }
  if (queryIndex >= 0) {
    const end = hashIndex > queryIndex ? hashIndex : url.length;
    parsePart(url.slice(queryIndex, end));
  }

  return { access_token, refresh_token, type };
}
