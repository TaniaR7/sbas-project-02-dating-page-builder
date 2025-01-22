import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const url = new URL(req.url);
    const citySlug = url.pathname.split('/').pop();

    if (!citySlug) {
      throw new Error('City slug is required');
    }

    // Check cache first
    const now = new Date().toISOString();
    const { data: cachedPage, error: cacheError } = await supabase
      .from('page_cache')
      .select('html_content')
      .eq('url', `/singles/${citySlug}`)
      .gt('expires_at', now)
      .maybeSingle();

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    } else if (cachedPage?.html_content) {
      console.log('Cache hit for:', citySlug);
      return new Response(cachedPage.html_content, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    // Get city data
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('slug', citySlug)
      .single();

    if (cityError) {
      throw new Error(`Error fetching city: ${cityError.message}`);
    }

    if (!cityData) {
      throw new Error('City not found');
    }

    // Generate content
    const content = await generateCityContent(cityData, citySlug, supabase);
    const htmlContent = JSON.stringify(content);

    // Cache the content
    try {
      const created_at = new Date().toISOString();
      const expires_at = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString();

      const { error: cacheWriteError } = await supabase
        .from('page_cache')
        .upsert({
          url: `/singles/${citySlug}`,
          html_content: htmlContent,
          created_at,
          expires_at
        });

      if (cacheWriteError) {
        console.error('Cache write error:', cacheWriteError);
      }
    } catch (cacheError) {
      console.error('Error writing to cache:', cacheError);
    }

    return new Response(htmlContent, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});