import { ArrowRight, Github } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { SiteConfig } from "@/config/site";
import { absoluteLocaleUrl, locales, normalizeLocale } from "@/i18n/locale";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("metadata");

  const metadata = buildMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    keywords: t.raw("keywords") as string[]
  });

  // Next.js normalizes an origin-only metadata URL by removing its root slash.
  // The homepage emits its canonical and hreflang links directly below so they
  // exactly match the public `/` URL.
  return {
    ...metadata,
    alternates: undefined,
    openGraph: metadata.openGraph
      ? { ...metadata.openGraph, url: undefined }
      : undefined
  };
}

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = normalizeLocale(locale);
  const t = await getTranslations("landing");
  const signals = t.raw("signals") as Array<{ title: string; body: string }>;
  const journeys = t.raw("journeys.items") as Array<{
    title: string;
    body: string;
    action: string;
  }>;
  const systems = t.raw("systems.items") as Array<{ title: string; body: string }>;
  const referenceFlow = t.raw("referenceFlow.steps") as Array<{
    title: string;
    body: string;
  }>;
  const flow = t.raw("architecture.steps") as Array<{ title: string; body: string }>;
  const journeyPaths = [
    "/docs/quick-start",
    "/docs/image-generation-workflow",
    "/docs/containers-and-launch-readiness"
  ] as const;
  const homeUrl = absoluteLocaleUrl(SiteConfig.origin, lang);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SiteConfig.origin}/#website`,
        name: SiteConfig.name,
        url: homeUrl,
        inLanguage: lang
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": `${SiteConfig.origin}/#software`,
        name: SiteConfig.name,
        description: SiteConfig.description,
        codeRepository: SiteConfig.repositoryUrl,
        license: `${SiteConfig.repositoryUrl}/blob/main/LICENSE`,
        programmingLanguage: ["TypeScript", "JavaScript"],
        runtimePlatform: "Node.js",
        url: homeUrl
      },
      {
        "@type": "Organization",
        "@id": `${SiteConfig.origin}/#organization`,
        name: SiteConfig.name,
        url: SiteConfig.origin,
        sameAs: [SiteConfig.repositoryUrl]
      }
    ]
  };

  return (
    <>
      <link rel="canonical" href={homeUrl} />
      <meta property="og:url" content={homeUrl} />
      {locales.map((available) => (
        <link
          key={available}
          rel="alternate"
          hrefLang={available}
          href={absoluteLocaleUrl(SiteConfig.origin, available)}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SiteConfig.origin}/`} />
      <SiteHeader locale={locale} />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
          }}
        />
        <section className="hero">
          <div className="shell hero__copy">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1>
              {t("heroLineOne")} <span>{t("heroLineTwo")}</span>
            </h1>
            <p className="hero__lede">{t("subtitle")}</p>
            <div className="hero__actions">
              <Link href="/docs/quick-start" className="button">
                {t("primaryAction")}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a
                href={SiteConfig.repositoryUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="button button--ghost"
              >
                <Github size={17} aria-hidden="true" />
                {t("secondaryAction")}
              </a>
            </div>
            <p className="hero__fit">
              {t("fitPrompt")} {" "}
              <Link href="/blogs/why-use-a-saas-template">{t("fitAction")}</Link>
            </p>
          </div>
        </section>

        <div className="shell signal-row" aria-label={t("signalsLabel")}>
          {signals.map((signal) => (
            <div className="signal" key={signal.title}>
              <strong>{signal.title}</strong>
              <span>{signal.body}</span>
            </div>
          ))}
        </div>

        <section className="section section--compact">
          <div className="shell">
            <div className="section-heading">
              <h2>{t("journeys.title")}</h2>
              <p>{t("journeys.intro")}</p>
            </div>
            <div className="journey-grid">
              {journeys.map((journey, index) => (
                <article className="journey-card" key={journey.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{journey.title}</h3>
                  <p>{journey.body}</p>
                  <Link href={journeyPaths[index] ?? "/docs"}>
                    {journey.action}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <div className="section-heading">
              <h2>{t("systems.title")}</h2>
              <p>{t("systems.intro")}</p>
            </div>
            <div className="system-grid">
              {systems.map((system, index) => (
                <article className="system-card" key={system.title}>
                  <span className="system-card__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{system.title}</h3>
                  <p>{system.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section reference-section">
          <div className="shell">
            <p className="eyebrow">{t("referenceFlow.eyebrow")}</p>
            <div className="reference-section__heading">
              <h2>{t("referenceFlow.title")}</h2>
              <div>
                <p>{t("referenceFlow.intro")}</p>
                <Link href="/docs/image-generation-workflow" className="text-link">
                  {t("referenceFlow.action")}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="reference-flow">
              {referenceFlow.map((step, index) => (
                <article key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--ink">
          <div className="shell">
            <div className="section-heading">
              <h2>{t("architecture.title")}</h2>
              <p>{t("architecture.intro")}</p>
            </div>
            <div className="flow">
              {flow.map((step) => (
                <article className="flow__step" key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="shell closing">
          <h2>{t("closing.title")}</h2>
          <Link href="/docs/quick-start" className="button">
            {t("closing.action")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
