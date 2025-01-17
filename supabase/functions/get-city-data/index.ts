import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cities, error } = await supabase
      .from("cities")
      .select("name, slug");

    if (error) {
      throw error;
    }

    // Transform cities data into the required format
    const cityCards = cities.map((city) => ({
      title: `Singles in ${city.name}`,
      link: `/singles/${city.slug}`,
      description: `Finde dein Match in ${city.name}`,
      bundesland: city.bundesland
    }));

    return new Response(
      JSON.stringify({ 
        cityCards,
        websiteContext: "Wir helfen dir, aus über 2.000 Dating-Portalen die beste Wahl für dich zu treffen."
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});