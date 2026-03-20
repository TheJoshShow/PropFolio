// Supabase Edge Function: address autocomplete via Google Places API (New).
// POST body: { input: string }
// Returns: { predictions: Array<{ description, place_id }> }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!key) {
      // Return 200 so the client can reliably parse { error } from the JSON body.
      // This avoids client-side "status code 503" messages that hide the real root cause.
      return new Response(
        JSON.stringify({ predictions: [], error: "GOOGLE_MAPS_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { input } = (await req.json()) as { input?: string };
    const query = typeof input === "string" ? input.trim() : "";
    if (!query) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
      },
      body: JSON.stringify({ input: query }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          predictions: [],
          error: data.error?.message || res.statusText || "Autocomplete failed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const suggestions = data.suggestions ?? [];
    const predictions = suggestions
      .filter((s: { placePrediction?: { text?: { text?: string }; placeId?: string } }) => s.placePrediction)
      .map((s: { placePrediction: { text?: { text?: string }; placeId?: string } }) => ({
        description: s.placePrediction.text?.text ?? "",
        place_id: s.placePrediction.placeId ?? "",
      }));

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ predictions: [], error: String(e) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
