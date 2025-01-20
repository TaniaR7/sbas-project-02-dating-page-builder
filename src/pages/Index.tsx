import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const Index = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['websiteData'],
    queryFn: async () => {
      const { data: cities } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      
      return {
        cities,
        websiteContext: "Wir helfen dir, aus über 2.000 Dating-Portalen die beste Wahl für dich zu treffen.",
      };
    },
  });

  const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const categories = [
    {
      title: "Partnervermittlung",
      description: "Für ernsthafte und langfristige Beziehungen",
      link: "#",
    },
    {
      title: "Singlebörse",
      description: "Zum unverbindlichen Flirten und Kennenlernen",
      link: "#",
    },
    {
      title: "Partnersuche ab 50",
      description: "Speziell für die Generation 50+",
      link: "#",
    },
    {
      title: "Casual Dating",
      description: "Für diskrete und zwanglose Begegnungen",
      link: "#",
    },
  ];

  const team = [
    {
      name: "Tania Roskat",
      role: "Redaktion",
      description: "Social Media Expertin mit Fokus auf Singlebörsen und Dating-Apps",
    },
    {
      name: "Ulrike Lemke",
      role: "Content",
      description: "Erfahrene Online-Redakteurin für Partnervermittlungen",
    },
    {
      name: "Holger Mahnke",
      role: "Content",
      description: "Experte für ungezwungenes Online-Dating",
    },
  ];

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="bg-primary py-20 text-white">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Entdecke tolle Singles in deiner Nähe!
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {data?.websiteContext}
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
            Zu unseren Testsiegern
          </Button>
        </div>
      </header>

      {/* City Cards Link */}
      <div className="py-16 container mx-auto px-4">
        <h2 
          onClick={() => scrollToSection('city-cards')} 
          className="text-3xl font-bold text-center mb-12 cursor-pointer hover:text-primary transition-colors"
        >
          Singles in deiner Stadt
        </h2>
      </div>

      {/* Categories Section */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Finde dein perfektes Dating-Portal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <Card key={category.title} className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">{category.title}</h3>
              <p className="text-gray-600 mb-4">{category.description}</p>
              <Button variant="link" className="text-primary p-0">
                Mehr erfahren →
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Warum Du uns vertrauen kannst</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10+</div>
              <p>Jahre Erfahrung im Online-Dating</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2000+</div>
              <p>Getestete Apps und Webseiten</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <p>Objektive Bewertungen</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Unser Experten-Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member) => (
            <Card key={member.name} className="p-6">
              <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
              <p className="text-primary font-medium mb-3">{member.role}</p>
              <p className="text-gray-600">{member.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* City Cards Section */}
      {data?.cities && (
        <section id="city-cards" className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Singles in deiner Stadt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.cities.map((city: any) => (
              <Link to={`/singles/${city.slug}`} key={city.id}>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold mb-3">{city.name}</h3>
                  <p className="text-gray-600 mb-2">Singles in {city.name} kennenlernen</p>
                  <p className="text-sm text-gray-500">{city.bundesland}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

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
  );
};

export default Index;