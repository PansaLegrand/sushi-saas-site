type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export function LegalPage({
  title,
  updated,
  notice,
  sections
}: {
  title: string;
  updated: string;
  notice: string;
  sections: LegalSection[];
}) {
  return (
    <main className="shell legal-page">
      <header className="legal-page__header">
        <p className="eyebrow">{updated}</p>
        <h1>{title}</h1>
        <p className="legal-page__notice">{notice}</p>
      </header>
      <div className="legal-page__body">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
