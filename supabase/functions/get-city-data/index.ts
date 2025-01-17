import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client at the top level
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const websiteContext = `Willkommen bei Singlebörsen-Aktuell, Ihrer Anlaufstelle für die besten Dating-Portale. Hier finden Sie umfassende Informationen und Bewertungen zu verschiedenen Plattformen, die Ihnen helfen, den idealen Partner zu finden.`;
const contentOutline = `1. Einleitung\n2. Die besten Dating-Portale\n3. Tipps für die Partnersuche\n4. Häufig gestellte Fragen\n5. Fazit`;
const singleboersen = `1. Parship\n2. ElitePartner\n3. eDarling\n4. Tinder\n5. Lovoo`;

async function generateSitemap() {
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('slug')
      .order('name');

    if (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }

    if (!cities) {
      throw new Error('No cities found');
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const baseUrl = 'https://lokal.singleboersen-aktuell.de';

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>`;

    for (const city of cities) {
      sitemap += `
  <url>
    <loc>${baseUrl}/singles/${city.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    sitemap += '\n</urlset>';
    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}

async function generateSectionContent(city: string, section: number, contentOutline: string) {
  let prompt = '';
  switch (section) {
    case 1:
      prompt = `Using the content description from section 1 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${contentOutline}`;
      break;
    case 2:
      prompt = `Using the content description from section 2 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${contentOutline}`;
      break;
    case 3:
      prompt = `Using the content description from section 3 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string. Also, return the names of the parks, cafes and bars mentioned, as a list:\n\n${contentOutline}`;
      break;
    case 4:
      prompt = `Using the content description from section 4 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string. Also, return a list of statistics for the city and for the number of singles living there, as a dictionary:\n\n${contentOutline}`;
      break;
    case 5:
      prompt = `Using the content description from section 5 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${contentOutline}`;
      break;
    case 6:
      prompt = `Using the content description from section 6 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string. Select 2 random cards from the following dating sites and include their HTML in the string:\n\n${singleboersen}`;
      break;
    case 9:
      prompt = `For the '9. Häufig gestellte Fragen' section, loop through each question and generate an answer to the question as it relates to ${city}. Return this as an html section with the original questions included as headings.`;
      break;
    default:
      prompt = `Generate content for section ${section} about ${city}`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates content for city pages.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error generating content for section ${section}:`, error);
    return '';
  }
}

async function getPixabayImage(city: string) {
  const pixabayApiKey = Deno.env.get('PIXABAY_API_KEY');
  const searchTerm = encodeURIComponent(`${city} city`);
  
  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${pixabayApiKey}&q=${searchTerm}&image_type=photo&orientation=horizontal&per_page=3`
    );
    const data = await response.json();
    
    if (data.hits && data.hits.length > 0) {
      return data.hits[0].webformatURL;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Pixabay image:', error);
    return null;
  }
}

async function generateMetaData(city: string) {
  const prompt = `Generate SEO-optimized meta title and description for a dating website subpage about singles in ${city}. Include the current year and focus on local dating.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates SEO metadata.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const [title, description] = content.split('\n');
    
    return {
      title: title.replace('Title: ', ''),
      description: description.replace('Description: ', ''),
      canonical: `https://singleboersen-aktuell.de/singles/${city.toLowerCase()}`,
      keywords: [
        `Single ${city}`,
        `Singles ${city}`,
        `Wieviele Singles in ${city}`,
        `Singles in ${city}`,
        `Single in ${city}`,
        `Singles aus ${city}`,
        `Single aus ${city}`,
        `${city}er Singles`,
        `${city} Singles`
      ].join(', ')
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return null;
  }
}

async function generateCityContent(city: string, bundesland: string) {
  const sections = {};
  
  for (let i = 1; i <= 9; i++) {
    // Skip sections 7 and 8 as they're not in the requirements
    if (i === 7 || i === 8) continue;
    
    const cacheKey = `${city}-section-${i}`;
    
    // Check section cache
    const { data: cachedSection } = await supabase
      .from('content_cache')
      .select('content')
      .eq('cache_key', cacheKey)
      .single();
    
    if (cachedSection) {
      sections[`section${i}`] = cachedSection.content;
      continue;
    }
    
    // Generate new content
    const sectionContent = await generateSectionContent(city, i, contentOutline);
    
    // Get image for the section
    const imageUrl = await getPixabayImage(city);
    
    // Combine content with image
    const contentWithImage = imageUrl 
      ? `${sectionContent}\n<div class="section-image"><img src="${imageUrl}" alt="${city} - Section ${i}" class="w-full h-64 object-cover rounded-lg shadow-lg" /></div>`
      : sectionContent;
    
    // Cache the content
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);
    
    await supabase
      .from('content_cache')
      .upsert({
        cache_key: cacheKey,
        content: contentWithImage,
        expires_at: expiresAt.toISOString()
      });
    
    sections[`section${i}`] = contentWithImage;
  }

  return {
    sections,
    metadata: await generateMetaData(city),
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": `Singles in ${city} - Die besten Dating-Portale ${new Date().getFullYear()}`,
      "description": `Finde die besten Dating-Portale in ${city}. Vergleiche jetzt die Top-Singlebörsen und finde deinen Traumpartner in ${city}!`,
      "image": "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": "Singlebörsen-Aktuell"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Singlebörsen-Aktuell",
        "logo": {
          "@type": "ImageObject",
          "url": "/logo.png"
        }
      }
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    console.log('Request path:', path);

    // Handle sitemap.xml request
    if (path === '/sitemap.xml') {
      const sitemap = await generateSitemap();
      return new Response(sitemap, { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        },
        status: 200 
      });
    }

    // Check if this is a city subpage request
    const citySlug = path.match(/\/singles\/([^\/]+)/)?.[1];
    if (citySlug) {
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('*')
        .eq('slug', citySlug)
        .single();

      if (cityError) {
        console.error('Error fetching city data:', cityError);
        return new Response(
          JSON.stringify({ error: 'Error fetching city data' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      if (!cityData) {
        return new Response(
          JSON.stringify({ error: 'City not found' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        );
      }

      // Check cache
      const cacheKey = `city-content-${citySlug}`;
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: cachedContent, error: cacheError } = await supabase
        .from('content_cache')
        .select('content')
        .eq('cache_key', cacheKey)
        .gte('expires_at', sixMonthsAgo.toISOString())
        .maybeSingle();

      if (cacheError) {
        console.error('Error checking cache:', cacheError);
      }

      if (cachedContent) {
        console.log('Cache hit for:', cacheKey);
        return new Response(
          JSON.stringify(cachedContent.content),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      // Generate new content
      try {
        const content = await generateCityContent(
          cityData.name,
          cityData.bundesland
        );

        // Cache the content
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 6);

        const { error: cacheError } = await supabase
          .from('content_cache')
          .upsert({
            cache_key: cacheKey,
            content,
            expires_at: expiresAt.toISOString()
          });

        if (cacheError) {
          console.error('Error caching content:', cacheError);
        }

        return new Response(
          JSON.stringify(content),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      } catch (error) {
        console.error('Error generating content:', error);
        return new Response(
          JSON.stringify({ error: 'Error generating content' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
    }

    // Handle existing homepage functionality
    const { data: homepageContent, error: homepageError } = await supabase
      .from('homepage_content')
      .select('*')
      .single();

    if (homepageError) {
      console.error('Error fetching homepage content:', homepageError);
      return new Response(
        JSON.stringify({ error: 'Error fetching homepage content' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    return new Response(
      JSON.stringify(homepageContent),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
