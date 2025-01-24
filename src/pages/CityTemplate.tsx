import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CityTemplate = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['cityContent', citySlug],
    queryFn: async () => {
      if (!citySlug) {
        throw new Error('Stadt-URL ist erforderlich');
      }

      try {
        console.log('Fetching data for city:', citySlug);
        const { data: functionData, error: functionError } = await supabase.functions.invoke('get-city-data', {
          params: { citySlug }
        });

        if (functionError) {
          throw functionError;
        }

        console.log('Received data:', functionData);
        return functionData;
      } catch (err) {
        console.error('Error fetching city data:', err);
        toast({
          title: "Fehler beim Laden",
          description: "Die Stadtdaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.",
          variant: "destructive",
        });
        throw err;
      }
    },
    retry: 1,
    enabled: !!citySlug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Fehler beim Laden der Inhalte</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Stadt nicht gefunden</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{data.title || `Singles in ${citySlug} - Die besten Dating-Portale ${new Date().getFullYear()}`}</title>
        <meta name="description" content={data.description} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <header className="bg-primary py-20 text-white relative overflow-hidden">
          {data.images?.[0] && (
            <div className="absolute inset-0">
              <img
                src={data.images[0]}
                alt={`Dating in ${citySlug}`}
                className="w-full h-full object-cover opacity-20"
              />
            </div>
          )}
          <div className="container mx-auto text-center px-4 relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Singles in {data.cityName} finden
            </h1>
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              Jetzt Dating-Portal finden
            </Button>
          </div>
        </header>

        {/* Main Content Sections */}
        <div className="container mx-auto px-4 py-16">
          {/* Introduction Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{data.cityName} – Die Stadt der Singles</h2>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: data.introduction }} />
            </div>
          </section>

          {/* City Info Section */}
          <section className="mb-16">
            <div className="prose max-w-none">
              <h2 className="text-3xl font-bold mb-6">{data.cityName}: Eine Stadt für Lebensfreude und Begegnungen</h2>
              <div dangerouslySetInnerHTML={{ __html: data.sections[1]?.content }} />
            </div>
          </section>

          {/* Meeting Places Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{data.sections[2]?.title}</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.sections[2]?.content }} />
          </section>

          {/* Singles Demographics Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{data.sections[3]?.title}</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.sections[3]?.content }} />
          </section>

          {/* Events and Networks Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{data.sections[4]?.title}</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.sections[4]?.content }} />
          </section>

          {/* Dating Sites Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{data.sections[5]?.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.datingSites?.map((site) => (
                <Card key={site.name} className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold mb-3">{site.name}</h3>
                  <p className="text-gray-600 mb-4">{site.description}</p>
                  <Button asChild variant="default" className="w-full">
                    <a href={site.link} target="_blank" rel="noopener noreferrer">
                      Kostenlos testen
                    </a>
                  </Button>
                </Card>
              ))}
            </div>
          </section>

          {/* Dating Tips Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{data.sections[6]?.title}</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.sections[6]?.content }} />
          </section>

          {/* Conclusion Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{data.sections[7]?.title}</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.sections[7]?.content }} />
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Über uns</h3>
                <p className="text-gray-400">
                  Wir helfen Singles seit fast 10 Jahren, die perfekte Dating-Plattform zu finden.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
                <p className="text-gray-400">info@singleboersen-aktuell.de</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Links</h3>
                <ul className="text-gray-400">
                  <li className="mb-2">
                    <a href="#" className="hover:text-white">Impressum</a>
                  </li>
                  <li className="mb-2">
                    <a href="#" className="hover:text-white">Datenschutz</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default CityTemplate;
