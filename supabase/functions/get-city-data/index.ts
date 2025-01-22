import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { generateCityContent } from "../_shared/content-generator.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const citySlug = url.searchParams.get('citySlug');

    if (!citySlug) {
      throw new Error('City slug is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch city data
    const { data: cityData, error: cityError } = await supabaseClient
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
    const content = await generateCityContent(cityData, citySlug, supabaseClient);

    return new Response(
      JSON.stringify(content),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});