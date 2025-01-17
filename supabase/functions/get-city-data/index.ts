import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch cities from the database
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching cities:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch cities' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Structure the response data
    const responseData = {
      cities: cities.reduce((acc, city) => {
        acc[city.name] = {
          name: city.name,
          bundesland: city.bundesland,
          slug: city.slug
        }
        return acc
      }, {}),
      websiteContext,
      contentOutline,
      singleboersen
    }

    console.log(`Successfully fetched ${cities.length} cities`)

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})