import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { generateCityContent } from "../_shared/content-generator.ts";
import { corsHeaders } from "../_shared/pixabay.ts";

async function checkCache(supabase: any, url: string): Promise<string | null> {
  try {
    console.log("Checking cache for URL:", url);
    const currentDate = new Date().toISOString();
    
    const { data: cachedPage, error } = await supabase
      .from("page_cache")
      .select("html_content")
      .eq("url", url)
      .gt("expires_at", currentDate)
      .maybeSingle();

    if (error) {
      console.error("Error checking cache:", error);
      return null;
    }

    if (cachedPage?.html_content) {
      console.log("Valid cache found for URL:", url);
      return cachedPage.html_content;
    }

    console.log("No valid cache found for URL:", url);
    return null;
  } catch (error) {
    console.error("Error in checkCache:", error);
    return null;
  }
}

async function updateCache(supabase: any, url: string, htmlContent: string) {
  try {
    console.log("Updating cache for URL:", url);
    const created_at = new Date().toISOString();
    const expires_at = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString();

    const { error } = await supabase
      .from("page_cache")
      .upsert({
        url,
        html_content: htmlContent,
        created_at,
        expires_at
      }, {
        onConflict: 'url'
      });

    if (error) {
      console.error("Error updating cache:", error);
      throw error;
    }

    console.log("Successfully updated cache for URL:", url);
  } catch (error) {
    console.error("Error in updateCache:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      console.error('Invalid request method:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract citySlug from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    
    if (pathParts.length < 2 || pathParts[pathParts.length - 2] !== 'singles') {
      console.error('Invalid URL format:', url.pathname);
      return new Response(JSON.stringify({ error: 'Invalid URL format. Expected /singles/{city}' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const citySlug = pathParts[pathParts.length - 1];
    const cacheUrl = `/singles/${citySlug}`;

    if (!citySlug) {
      console.error('No city slug provided');
      return new Response(JSON.stringify({ error: 'City slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing request for city:', citySlug);
    const supabase = createSupabaseClient();

    // Check cache first
    try {
      const cachedContent = await checkCache(supabase, cacheUrl);
      if (cachedContent) {
        console.log('Returning cached content for:', cacheUrl);
        return new Response(cachedContent, {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=31536000'
          }
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
      return new Response(JSON.stringify({ error: cityError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!cityData) {
      console.error('City not found:', citySlug);
      return new Response(JSON.stringify({ error: 'Stadt nicht gefunden' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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