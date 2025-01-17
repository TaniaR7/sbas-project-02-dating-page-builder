import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const websiteContext = `Entdecke mit Singlebörsen-aktuell.de tolle Singles in deiner Nähe!
In Deutschland gibt es über 2.000 verschiedene Online-Dating Portale!
Hier findest Du auf Basis der aktuellsten Tests die bestmöglichen Singlebörsen für Deine Region.
Wir zeigen Dir, auf welches Portal Du Dich zu 100% verlassen kannst.
Unsere Testsieger werden auf Basis objektiver und fundierter Ergebnisse ermittelt
Alle vorgestellten Dating-Portale werden kontinuierlich überprüft`;

const contentOutline = `Gliederung für den Blogbeitrag: Tipps für Singles in {city}
1. {city} – Die Stadt der Singles
Begrüßung und Einführung ins Thema.
{city} als pulsierende Stadt mit wachsender Single-Community.
Relevanz des Themas: Warum sind Singles in {city} eine spannende Zielgruppe?

2. {city}: Eine Stadt für Lebensfreude und Begegnungen
Kurzportrait der Stadt: Geschichte, Kultur, Lebensstil, Typisches.
Was {city} für Singles besonders attraktiv macht (Lebensqualität, junge und dynamische Bevölkerung).
Die Bedeutung von {city}s vielfältigem Freizeitangebot für Singles.

3. Die besten Orte, um andere Singles zu treffen
Bars und Cafés: Empfehlungen für Treffpunkte in {city}
Veranstaltungen und Kultur: Festivals, Konzerte und Theatervorstellungen als Plattform für Begegnungen in {city}.
Parks und Grünflächen: beliebte Treffpunkte in {city}.

4. Singles in {city}
Wieviele Singles gibt es in {city}?
Die Geschlechterverteilung der Singles in {city}
Die Altersverteilung der Singles in {city}

5. Veranstaltungen und Netzwerke für Singles in {city}
Überblick über Single-Partys und Speed-Dating-Events in {city}.
Networking-Events für junge Berufstätige.
Workshops und Freizeitgruppen: Sport, Kochen, Kunst.

6. Online-Dating in {city}
Vorstellung und Kurzanalyse der zwei beliebtesten Plattformen für Singles in {city}
Tipps zur Erstellung eines attraktiven Profils speziell für {city}.
Lokale Communities und Social-Media-Gruppen für Singles.

7. Tipps für erfolgreiches Dating in {city}
Authentizität und Offenheit als Schlüssel zum Erfolg.
Geheime Tipps für besondere Dates
Do's and Don'ts für das Kennenlernen.

8. Fazit: Warum {city} ideal für Singles ist
Zusammenfassung der Vorteile für Singles in {city}.
Ermutigung das Potenzial der Stadt und von Online-Dating nutzen, um neue Menschen kennenzulernen.
Call-to-Action: „Trau dich, {city}s Single-Welt zu entdecken!"

9. Häufig gestellte Fragen
Wo gehen die meisten Singles in {city} hin?
Wieviele Single-Männer gibt es in {city}?
Wo finde ich die meisten Singles in {city}?
Welche Dating-App in {city}?
Wie alt sind die meisten Singles in {city}?
Wieviele Single-Frauen gibt es in {city}?
Wie viele Singles gibt es in {city}?
Welche Casual Dating-App ist die beste für {city}?
Welche Dating-App benutzen ältere Frauen in {city}?
Wo trifft man die meisten Singles in {city}?`;

const singleboersen = {
  parship: {
    name: "Parship",
    description: "Eine der führenden Partnervermittlungen",
    features: [
      "Eine der größten Mitgliederdatenbanken",
      "Hohe Erfolgsquote durch bewährtes Matching",
      "Hoher Anteil an Akademikern",
      "Geeignet für berufstätige Singles mit wenig Zeit",
      "Sehr guter Kundenservice"
    ],
    link: "https://singleboersen-aktuell.de/go/target.php?v=parship"
  },
  elitePartner: {
    name: "ElitePartner",
    description: "Eine der führenden Partnervermittlungen",
    features: [
      "Hoher Anteil an Akademikern",
      "Hohe Erfolgsquote von 42 % mit wissenschaftlichem Matching",
      "Geeignet für berufstätige Singles mit Niveau"
    ],
    link: "https://singleboersen-aktuell.de/go/target.php?v=elitepartner"
  },
  lemonSwan: {
    name: "LemonSwan",
    description: "Moderne wissenschaftliche Partnervermittlung",
    features: [
      "Aktuellstes, wissenschaftlich fundiertes Matching",
      "Hoher Anteil an Akademikern",
      "Geeignet für berufstätige Singles",
      "Alle Profile werden von Hand geprüft",
      "Kostenlose Premium-Mitgliedschaft für Alleinerziehende und Studenten"
    ],
    link: "https://singleboersen-aktuell.de/go/target.php?v=lemonswan"
  }
};

async function generateSectionContent(city: string, section: number, contentOutline: string) {
  const sectionContent = contentOutline.split('\n').find(line => line.startsWith(`${section}.`));
  if (!sectionContent) return '';

  let prompt = '';
  switch (section) {
    case 1:
      prompt = `Using the content description from section 1 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${sectionContent}`;
      break;
    case 2:
      prompt = `Using the content description from section 2 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${sectionContent}`;
      break;
    case 3:
      prompt = `Using the content description from section 3 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${sectionContent}`;
      break;
    case 4:
      prompt = `Using the content description from section 4 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${sectionContent}`;
      break;
    case 5:
      prompt = `Using the content description from section 5 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${sectionContent}`;
      break;
    case 6:
      prompt = `Using the content description from section 6 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${sectionContent}`;
      break;
    case 7:
      prompt = `Using the content description from section 7 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${sectionContent}`;
      break;
    case 8:
      prompt = `Using the content description from section 8 of the following content outline, generate a heading (h2) and 2 paragraphs for the section about ${city}, and insert this heading and 2 paragraphs into a string:\n\n${sectionContent}`;
      break;
    case 9:
      prompt = `For the '9. Häufig gestellte Fragen' section, loop through each question and ask GPT-4o-mini to generate an answer to the question as it relates to ${city}. Return this as an html section with the original questions included as headings.`;
      break;
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

async function generateCityContent(city: string, bundesland: string, contentOutline: string) {
  const sections = {};
  
  for (let i = 1; i <= 9; i++) {
    const sectionContent = await generateSectionContent(city, i, contentOutline);
    sections[`section${i}`] = sectionContent;
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const citySlug = path.match(/\/singles\/([^\/]+)/)?.[1];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if this is a city subpage request
    if (citySlug) {
      const { data: cityData } = await supabase
        .from('cities')
        .select('*')
        .eq('slug', citySlug)
        .single();

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

      const { data: cachedContent } = await supabase
        .from('content_cache')
        .select('content')
        .eq('cache_key', cacheKey)
        .gte('expires_at', sixMonthsAgo.toISOString())
        .maybeSingle();

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
      const content = await generateCityContent(
        cityData.name,
        cityData.bundesland,
        contentOutline
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
    }

    // Handle existing homepage functionality
    const { data: homepageContent } = await supabase
      .from('homepage_content')
      .select('*')
      .single();

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
    )
  }
});
