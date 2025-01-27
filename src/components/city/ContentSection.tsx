interface ContentSectionProps {
  title: string;
  content: string;
  className?: string;
}

export const ContentSection = ({ title, content, className = "mb-16" }: ContentSectionProps) => {
  return (
    <section className={className}>
      <h2 className="text-3xl font-bold mb-8">{title}</h2>
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
};