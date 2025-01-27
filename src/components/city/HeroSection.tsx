import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  cityName: string;
  heroImage?: string;
}

export const HeroSection = ({ cityName, heroImage }: HeroSectionProps) => {
  return (
    <header className="bg-primary py-20 text-white relative overflow-hidden">
      {heroImage && (
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={`Dating in ${cityName}`}
            className="w-full h-full object-cover opacity-20"
          />
        </div>
      )}
      <div className="container mx-auto text-center px-4 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Singles in {cityName} finden
        </h1>
        <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
          Jetzt Dating-Portal finden
        </Button>
      </div>
    </header>
  );
};