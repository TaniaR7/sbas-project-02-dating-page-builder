import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PIXABAY_API_KEY = Deno.env.get("PIXABAY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface CityData {
  name: string;
  bundesland: string;
  slug: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const cityMatch = path.match(/^\/singles\/([^\/]+)$/);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle city list request (homepage)
    if (path === "/" || path === "") {
      const { data: cities, error } = await supabase
        .from("cities")
        .select("name, slug, bundesland");

      if (error) throw error;

      const cityCards = cities.map((city: CityData) => ({
        title: `Singles in ${city.name}`,
        link: `/singles/${city.slug}`,
        description: `Finde dein Match in ${city.name}`,
        bundesland: city.bundesland
      }));

      return new Response(
        JSON.stringify({ cityCards }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle individual city page request
    if (cityMatch) {
      const citySlug = cityMatch[1];
      
      // Check if city exists
      const { data: cityData, error: cityError } = await supabase
        .from("cities")
        .select("name, bundesland")
        .eq("slug", citySlug)
        .single();

      if (cityError || !cityData) {
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
        return new Response(
          JSON.stringify(cachedContent.content),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Generate content using GPT-4
      const prompt = `Generate content for a dating website page about singles in ${cityData.name}, ${cityData.bundesland}. 
                     Follow this outline: [content outline from custom instructions]
                     Format the response in JSON with sections matching the outline.
                     Keep the tone professional but friendly, and all text in German.`;

      const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful assistant that generates content for dating websites." },
            { role: "user", content: prompt }
          ],
        }),
      });

      const gptData = await gptResponse.json();
      const generatedContent = gptData.choices[0].message.content;

      // Get images from Pixabay for sections 1 and 2
      const pixabayResponse = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(cityData.name + " city")}&image_type=photo&per_page=2`
      );
      const pixabayData = await pixabayResponse.json();
      const images = pixabayData.hits.slice(0, 2).map((hit: any) => hit.largeImageURL);

      // Combine content with images and dating site recommendations
      const finalContent = {
        ...JSON.parse(generatedContent),
        images,
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
      const { error: insertError } = await supabase
        .from("content_cache")
        .insert({
          cache_key: cacheKey,
          content: finalContent,
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
    }

    // Handle 404 for unknown routes
    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});