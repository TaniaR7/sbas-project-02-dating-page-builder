import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PIXABAY_API_KEY = Deno.env.get("PIXABAY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { citySlug } = await req.json();
    console.log("Processing request for city:", citySlug);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if city exists
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

    // Check cache
    const cacheKey = `singles/${citySlug}`;
    const { data: cachedContent, error: cacheError } = await supabase
      .from("content_cache")
      .select("content")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (!cacheError && cachedContent) {
      console.log("Returning cached content for", citySlug);
      return new Response(
        JSON.stringify(cachedContent.content),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate content using GPT-4
    console.log("Generating new content for", citySlug);
    const prompt = `Generate content for a dating website page about singles in ${cityData.name}, ${cityData.bundesland}. 
                   Include information about the dating scene, popular meeting places, and statistics about singles.
                   Format the response in JSON with these sections:
                   - introduction (2-3 sentences)
                   - cityInfo: { title: string, content: string }
                   - sections: Array of { title: string, content: string }`;

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
      }),
    });

    if (!gptResponse.ok) {
      console.error("OpenAI API error:", await gptResponse.text());
      throw new Error("Failed to generate content");
    }

    const gptData = await gptResponse.json();
    const generatedContent = JSON.parse(gptData.choices[0].message.content);

    // Get images from Pixabay
    console.log("Fetching images from Pixabay");
    const pixabayResponse = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(cityData.name + " city")}&image_type=photo&per_page=2`
    );

    if (!pixabayResponse.ok) {
      console.error("Pixabay API error:", await pixabayResponse.text());
      throw new Error("Failed to fetch images");
    }

    const pixabayData = await pixabayResponse.json();
    const images = pixabayData.hits.slice(0, 2).map((hit: any) => hit.largeImageURL);

    // Combine content with images and dating site recommendations
    const finalContent = {
      ...generatedContent,
      images,
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

    // Cache the content
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6); // Cache for 6 months

    const { error: insertError } = await supabase
      .from("content_cache")
      .insert({
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
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});