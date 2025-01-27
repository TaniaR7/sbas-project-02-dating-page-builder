interface CityInfoSectionProps {
  cityName: string;
  content: string;
  image?: string;
}

export const CityInfoSection = ({ cityName, content, image }: CityInfoSectionProps) => {
  return (
    <section className="mb-16">
      <div className="prose max-w-none">
        <h2 className="text-3xl font-bold mb-6">{cityName}: Eine Stadt für Lebensfreude und Begegnungen</h2>
        <div className="relative">
          {image && (
            <div className="float-right ml-8 mb-6 md:w-[40%] w-full">
              <img
                src={image}
                alt={`Leben in ${cityName}`}
                className="w-full h-auto rounded-lg shadow-lg object-cover"
              />
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </section>
  );
};