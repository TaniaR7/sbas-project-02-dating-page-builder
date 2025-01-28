import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format } from "https://esm.sh/date-fns@2.30.0";
import { marked } from "https://esm.sh/marked@9.1.6";
import { generateCityContent } from "../_shared/content-generator.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function checkCacheValid(url: string): Promise<string | null> {
  console.log('Checking cache for URL:', url);
  try {
    const { data: cachedPage, error } = await supabase
      .from('page_cache')
      .select('html_content')
      .eq('url', url)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error checking cache:', error);
      return null;
    }

    if (cachedPage?.html_content) {
      console.log('Valid cache found for URL:', url);
      return cachedPage.html_content;
    }

    console.log('No valid cache found for URL:', url);
    return null;
  } catch (error) {
    console.error('Error in checkCacheValid:', error);
    return null;
  }
}

async function updateCache(url: string, htmlContent: string) {
  console.log('Updating cache for URL:', url);
  const created_at = new Date().toISOString();
  const expires_at = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString();

  try {
    const { error } = await supabase
      .from('page_cache')
      .upsert({
        url,
        html_content: htmlContent,
        created_at,
        expires_at
      }, {
        onConflict: 'url'
      });

    if (error) {
      console.error('Error updating cache:', error);
      throw error;
    }

    console.log('Successfully updated cache for URL:', url);
  } catch (error) {
    console.error('Error in updateCache:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle root and index paths
    if (path === '/' || path === '/index.html') {
      return new Response(
        JSON.stringify({ message: 'Welcome to the API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the path matches /singles/{city}
    const cityMatch = path.match(/^\/singles\/([^\/]+)$/);
    if (!cityMatch) {
      console.error('Invalid URL path:', path);
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const citySlug = cityMatch[1];
    console.log('Processing request for city:', citySlug);

    // Check cache first
    const cachedContent = await checkCacheValid(path);
    if (cachedContent) {
      return new Response(cachedContent, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get city data
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('name, bundesland')
      .eq('slug', citySlug)
      .maybeSingle();

    if (cityError) {
      console.error('Error fetching city data:', cityError);
      throw new Error(cityError.message);
    }

    if (!cityData) {
      console.error('City not found:', citySlug);
      return new Response(
        JSON.stringify({
          error: 'Stadt nicht gefunden',
          message: `Die Stadt "${citySlug}" wurde nicht in unserer Datenbank gefunden.`,
          fallbackContent: {
            cityName: citySlug,
            bundesland: '',
            title: `Singles in ${citySlug} - Die besten Dating-Portale ${new Date().getFullYear()}`,
            description: `Entdecke die Dating-Szene in ${citySlug}. Finde die besten Orte zum Kennenlernen und die top Dating-Portale für Singles in ${citySlug}.`,
            introduction: `Willkommen in ${citySlug}! Leider können wir momentan keine detaillierten Informationen anzeigen. Bitte versuchen Sie es später erneut.`,
            sections: [],
            datingSites: []
          }
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate new content
    const content = await generateCityContent(cityData, citySlug, supabase);
    const htmlContent = JSON.stringify(content);

    // Update cache
    try {
      await updateCache(path, htmlContent);
    } catch (cacheError) {
      console.error('Cache update error:', cacheError);
      // Continue even if cache update fails
    }

    return new Response(htmlContent, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});