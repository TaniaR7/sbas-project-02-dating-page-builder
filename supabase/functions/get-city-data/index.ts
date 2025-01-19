import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getPixabayImage } from "../_shared/pixabay.ts";
import { marked } from "https://esm.sh/marked@9.1.6";

const PIXABAY_API_KEY = Deno.env.get("PIXABAY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  console.log("Edge Function started");

  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      throw new Error("OpenAI API key not configured");
    }

    if (!PIXABAY_API_KEY) {
      console.error("Pixabay API key not configured");
      throw new Error("Pixabay API key not configured");
    }

    const hasBody = req.headers.get("content-length") !== "0" && 
                    req.headers.get("content-type")?.includes("application/json");
    
    let citySlug;
    if (hasBody) {
      const body = await req.json();
      citySlug = body.citySlug;
      console.log("Processing request for city:", citySlug);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle homepage request
    if (!citySlug) {
      const { data: cities, error: citiesError } = await supabase
        .from("cities")
        .select("name, bundesland, slug")
        .limit(6);

      if (citiesError) {
        console.error("Error fetching cities:", citiesError);
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
          console.log("Found valid cache for", citySlug);
          return new Response(
            JSON.stringify(cachedContent.content),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        console.log("Cache expired for", citySlug);
      }
    } catch (cacheError) {
      console.error("Error checking cache:", cacheError);
    }

    // If we reach here, we need to generate new content
    console.log("Generating new content for", citySlug);
    
    const { data: cityData, error: cityError } = await supabase
      .from("cities")
      .select("name, bundesland")
      .eq("slug", citySlug)
      .single();

    if (cityError || !cityData) {
      console.error("City not found:", cityError);
      return new Response(
        JSON.stringify({ error: "City not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Get city images first to ensure we have them
    console.log("Fetching images from Pixabay for", cityData.name);
    let cityImages: string[] = [];
    try {
      const [image1, image2] = await Promise.all([
        getPixabayImage(cityData.name, PIXABAY_API_KEY!),
        getPixabayImage(`${cityData.name} city`, PIXABAY_API_KEY!)
      ]);
      cityImages = [image1, image2].filter(Boolean);
    } catch (error) {
      console.error("Error fetching Pixabay images:", error);
    }

    // Generate content for each section
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
        prompt: `List and describe the best places in ${cityData.name} for singles to meet, including popular bars, cafes, cultural venues, and outdoor spaces. Be specific about locations and what makes them good for meeting people.`
      },
      {
        title: `Singles in ${cityData.name}`,
        prompt: `Provide information about the single population in ${cityData.name}, including demographics, age distribution, and interesting statistics about singles in the city.`
      },
      {
        title: `Veranstaltungen und Netzwerke für Singles in ${cityData.name}`,
        prompt: `Detail the various events, meetups, and networking opportunities available for singles in ${cityData.name}. Include specific events and organizations that cater to singles.`
      }
    ];

    console.log("Generating content for all sections");
    const generatedSections = await Promise.all(sections.map(async (section) => {
      try {
        console.log(`Generating content for section: ${section.title}`);
        const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are a helpful assistant that generates content for dating websites in German language. Always use markdown formatting for better readability." },
              { role: "user", content: section.prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (!gptResponse.ok) {
          console.error(`OpenAI API error for section ${section.title}:`, await gptResponse.text());
          return {
            title: section.title,
            content: `Content generation failed for this section. Please try again later.`
          };
        }

        const gptData = await gptResponse.json();
        const markdownContent = gptData.choices?.[0]?.message?.content || "No content generated";
        
        try {
          // Parse markdown to HTML
          const htmlContent = marked(markdownContent, { 
            gfm: true, 
            breaks: true,
            sanitize: true 
          });
          return {
            title: section.title,
            content: htmlContent
          };
        } catch (parseError) {
          console.error(`Error parsing markdown for section ${section.title}:`, parseError);
          return {
            title: section.title,
            content: markdownContent // Return raw content if parsing fails
          };
        }
      } catch (error) {
        console.error(`Error generating content for section ${section.title}:`, error);
        return {
          title: section.title,
          content: `Error generating content: ${error.message}`
        };
      }
    }));

    // Assemble the final content object
    const finalContent = {
      cityName: cityData.name,
      bundesland: cityData.bundesland,
      title: `Singles in ${cityData.name} - Die besten Dating-Portale ${new Date().getFullYear()}`,
      description: `Entdecke die Dating-Szene in ${cityData.name}. Finde die besten Orte zum Kennenlernen und die top Dating-Portale für Singles in ${cityData.name}.`,
      introduction: generatedSections[0].content,
      images: cityImages,
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

    // Set cache expiration to 6 months from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    // Cache the content
    try {
      console.log("Caching content for", citySlug);
      const { error: insertError } = await supabase
        .from("content_cache")
        .upsert({
          cache_key: cacheKey,
          content: finalContent,
          expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'cache_key'
        });

      if (insertError) {
        console.error("Cache insertion error:", insertError);
      } else {
        console.log("Successfully cached content for", citySlug);
      }
    } catch (cacheError) {
      console.error("Error updating cache:", cacheError);
      // Continue to return content even if caching fails
    }

    return new Response(
      JSON.stringify(finalContent),
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