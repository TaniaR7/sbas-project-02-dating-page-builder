import { DatingSiteCard } from "./DatingSiteCard";

interface DatingSite {
  name: string;
  description: string;
  link: string;
  image: string;
}

interface DatingSitesSectionProps {
  cityName: string;
  datingSites: DatingSite[];
}

export const DatingSitesSection = ({ cityName, datingSites }: DatingSitesSectionProps) => {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">Online-Dating in {cityName}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {datingSites?.map((site) => (
          <DatingSiteCard
            key={site.name}
            name={site.name}
            description={site.description}
            link={site.link}
            image={site.image}
          />
        ))}
      </div>
    </section>
  );
};