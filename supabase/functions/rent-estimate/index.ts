// Supabase Edge Function: rent estimate via RentCast API.
// POST body: { address: string, bedrooms?: number, propertyType?: string }
// Always returns HTTP 200 with JSON so clients can parse { error } reliably.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RENTCAST_BASE = "https://api.rentcast.io/v1";

function logEdge(step: string, payload: Record<string, unknown>) {
  try {
    console.error(JSON.stringify({ fn: "rent-estimate", step, ...payload }));
  } catch {
    console.error(`[rent-estimate] ${step}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("RENTCAST_API_KEY");
    if (!apiKey) {
      logEdge("config", { reason: "missing_RENTCAST_API_KEY" });
      return new Response(
        JSON.stringify({ error: "RENTCAST_API_KEY not configured", code: "config_missing" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: { address?: string; bedrooms?: number; propertyType?: string };
    try {
      body = (await req.json()) as { address?: string; bedrooms?: number; propertyType?: string };
    } catch {
      logEdge("bad_json", {});
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", code: "bad_request" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const address = typeof body.address === "string" ? body.address.trim() : "";
    if (!address) {
      return new Response(
        JSON.stringify({ error: "Missing address", code: "bad_request" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({ address });
    if (typeof body.bedrooms === "number") params.set("bedrooms", String(body.bedrooms));
    if (typeof body.propertyType === "string") params.set("propertyType", body.propertyType);

    const url = `${RENTCAST_BASE}/avm/rent/long-term?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const d = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
      const msg =
        (typeof d.message === "string" && d.message) ||
        (typeof d.error === "string" && d.error) ||
        res.statusText ||
        "Rent estimate failed";
      logEdge("rentcast_http_error", {
        http_status: res.status,
        message: String(msg).slice(0, 200),
      });
      const code =
        res.status === 401 || res.status === 403
          ? "auth_denied"
          : res.status === 429
            ? "rate_limited"
            : res.status >= 500
              ? "upstream_error"
              : "upstream_error";
      return new Response(
        JSON.stringify({
          error: msg,
          code,
          upstream_http_status: res.status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const obj = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
    const rent =
      typeof obj.rent === "number"
        ? obj.rent
        : typeof obj.monthlyRent === "number"
          ? obj.monthlyRent
          : typeof obj.rentAmount === "number"
            ? obj.rentAmount
            : undefined;
    const out = { ...obj, rent: rent ?? obj.rent };

    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const errStr = String(e);
    logEdge("exception", { message: errStr.slice(0, 300) });
    return new Response(
      JSON.stringify({ error: errStr, code: "internal" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
