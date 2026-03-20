// Supabase Edge Function: rent estimate via RentCast API.
// POST body: { address: string, bedrooms?: number, propertyType?: string }
// Returns: RentCast response (rent estimate and comps) or error.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RENTCAST_BASE = "https://api.rentcast.io/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("RENTCAST_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "RENTCAST_API_KEY not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as { address?: string; bedrooms?: number; propertyType?: string };
    const address = typeof body.address === "string" ? body.address.trim() : "";
    if (!address) {
      return new Response(
        JSON.stringify({ error: "Missing address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({ address });
    if (typeof body.bedrooms === "number") params.set("bedrooms", String(body.bedrooms));
    if (typeof body.propertyType === "string") params.set("propertyType", body.propertyType);

    const url = `${RENTCAST_BASE}/avm/rent/long-term?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
    });
    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message || data.error || res.statusText || "Rent estimate failed" }),
        { status: res.status >= 500 ? 502 : res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize so client can read .rent (RentCast may return rent, monthlyRent, or rentAmount)
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
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
