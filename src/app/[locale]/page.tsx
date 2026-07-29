import { ArrowRight, Github } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { SiteConfig } from "@/config/site";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("metadata");

  return buildMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    keywords: t.raw("keywords") as string[]
  });
}

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const signals = t.raw("signals") as Array<{ title: string; body: string }>;
  const systems = t.raw("systems.items") as Array<{ title: string; body: string }>;
  const flow = t.raw("architecture.steps") as Array<{ title: string; body: string }>;

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <section className="hero">
          <div className="shell hero__copy">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1>
              {t("heroLineOne")} <span>{t("heroLineTwo")}</span>
            </h1>
            <p className="hero__lede">{t("subtitle")}</p>
            <div className="hero__actions">
              <Link href="/docs" className="button">
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
