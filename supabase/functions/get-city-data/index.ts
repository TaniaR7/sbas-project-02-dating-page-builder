import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getPixabayImage } from "../_shared/pixabay.ts";
import { marked } from "https://esm.sh/marked@9.1.6";

// Utility functions
const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
};

async function downloadAndStoreImage(imageUrl: string, citySlug: string, index: number, supabase: any): Promise<string> {
  try {
    console.log(`Downloading image from ${imageUrl} for ${citySlug}`);
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);

    const blob = await response.blob();
    const fileExt = imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${citySlug}-${index}.${fileExt}`;
    const filePath = `${citySlug}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('city_images')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return imageUrl; // Fallback to original URL if upload fails
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('city_images')
      .getPublicUrl(filePath);

    console.log(`Successfully stored image at ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error in downloadAndStoreImage:', error);
    return imageUrl; // Fallback to original URL if process fails
  }
}

const checkCacheValid = async (supabase: any, url: string): Promise<string | null> => {
  console.log("Checking cache for URL:", url);
  try {
    const { data: cachedPage, error } = await supabase
      .from("page_cache")
      .select("html_content")
      .eq("url", url)
      .gt("expires_at", new Date().toISOString())
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
    console.error("Error in checkCacheValid:", error);
    return null;
  }
};

const updateCache = async (supabase: any, url: string, htmlContent: string) => {
  console.log("Updating cache for URL:", url);
  const created_at = new Date().toISOString();
  const expires_at = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString();

  try {
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
};

const getStyles = () => ({
  h1: "text-4xl font-bold mb-6",
  h2: "text-3xl font-bold mb-6",
  h3: "text-2xl font-bold mb-4",
  p: "text-lg mb-4",
  ul: "list-disc pl-6 mb-4",
  li: "mb-2",
});

// Content generation
async function generateSectionContent(section: { title: string, prompt: string }): Promise<Section> {
  console.log(`Generating content for section: ${section.title}`);
  try {
    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful dating assistant that generates SEO optimized content for dating websites in German language. Always use markdown formatting for better readability. Use short paragraphs with a maximum of 120 words per paragraph." 
          },
          { role: "user", content: section.prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!gptResponse.ok) {
      throw new Error(`OpenAI API error: ${await gptResponse.text()}`);
    }

    const gptData = await gptResponse.json();
    const markdownContent = gptData.choices?.[0]?.message?.content || "No content generated";
    const styles = getStyles();
    
    let htmlContent = marked(markdownContent, { 
      gfm: true, 
      breaks: true,
      sanitize: true 
    });

    // Add inline styles to HTML elements
    Object.entries(styles).forEach(([tag, style]) => {
      const regex = new RegExp(`<${tag}([^>]*)>`, 'g');
      htmlContent = htmlContent.replace(regex, `<${tag} class="${style}"$1>`);
    });

    return {
      title: section.title,
      content: htmlContent
    };
  } catch (error) {
    console.error(`Error generating content for section ${section.title}:`, error);
    return {
      title: section.title,
      content: `<p class="text-red-500">Error generating content: ${error.message}</p>`
    };
  }
}

async function generateCityContent(cityData: CityData, citySlug: string, supabase: any): Promise<CacheContent> {
  console.log("Generating content for city:", cityData.name);
  
  const sections = [
    {
      title: `${cityData.name} – Die Stadt der Singles`,
      prompt: `Write a welcoming introduction about singles in ${cityData.name}, focusing on the city's appeal for singles and dating. Include why ${cityData.name} is an exciting place for singles. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `${cityData.name}: Eine Stadt für Lebensfreude und Begegnungen`,
      prompt: `Describe ${cityData.name}'s unique characteristics, culture, and lifestyle that make it attractive for singles. Include specific details about the city's atmosphere and what makes it special for dating. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `Die besten Orte, um andere Singles zu treffen`,
      prompt: `List and describe the best places in ${cityData.name} for singles to meet, including popular bars, cafes, cultural venues, and outdoor spaces. Be specific about locations and what makes them good for meeting people. Use one bullet lists where appropriate. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `Singles in ${cityData.name}`,
      prompt: `Provide information about the single population in ${cityData.name}, including demographics, age distribution, and interesting statistics about singles in the city. Be concise. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `Veranstaltungen und Netzwerke für Singles in ${cityData.name}`,
      prompt: `Detail the various events, meetups, and networking opportunities available for singles in ${cityData.name}. Include specific events and organizations that cater to singles. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `Tipps für erfolgreiches Dating in ${cityData.name}`,
      prompt: `Give helpful and actionable tips for successful dating in ${cityData.name} considering the regional mentality and customs. Promote authenticity and openness as the keys to success. Share some ${cityData.name} specific insights for more online dating success. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `Fazit: Warum ${cityData.name} ideal für Singles ist`,
      prompt: `Provide a summary of the advantages for singles in ${cityData.name}. Encouragement to use the potential of the city and online dating to meet new people. Close with a call-to-action: "Trau dich, ${cityData.name}s Single-Welt zu entdecken!". Do not write a concluding paragraph. Do not return the title.`
    }
  ];

  console.log("Generating content for all sections");
  const generatedSections = await Promise.all(sections.map(generateSectionContent));

  // Get and store city images
  console.log("Fetching images from Pixabay for", cityData.name);
  const pixabayImages = await Promise.all([
    getPixabayImage(cityData.name, Deno.env.get("PIXABAY_API_KEY")!),
    getPixabayImage(`${cityData.name} city`, Deno.env.get("PIXABAY_API_KEY")!)
  ]);

  // Store images in Supabase storage
  const storedImages = await Promise.all(
    pixabayImages
      .filter(Boolean)
      .slice(0, 2)
      .map((imageUrl, index) => downloadAndStoreImage(imageUrl, citySlug, index + 1, supabase))
  );

  return {
    cityName: cityData.name,
    bundesland: cityData.bundesland,
    title: `Singles in ${cityData.name} - Die besten Dating-Portale ${new Date().getFullYear()}`,
    description: `Entdecke die Dating-Szene in ${cityData.name}. Finde die besten Orte zum Kennenlernen und die top Dating-Portale für Singles in ${cityData.name}.`,
    introduction: generatedSections[0].content,
    images: storedImages,
    sections: generatedSections.slice(1),
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
}

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
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
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
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
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
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
