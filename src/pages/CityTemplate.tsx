import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

interface CityTemplateProps {
  city: string;
  bundesland: string;
  schema?: any;
  metadata?: {
    title: string;
    description: string;
    canonical: string;
    keywords: string;
  };
}

const CityTemplate = ({ city, bundesland, schema, metadata }: CityTemplateProps) => {
  // Sample dating sites data (would be populated from singleboersen)
  const datingSites = [
    {
      name: "Parship",
      description: "Eine der führenden Partnervermittlungen",
      link: "https://singleboersen-aktuell.de/go/target.php?v=parship",
    },
    {
      name: "ElitePartner",
      description: "Hoher Anteil an Akademikern",
      link: "https://singleboersen-aktuell.de/go/target.php?v=elitepartner",
    },
  ];

  return (
    <>
      <Helmet>
        <title>{metadata?.title || `Singles in ${city} - Die besten Dating-Portale ${new Date().getFullYear()}`}</title>
        <meta name="description" content={metadata?.description} />
        <meta name="keywords" content={metadata?.keywords} />
        {metadata?.canonical && <link rel="canonical" href={metadata.canonical} />}
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <header className="bg-primary py-20 text-white">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Singles in {city} finden
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Entdecke die besten Dating-Portale in {city} und finde deinen Traumpartner!
            </p>
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              Jetzt Dating-Portal finden
            </Button>
          </div>
        </header>

        {/* City Info Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">{city} – Die Stadt der Singles</h2>
              <p className="text-gray-600 mb-4">
                {city} in {bundesland} bietet Singles zahlreiche Möglichkeiten, 
                den perfekten Partner zu finden. Mit unserer Hilfe findest du die 
                beste Dating-Plattform für deine Bedürfnisse.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
                alt={`Dating in ${city}`}
                className="w-full h-64 object-cover"
              />
            </div>
          </div>
        </section>

        {/* Dating Sites Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Die besten Dating-Portale in {city}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {datingSites.map((site) => (
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
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Singles in {city}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl font-bold text-primary mb-2">60%</div>
              <p>Singles in {city}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl font-bold text-primary mb-2">25-34</div>
              <p>Durchschnittsalter</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl font-bold text-primary mb-2">52%</div>
              <p>Frauen</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Häufig gestellte Fragen zu Dating in {city}
            </h2>
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Wo treffen sich Singles in {city}?
                </h3>
                <p className="text-gray-600">
                  Es gibt viele beliebte Treffpunkte für Singles in {city}, 
                  sowohl online als auch offline. Unsere Dating-Portale bieten 
                  dir die Möglichkeit, andere Singles kennenzulernen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Über uns</h3>
                <p className="text-gray-400">
                  Wir helfen dir seit fast 10 Jahren dabei, die perfekte Dating-Plattform zu finden.
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
