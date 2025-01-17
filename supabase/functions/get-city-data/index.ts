import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const websiteContext = `Entdecke mit Singlebörsen-aktuell.de tolle Singles in deiner Nähe!...`; // Full context from custom instructions

const contentOutline = `Gliederung für den Blogbeitrag: Tipps für Singles in {city}...`; // Full outline from custom instructions

const singleboersen = `Parship:...`; // Full content from custom instructions

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch cities from the database
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching cities:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch cities' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Structure the response data
    const responseData = {
      cities: cities.reduce((acc, city) => {
        acc[city.name] = {
          name: city.name,
          bundesland: city.bundesland,
          slug: city.slug
        }
        return acc
      }, {}),
      websiteContext,
      contentOutline,
      singleboersen
    }

    console.log(`Successfully fetched ${cities.length} cities`)

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})