import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HeroSection } from "@/components/city/HeroSection";
import { ContentSection } from "@/components/city/ContentSection";
import { CityInfoSection } from "@/components/city/CityInfoSection";
import { DatingSitesSection } from "@/components/city/DatingSitesSection";
import { Footer } from "@/components/city/Footer";

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
        const { data: functionData, error: functionError } = await supabase.functions.invoke(`get-city-data?citySlug=${citySlug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (functionError) {
          console.error('Function error:', functionError);
          throw functionError;
        }

        if (!functionData && !functionData?.fallbackContent) {
          throw new Error('Keine Daten erhalten');
        }

        if (functionData.error && functionData.fallbackContent) {
          console.log('Using fallback content due to error:', functionData.error);
          toast({
            title: "Hinweis",
            description: functionData.message || "Einige Inhalte konnten nicht geladen werden.",
            variant: "default",
          });
          return functionData.fallbackContent;
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
        <title>{data?.title || `Singles in ${citySlug} - Die besten Dating-Portale ${new Date().getFullYear()}`}</title>
        <meta name="description" content={data?.description} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <HeroSection cityName={data.cityName} heroImage={data.images?.[0]} />

        <div className="container mx-auto px-4 py-16">
          <ContentSection 
            title={`${data.cityName} – Die Stadt der Singles`}
            content={data.introduction}
          />

          <CityInfoSection 
            cityName={data.cityName}
            content={data.sections[0]?.content}
            image={data.images?.[1]}
          />

          <ContentSection 
            title={data.sections[1]?.title}
            content={data.sections[1]?.content}
          />

          <ContentSection 
            title={data.sections[2]?.title}
            content={data.sections[2]?.content}
          />

          <ContentSection 
            title={data.sections[3]?.title}
            content={data.sections[3]?.content}
          />

          <DatingSitesSection 
            cityName={data.cityName}
            datingSites={data.datingSites}
          />

          <ContentSection 
            title={data.sections[4]?.title}
            content={data.sections[4]?.content}
          />

          <ContentSection 
            title={data.sections[5]?.title}
            content={data.sections[5]?.content}
          />
        </div>

        <Footer />
      </div>
    </>
  );
};

export default CityTemplate;