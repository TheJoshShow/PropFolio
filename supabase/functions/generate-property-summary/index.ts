/**
 * AI narrative only — never computes financial metrics. Requires OPENAI_API_KEY (secret).
 * Input: propertyId (UUID). Output: summary text or placeholder when AI disabled.
 */
import { requireAuthedUser } from '../_shared/auth.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { logStructured } from '../_shared/logger.ts';
import { isUuid, optionalString } from '../_shared/validate.ts';

type Body = { propertyId?: string; correlationId?: string };

const SYSTEM_PROMPT =
  `You are PropFolio's investment copywriter. Write 2-4 short paragraphs of plain-English narrative for a real estate investor.
Rules:
- Do NOT invent or estimate dollar amounts, cap rates, cash flow, or yields.
- Only refer to qualitative signals visible in the JSON (e.g. beds, baths, rent estimate if present, data gaps).
- If data is thin, say what is missing and suggest verifying on the ground.
- Tone: calm, professional, not salesy.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  let correlationId = '';
  try {
    const { userId, supabase } = await requireAuthedUser(req);
    const body = (await req.json()) as Body;
    correlationId = optionalString(body.correlationId, 64) ?? '';

    const pid = body.propertyId;
    if (!isUuid(pid)) {
      return jsonResponse(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'propertyId must be a UUID' } },
        400,
      );
    }
    const propertyId = pid;

    const { data: row, error } = await supabase
      .from('properties')
      .select('id, snapshot, formatted_address, status')
      .eq('id', propertyId)
      .maybeSingle();

    if (error || !row) {
      return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Property not found' } }, 404);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
    if (!openaiKey) {
      logStructured(
        {
          scope: 'summary',
          step: 'skip',
          status: 'skip',
          correlationId,
          userId,
          message: 'OPENAI_API_KEY missing',
        },
        'warn',
      );
      return jsonResponse({
        ok: true,
        summary: null,
        mode: 'placeholder',
        message: 'AI summaries are not configured on this environment.',
        correlationId,
      });
    }

    const userContent = JSON.stringify({
      address: row.formatted_address,
      status: row.status,
      snapshot: row.snapshot,
    }).slice(0, 24_000);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_SUMMARY_MODEL') ?? 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 600,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Property context JSON:\n${userContent}` },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      logStructured(
        {
          scope: 'summary',
          step: 'openai',
          status: 'fail',
          correlationId,
          userId,
          message: `openai_${res.status}`,
          extra: { body: t.slice(0, 400) },
        },
        'error',
      );
      return jsonResponse(
        { ok: false, error: { code: 'AI_PROVIDER_ERROR', message: 'Summary generation failed' } },
        502,
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const summary = data.choices?.[0]?.message?.content?.trim() ?? '';

    logStructured({
      scope: 'summary',
      step: 'complete',
      status: 'ok',
      correlationId,
      userId,
    });

    return jsonResponse({
      ok: true,
      summary: summary || null,
      mode: 'ai',
      correlationId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') {
      return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }
    if (msg === 'SERVER_MISCONFIGURED') {
      return jsonResponse(
        { ok: false, error: { code: 'SERVER_MISCONFIGURED', message: 'Server misconfigured' } },
        500,
      );
    }
    logStructured(
      { scope: 'summary', step: 'fatal', status: 'fail', correlationId, message: msg },
      'error',
    );
    return jsonResponse({ ok: false, error: { code: 'INTERNAL', message: 'Server error' } }, 500);
  }
});
