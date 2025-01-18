import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getPixabayImage } from "../_shared/pixabay.ts";

const PIXABAY_API_KEY = Deno.env.get("PIXABAY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const hasBody = req.headers.get("content-length") !== "0" && req.headers.get("content-type")?.includes("application/json");
    
    let citySlug;
    if (hasBody) {
      const body = await req.json();
      citySlug = body.citySlug;
    }

    console.log("Processing request for city:", citySlug);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Check cache first before doing anything else
    const cacheKey = `/singles/${citySlug}`;
    console.log("Checking cache for key:", cacheKey);
    
    const { data: cachedContent, error: cacheError } = await supabase
      .from("content_cache")
      .select("content, expires_at")
      .eq("cache_key", cacheKey)
      .single();

    if (!cacheError && cachedContent) {
      const expiresAt = new Date(cachedContent.expires_at);
      if (expiresAt > new Date()) {
        console.log("Returning cached content for", citySlug);
        return new Response(
          JSON.stringify(cachedContent.content),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.log("Cache expired for", citySlug);
    }

    // If we reach here, we need to generate new content
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

    console.log("Generating new content for", citySlug);
    const prompt = `Generate content for a dating website page about singles in ${cityData.name}, ${cityData.bundesland}. 
                   Include information about the dating scene, popular meeting places, and statistics about singles.
                   Format the response as plain text, not JSON.`;

    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant that generates content for dating websites in German language." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!gptResponse.ok) {
      console.error("OpenAI API error:", await gptResponse.text());
      throw new Error("Failed to generate content");
    }

    const gptData = await gptResponse.json();
    const generatedContent = gptData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("Invalid response from OpenAI API");
    }

    console.log("Fetching images from Pixabay");
    const cityImage = await getPixabayImage(`${cityData.name} city`, PIXABAY_API_KEY!);
    const lifestyleImage = await getPixabayImage(`${cityData.name} lifestyle`, PIXABAY_API_KEY!);

    const finalContent = {
      content: generatedContent,
      images: [cityImage, lifestyleImage],
      cityName: cityData.name,
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

    const { error: insertError } = await supabase
      .from("content_cache")
      .upsert({
        cache_key: cacheKey,
        content: finalContent,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Cache insertion error:", insertError);
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