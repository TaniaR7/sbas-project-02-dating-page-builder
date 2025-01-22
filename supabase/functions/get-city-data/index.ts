import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { checkCacheValid, updateCache } from "../_shared/cache-handler.ts";
import { generateCityContent } from "../_shared/content-generator.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Edge function called with method:', req.method);
    
    if (req.method !== 'POST') {
      throw new Error(`HTTP method ${req.method} is not allowed`);
    }

    const { citySlug } = await req.json();
    console.log('Received request for city:', citySlug);

    if (!citySlug) {
      throw new Error('City slug is required');
    }

    const supabase = createSupabaseClient();
    const cacheUrl = `/singles/${citySlug}`;

    // Check cache first
    const cachedContent = await checkCacheValid(supabase, cacheUrl);
    
    if (cachedContent) {
      console.log('Returning cached content for:', cacheUrl);
      return new Response(cachedContent, {
        headers: { ...corsHeaders }
      });
    }

    // If no cache, get city data
    const { data: cityData, error: cityError } = await supabase
      .from("cities")
      .select("name, bundesland")
      .eq("slug", citySlug)
      .maybeSingle();

    if (cityError || !cityData) {
      console.error('Error fetching city data:', cityError);
      throw new Error(cityError?.message || 'City not found');
    }

    // Generate new content
    const content = await generateCityContent(cityData, citySlug, supabase);
    const htmlContent = JSON.stringify(content);
    
    try {
      // Update cache
      await updateCache(supabase, cacheUrl, htmlContent);
    } catch (cacheError) {
      console.error('Cache update error:', cacheError);
      // Continue even if cache update fails
    }
    
    return new Response(htmlContent, {
      headers: { ...corsHeaders }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        details: error.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders }
      }
    );
  }
});