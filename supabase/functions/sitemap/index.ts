import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format } from 'https://deno.land/std@0.208.0/datetime/format.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting sitemap generation...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching cities from database...');

    // Fetch all cities from the database with explicit error handling
    const { data: cities, error } = await supabase
      .from('cities')
      .select('slug')
      .order('slug');

    if (error) {
      console.error('Error fetching cities:', error);
      throw new Error(`Failed to fetch cities: ${error.message}`);
    }

    if (!cities) {
      console.error('No cities data returned from database');
      throw new Error('No cities data returned from database');
    }

    console.log(`Found ${cities.length} cities in database`);

    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const baseUrl = 'https://regional.singleboersen-aktuell.de';

    // Start building the XML sitemap with proper XML declaration and namespace
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Add an entry for each city
    console.log('Adding city entries to sitemap...');
    for (const city of cities) {
      if (!city.slug) {
        console.warn('Found city without slug, skipping');
        continue;
      }

      console.log(`Adding entry for city: ${city.slug}`);
      sitemap += `
  <url>
    <loc>${baseUrl}/singles/${city.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Close the urlset tag
    sitemap += '\n</urlset>';

    console.log('Sitemap generation completed successfully');

    // Return the XML with appropriate headers
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    };

    return new Response(sitemap, { headers });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error generating sitemap', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});