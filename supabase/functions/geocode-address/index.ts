// Supabase Edge Function: geocode an address via Google Geocoding API.
// POST body: { address: string }
// Always returns HTTP 200 with JSON so the mobile client can read { error } instead of a generic non-2xx message.
// Success: { lat, lng, formatted_address, place_id }
// No results: { lat: null, ..., geocode_status: "ZERO_RESULTS" }
// Failure: { lat: null, lng: null, formatted_address: null, place_id: null, error: string, code: string, ... }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function emptyResult(extra: Record<string, unknown> = {}) {
  return {
    lat: null,
    lng: null,
    formatted_address: null,
    place_id: null,
    ...extra,
  };
}

function logEdge(step: string, payload: Record<string, unknown>) {
  try {
    console.error(JSON.stringify({ fn: "geocode-address", step, ...payload }));
  } catch {
    console.error(`[geocode-address] ${step}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!key) {
      logEdge("config", { reason: "missing_GOOGLE_MAPS_API_KEY" });
      return new Response(
        JSON.stringify(
          emptyResult({
            error: "GOOGLE_MAPS_API_KEY not configured",
            code: "config_missing",
          })
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: { address?: string };
    try {
      body = (await req.json()) as { address?: string };
    } catch {
      logEdge("bad_json", {});
      return new Response(
        JSON.stringify(
          emptyResult({
            error: "Invalid JSON body",
            code: "bad_request",
          })
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const address = body.address;
    if (!address || typeof address !== "string") {
      return new Response(
        JSON.stringify(
          emptyResult({
            error: "Missing or invalid address",
            code: "bad_request",
          })
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      const upstreamMsg = data.error_message || data.status || "Geocoding failed";
      logEdge("google_rejected", {
        google_status: data.status,
        status: res.status,
        error_message: typeof upstreamMsg === "string" ? upstreamMsg.slice(0, 200) : String(upstreamMsg),
      });
      return new Response(
        JSON.stringify(
          emptyResult({
            error: upstreamMsg,
            code: "upstream_error",
            google_status: data.status,
            upstream_http_status: res.status,
          })
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const first = data.results?.[0];
    if (!first) {
      return new Response(
        JSON.stringify({
          lat: null,
          lng: null,
          formatted_address: null,
          place_id: null,
          geocode_status: "ZERO_RESULTS",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const out = {
      lat: first.geometry?.location?.lat ?? null,
      lng: first.geometry?.location?.lng ?? null,
      formatted_address: first.formatted_address ?? null,
      place_id: first.place_id ?? null,
    };
    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const errStr = String(e);
    logEdge("exception", { message: errStr.slice(0, 300) });
    return new Response(
      JSON.stringify(
        emptyResult({
          error: errStr,
          code: "internal",
        })
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
