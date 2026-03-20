// Supabase Edge Function: geocode an address via Google Geocoding API.
// POST body: { address: string }
// Returns: { lat, lng, formatted_address, place_id } or error.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!key) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { address } = (await req.json()) as { address?: string };
    if (!address || typeof address !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return new Response(
        JSON.stringify({ error: data.error_message || data.status || "Geocoding failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const first = data.results?.[0];
    if (!first) {
      return new Response(
        JSON.stringify({ error: "No results", lat: null, lng: null, formatted_address: null, place_id: null }),
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
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
