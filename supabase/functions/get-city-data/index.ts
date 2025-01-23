import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { checkCacheValid, updateCache } from "../_shared/cache-handler.ts";
import { generateCityContent } from "../_shared/content-generator.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { citySlug } = await req.json();
    
    if (!citySlug) {
      return new Response(JSON.stringify({ error: 'City slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing request for city:', citySlug);

    const supabase = createSupabaseClient();
    const cacheUrl = `/singles/${citySlug}`;

    // Check cache first
    try {
      const cachedContent = await checkCacheValid(supabase, cacheUrl);
      if (cachedContent) {
        console.log('Returning cached content for:', cacheUrl);
        return new Response(cachedContent, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (cacheError) {
      console.error('Cache check error:', cacheError);
      // Continue execution even if cache check fails
    }

    // If no cache, get city data
    const { data: cityData, error: cityError } = await supabase
      .from("cities")
      .select("name, bundesland")
      .eq("slug", citySlug)
      .maybeSingle();

    if (cityError) {
      console.error('Error fetching city data:', cityError);
      throw new Error(cityError.message);
    }

    if (!cityData) {
      console.error('City not found:', citySlug);
      throw new Error('Stadt nicht gefunden');
    }

    // Generate new content
    try {
      const content = await generateCityContent(cityData, citySlug, supabase);
      const htmlContent = JSON.stringify(content);
      
      // Update cache
      try {
        await updateCache(supabase, cacheUrl, htmlContent);
      } catch (cacheError) {
        console.error('Cache update error:', cacheError);
        // Continue even if cache update fails
      }
      
      return new Response(htmlContent, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (contentError) {
      console.error('Content generation error:', contentError);
      // Return a fallback response with basic city information
      const fallbackContent = {
        cityName: cityData.name,
        bundesland: cityData.bundesland,
        title: `Singles in ${cityData.name} - Die besten Dating-Portale ${new Date().getFullYear()}`,
        description: `Entdecke die Dating-Szene in ${cityData.name}. Finde die besten Orte zum Kennenlernen und die top Dating-Portale für Singles in ${cityData.name}.`,
        introduction: `Willkommen in ${cityData.name}! Leider können wir momentan keine detaillierten Informationen anzeigen. Bitte versuchen Sie es später erneut.`,
        sections: [],
        datingSites: [
          {
            name: "Parship",
            description: "Eine der führenden Partnervermittlungen",
            link: "https://singleboersen-aktuell.de/go/target.php?v=parship"
          },
          {
            name: "ElitePartner",
            description: "Hoher Anteil an Akademikern",
            link: "https://singleboersen-aktuell.de/go/target.php?v=elitepartner"
          }
        ]
      };
      
      return new Response(JSON.stringify(fallbackContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Ein unerwarteter Fehler ist aufgetreten',
        details: error.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});