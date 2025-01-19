import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getPixabayImage } from "../_shared/pixabay.ts";
import { marked } from "https://esm.sh/marked@9.1.6";

// Type definitions for better code organization
interface Section {
  title: string;
  prompt: string;
}

interface CityData {
  name: string;
  bundesland: string;
}

interface GeneratedSection {
  title: string;
  content: string;
}

interface CacheContent {
  cityName: string;
  bundesland: string;
  title: string;
  description: string;
  introduction: string;
  images: string[];
  cityInfo: {
    title: string;
    content: string;
  };
  sections: GeneratedSection[];
  datingSites: Array<{
    name: string;
    description: string;
    link: string;
  }>;
}

// Utility functions
const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
};

const getStyles = () => ({
  h1: "font-size: 34px; font-weight: bold;",
  h2: "font-size: 30px; font-weight: bold;",
  h3: "font-size: 26px; font-weight: bold;",
  h4: "font-size: 22px; font-weight: bold;",
  h5: "font-size: 20px; font-weight: bold;",
  h6: "font-size: 18px; font-weight: bold;",
  p: "font-size: 16px;",
});

// Cache management functions
async function checkCache(supabase: any, cacheKey: string) {
  console.log("Checking cache for key:", cacheKey);
  try {
    const { data: cachedContent, error: cacheError } = await supabase
      .from("content_cache")
      .select("content, expires_at")
      .eq("cache_key", cacheKey)
      .single();

    if (!cacheError && cachedContent && cachedContent.content) {
      const expiresAt = new Date(cachedContent.expires_at);
      if (expiresAt > new Date()) {
        console.log("Found valid cache for", cacheKey);
        return cachedContent.content;
      }
      console.log("Cache expired for", cacheKey);
    }
    return null;
  } catch (error) {
    console.error("Error checking cache:", error);
    return null;
  }
}

async function updateCache(supabase: any, cacheKey: string, content: any) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  try {
    const { error: insertError } = await supabase
      .from("content_cache")
      .upsert({
        cache_key: cacheKey,
        content,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'cache_key'
      });

    if (insertError) {
      console.error("Cache insertion error:", insertError);
    } else {
      console.log("Successfully cached content for", cacheKey);
    }
  } catch (error) {
    console.error("Error updating cache:", error);
  }
}

// Content generation functions
async function generateSectionContent(section: Section): Promise<GeneratedSection> {
  try {
    console.log(`Generating content for section: ${section.title}`);
    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful dating assistant that generates SEO optimized content for dating websites in German language. Always use markdown formatting for better readability." },
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
      htmlContent = htmlContent.replace(regex, `<${tag} style="${style}"$1>`);
    });

    return {
      title: section.title,
      content: htmlContent
    };
  } catch (error) {
    console.error(`Error generating content for section ${section.title}:`, error);
    return {
      title: section.title,
      content: `Error generating content: ${error.message}`
    };
  }
}

async function generateCityContent(cityData: CityData): Promise<CacheContent> {
  const sections = [
    {
      title: `${cityData.name} – Die Stadt der Singles`,
      prompt: `Write a welcoming introduction about singles in ${cityData.name}, focusing on the city's appeal for singles and dating. Include why ${cityData.name} is an exciting place for singles.`
    },
    {
      title: `${cityData.name}: Eine Stadt für Lebensfreude und Begegnungen`,
      prompt: `Describe ${cityData.name}'s unique characteristics, culture, and lifestyle that make it attractive for singles. Include specific details about the city's atmosphere and what makes it special for dating.`
    },
    {
      title: `Die besten Orte, um andere Singles zu treffen`,
      prompt: `List and describe the best places in ${cityData.name} for singles to meet, including popular bars, cafes, cultural venues, and outdoor spaces. Be specific about locations and what makes them good for meeting people. Use bullet lists where appropriate.`
    },
    {
      title: `Singles in ${cityData.name}`,
      prompt: `Provide information about the single population in ${cityData.name}, including demographics, age distribution, and interesting statistics about singles in the city. Be concise.`
    },
    {
      title: `Veranstaltungen und Netzwerke für Singles in ${cityData.name}`,
      prompt: `Detail the various events, meetups, and networking opportunities available for singles in ${cityData.name}. Include specific events and organizations that cater to singles.`
    },
    {
      title: `Die besten Dating-Portale in ${cityData.name}`,
      prompt: `Describe the most popular and effective dating platforms specifically for ${cityData.name}. Include success rates, user demographics, and specific features that make them good for dating in ${cityData.name}.`
    },
    {
      title: `Tipps für erfolgreiches Dating in ${cityData.name}`,
      prompt: `Give helpful and actionable tips for successful dating in ${cityData.name} considering the regional mentality and customs. Promote authenticity and openness as the keys to success. Share some ${cityData.name} specific insights for more online dating success.`
    },
    {
      title: `Fazit: Warum ${cityData.name} ideal für Singles ist`,
      prompt: `Provide a summary of the advantages for singles in ${cityData.name}. Encouragement to use the potential of the city and online dating to meet new people. Close with a call-to-action: "Trau dich, ${cityData.name}s Single-Welt zu entdecken!"`
    }
  ];

  console.log("Generating content for all sections");
  const generatedSections = await Promise.all(sections.map(generateSectionContent));

  // Get city images
  console.log("Fetching images from Pixabay for", cityData.name);
  const cityImages = await Promise.all([
    getPixabayImage(cityData.name, Deno.env.get("PIXABAY_API_KEY")!),
    getPixabayImage(`${cityData.name} city`, Deno.env.get("PIXABAY_API_KEY")!)
  ]);

  return {
    cityName: cityData.name,
    bundesland: cityData.bundesland,
    title: `Singles in ${cityData.name} - Die besten Dating-Portale ${new Date().getFullYear()}`,
    description: `Entdecke die Dating-Szene in ${cityData.name}. Finde die besten Orte zum Kennenlernen und die top Dating-Portale für Singles in ${cityData.name}.`,
    introduction: generatedSections[0].content,
    images: cityImages.filter(Boolean),
    cityInfo: {
      title: generatedSections[1].title,
      content: generatedSections[1].content,
    },
    sections: generatedSections.slice(2),
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

// Main request handler
serve(async (req) => {
  console.log("Edge Function started");

  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    const requiredEnvVars = ['OPENAI_API_KEY', 'PIXABAY_API_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        throw new Error(`${envVar} not configured`);
      }
    }

    const supabase = createSupabaseClient();
    const hasBody = req.headers.get("content-length") !== "0" && 
                    req.headers.get("content-type")?.includes("application/json");
    
    let citySlug;
    if (hasBody) {
      const body = await req.json();
      citySlug = body.citySlug;
      console.log("Processing request for city:", citySlug);
    }

    // Handle homepage request
    if (!citySlug) {
      const { data: cities, error: citiesError } = await supabase
        .from("cities")
        .select("name, bundesland, slug")
        .limit(6);

      if (citiesError) {
        throw new Error("Failed to fetch cities");
      }

      const cityCards = cities?.map(city => ({
        title: `Singles in ${city.name}`,
        description: `Entdecke die Dating-Szene in ${city.name}`,
        bundesland: city.bundesland,
        link: `/singles/${city.slug}`
      })) || [];

      return new Response(
        JSON.stringify({
          websiteContext: "Entdecke mit Singlebörsen-aktuell.de tolle Singles in deiner Nähe!",
          cityCards
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check cache first
    const cacheKey = `/singles/${citySlug}`;
    const cachedContent = await checkCache(supabase, cacheKey);
    
    if (cachedContent) {
      return new Response(
        JSON.stringify(cachedContent),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate new content if cache miss
    console.log("Generating new content for", citySlug);
    
    const { data: cityData, error: cityError } = await supabase
      .from("cities")
      .select("name, bundesland")
      .eq("slug", citySlug)
      .single();

    if (cityError || !cityData) {
      throw new Error("City not found");
    }

    const content = await generateCityContent(cityData);
    await updateCache(supabase, cacheKey, content);

    return new Response(
      JSON.stringify(content),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred", 
        details: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
