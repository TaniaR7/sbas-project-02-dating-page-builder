import { marked } from "https://esm.sh/marked@9.1.6";
import { getCityImages } from "./image-handler.ts";

const getStyles = () => ({
  h1: "text-4xl font-bold mb-6",
  h2: "text-3xl font-bold mb-6",
  h3: "text-2xl font-bold mb-4",
  p: "text-lg mb-4",
  ul: "list-disc pl-6 mb-4",
  li: "mb-2",
});

async function generateSectionContent(section: { title: string, prompt: string }, cityName: string, images?: string[]): Promise<Section> {
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
            content: "You are a helpful dating assistant that generates SEO optimized content for dating websites in German language. Always use markdown formatting for better readability. Use short paragraphs with a maximum of 120 words per paragraph. Use the informal 'du'. If you use headings do not format them as h1 or h2, but h3, h4, h5, h6 where necessary." 
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
    let markdownContent = gptData.choices?.[0]?.message?.content || "No content generated";
    const styles = getStyles();
    
    // If this is section 2 and we have an image, embed it in the content
    if (section.title.includes("Eine Stadt für Lebensfreude") && images?.[1]) {
      const imageHtml = `<img src="${images[1]}" alt="Leben in ${cityName}" style="float: right; margin-left: 20px; margin-bottom: 20px; max-width: 200px; height: auto;" class="rounded-lg shadow-lg" />`;
      markdownContent = imageHtml + "\n\n" + markdownContent;
    }

    let htmlContent = marked(markdownContent, { 
      gfm: true, 
      breaks: true,
      sanitize: true 
    });

    // Add clear:both to the last paragraph to prevent overlap
    if (section.title.includes("Eine Stadt für Lebensfreude")) {
      htmlContent = htmlContent.replace(/<\/p>$/, ' style="clear: both;"></p>');
    }

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

export async function generateCityContent(cityData: CityData, citySlug: string, supabase: any): Promise<CacheContent> {
  console.log("Generating content for city:", cityData.name);
  
  const sections = [
    {
      title: `${cityData.name} – Die Stadt der Singles`,
      prompt: `Write a welcoming introduction about singles in ${cityData.name}, focusing on the city's appeal for singles and dating. Include why ${cityData.name} is an exciting place for singles. Do not use subheadings. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `${cityData.name}: Eine Stadt für Lebensfreude und Begegnungen`,
      prompt: `Describe ${cityData.name}'s unique characteristics, culture, and lifestyle that make it attractive for singles. Include specific details about the city's atmosphere and what makes it special for dating. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `Die besten Orte, um andere Singles zu treffen`,
      prompt: `List and describe the best places in ${cityData.name} for singles to meet, including popular bars, cafes, cultural venues, and outdoor spaces. Be specific about locations and what makes them good for meeting people. Use a bulleted list where appropriate. Do not write a concluding paragraph. Do not return the title in your answer.`
    },
    {
      title: `Singles in ${cityData.name}`,
      prompt: `Provide information about the single population in ${cityData.name}, including demographics, age distribution, and interesting statistics about singles in the city. Be concise and use h3 subheadings. Do not write a concluding paragraph. Do not return the title or the first heading.`
    },
    {
      title: `Veranstaltungen und Netzwerke für Singles in ${cityData.name}`,
      prompt: `Detail the various events, meetups, and networking opportunities available for singles in ${cityData.name}. Include specific events and organizations that cater to singles. Do not mention 'online dating'. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `Tipps für erfolgreiches Dating in ${cityData.name}`,
      prompt: `Give helpful and actionable tips for successful dating in ${cityData.name} considering the regional mentality and customs. Promote authenticity and openness as the keys to success. Share some ${cityData.name} specific insights for more dating success; use a numbered list with 3-5 list items. Do not write a concluding paragraph. Do not return the title.`
    },
    {
      title: `Fazit: Warum ${cityData.name} ideal für Singles ist`,
      prompt: `Provide a summary of the advantages for singles in ${cityData.name}. Encouragement to use the potential of the city and online dating to meet new people. Do not use subheadings. Close with a call-to-action: "Trau dich, ${cityData.name}s Single-Welt zu entdecken!". Do not write a concluding paragraph. Do not return the title.`
    }
  ];

  console.log("Generating content for all sections");
  const generatedSections = await Promise.all(sections.map(generateSectionContent));

  return {
    cityName: cityData.name,
    bundesland: cityData.bundesland,
    title: `Singles in ${cityData.name} - Die besten Dating-Portale ${new Date().getFullYear()}`,
    description: `Entdecke die Dating-Szene in ${cityData.name}. Finde die besten Orte zum Kennenlernen und die top Dating-Portale für Singles in ${cityData.name}.`,
    introduction: generatedSections[0].content,
    images: await getCityImages(cityData.name, citySlug, supabase),
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
