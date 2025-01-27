import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DatingSiteProps {
  name: string;
  description: string;
  link: string;
  image: string;
}

export const DatingSiteCard = ({ name, description, link, image }: DatingSiteProps) => {
  const sentences = description
    .split('. ')
    .filter(Boolean)
    .slice(0, 3)
    .map(sentence => sentence.trim() + (sentence.endsWith('.') ? '' : '.'));

  return (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `linear-gradient(rgba(209, 0, 20, 0.7), rgba(209, 0, 20, 0.7)), url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          WebkitBackgroundSize: 'cover',
          MozBackgroundSize: 'cover',
          OBackgroundSize: 'cover'
        }}
      />
      <div className="relative p-6 text-white" style={{ minHeight: '300px' }}>
        <h3 className="text-2xl font-semibold mb-4">{name}</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-200 mb-6">
          {sentences.map((bullet, index) => (
            <li key={index} className="line-clamp-2">{bullet}</li>
          ))}
        </ul>
        <div className="absolute bottom-6 left-6 right-6">
          <Button 
            asChild 
            variant="secondary" 
            className="w-full bg-white hover:bg-primary hover:text-white text-primary font-semibold transition-colors duration-300"
          >
            <a href={link} target="_blank" rel="noopener noreferrer">
              Kostenlos testen
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
};