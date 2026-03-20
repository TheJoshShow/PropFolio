// Supabase Edge Function: fetch Census data for an area (Future Value / market context).
// POST body: { state?: string, county?: string, tract?: string } or { lat?: number, lng?: number } for geolookup.
// Returns: Census ACS data (e.g. population, income, housing) for the geography.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ACS 5-year variables: B01003_001E (total pop), B19013_001E (median household income), B25077_001E (median home value)
const CENSUS_ACS_URL = "https://api.census.gov/data/2022/acs/acs5";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("CENSUS_API_KEY");
    const keyParam = apiKey ? `&key=${apiKey}` : "";

    const body = (await req.json()) as {
      state?: string;
      county?: string;
      tract?: string;
      lat?: number;
      lng?: number;
    };

    let forClause = "";
    let inClause = "";

    if (typeof body.state === "string" && body.state.trim()) {
      const state = body.state.padStart(2, "0");
      if (typeof body.county === "string" && body.county.trim()) {
        const county = body.county.padStart(3, "0");
        inClause = `in=state:${state}`;
        if (typeof body.tract === "string" && body.tract.trim()) {
          forClause = `tract:${body.tract.trim()}`;
          inClause = `in=state:${state}%20county:${county}`;
        } else {
          forClause = `county:${county}`;
        }
      } else {
        forClause = `state:${state}`;
      }
    } else if (typeof body.lat === "number" && typeof body.lng === "number") {
      // Census geocoder: lat/lng -> tract. Then use tract for ACS.
      const geoRes = await fetch(
        `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${body.lng}&y=${body.lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=14&format=json`
      );
      const geoData = await geoRes.json();
      const tractMatch = geoData.result?.geographies?.["Census Tracts"]?.[0];
      if (!tractMatch) {
        return new Response(
          JSON.stringify({ error: "No Census tract for coordinates", data: null }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const state = tractMatch.STATE ?? "";
      const county = tractMatch.COUNTY ?? "";
      const tract = tractMatch.TRACT ?? "";
      forClause = `tract:${tract}`;
      inClause = `in=state:${state}%20county:${county}`;
    } else {
      return new Response(
        JSON.stringify({ error: "Provide state (and optional county, tract) or lat/lng" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vars = "B01003_001E,B19013_001E,B25077_001E"; // pop, median income, median home value
    const url = `${CENSUS_ACS_URL}?get=NAME,${vars}&for=${forClause}&${inClause}${keyParam}`;
    const res = await fetch(url);
    const rows = await res.json();

    if (!res.ok || Array.isArray(rows) === false) {
      return new Response(
        JSON.stringify({ error: "Census request failed", data: null }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [header, ...dataRows] = rows as [string[], ...string[][]];
    const first = dataRows[0];
    if (!first || !header) {
      return new Response(
        JSON.stringify({ data: null, geography: { for: forClause, in: inClause } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const idx = (name: string) => header.indexOf(name);
    const data = {
      name: first[idx("NAME")] ?? null,
      population: first[idx("B01003_001E")] != null ? Number(first[idx("B01003_001E")]) : null,
      median_household_income: first[idx("B19013_001E")] != null ? Number(first[idx("B19013_001E")]) : null,
      median_home_value: first[idx("B25077_001E")] != null ? Number(first[idx("B25077_001E")]) : null,
    };
    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
