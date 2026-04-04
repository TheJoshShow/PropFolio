import { corsHeaders } from './cors.ts';

/** Stable error envelope for all authenticated Edge Functions */
export type EdgeErrorBody = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  correlationId?: string;
};

export function jsonError(
  code: string,
  message: string,
  status: number,
  correlationId?: string,
): Response {
  const body: EdgeErrorBody = {
    ok: false,
    error: { code, message },
    ...(correlationId ? { correlationId } : {}),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function jsonSuccess<T extends Record<string, unknown>>(
  data: T & { ok?: true },
  status = 200,
): Response {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
