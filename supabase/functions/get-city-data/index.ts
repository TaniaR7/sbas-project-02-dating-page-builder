import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { generateCityContent } from "../_shared/content-generator.ts";
import { corsHeaders } from "../_shared/pixabay.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.error('Invalid request method:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract request body
    const { citySlug, cityData } = await req.json();

    if (!citySlug || !cityData) {
      console.error('Missing required data:', { citySlug, cityData });
      return new Response(JSON.stringify({ error: 'Missing required data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing request for city:', citySlug);
    const supabase = createSupabaseClient();

    // Generate new content
    try {
      const content = await generateCityContent(cityData, citySlug, supabase);
      
      return new Response(JSON.stringify(content), {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=31536000'
        }
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
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=31536000'
        }
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});