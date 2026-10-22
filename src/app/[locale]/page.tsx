import { ArrowRight, ArrowUpRight, Check, CircleDollarSign, Github, Layers3, ShieldCheck, Workflow } from "lucide-react";
import Image from "next/image";
import { ProductTour } from "@/components/product-tour";
import { StarterProfiles } from "@/components/starter-profiles";
import sourceReview from "../../../docs/starter-source.json";
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


export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = normalizeLocale(locale);
  const t = await getTranslations("marketing");
  const homeUrl = absoluteLocaleUrl(SiteConfig.origin, lang);
  const proof = t.raw("proof.items") as { title: string; body: string }[];
  const steps = t.raw("workflow.steps") as { title: string; body: string }[];
  const questions = t.raw("faq.items") as { question: string; answer: string }[];
  const proofSources = ["tests/db/credits.ledger.test.ts", "tests/db/job-domain-fencing.test.ts", "tests/db/org-isolation.test.ts"];
  const proofIcons = [CircleDollarSign, Workflow, ShieldCheck];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": SiteConfig.origin + "/#website", name: SiteConfig.name, url: homeUrl, inLanguage: lang },
      { "@type": "SoftwareSourceCode", "@id": SiteConfig.origin + "/#software", name: SiteConfig.name, description: SiteConfig.description, codeRepository: SiteConfig.repositoryUrl, license: SiteConfig.repositoryUrl + "/blob/main/LICENSE", programmingLanguage: ["TypeScript", "JavaScript"], runtimePlatform: "Node.js", url: homeUrl },
      { "@type": "Organization", "@id": SiteConfig.origin + "/#organization", name: SiteConfig.name, url: SiteConfig.origin, sameAs: [SiteConfig.repositoryUrl] }
    ]
  };

  return <>
    <link rel="canonical" href={homeUrl} />
    <meta property="og:url" content={homeUrl} />
    {locales.map(available => <link key={available} rel="alternate" hrefLang={available} href={absoluteLocaleUrl(SiteConfig.origin, available)} />)}
    <link rel="alternate" hrefLang="x-default" href={SiteConfig.origin + "/"} />
    <SiteHeader locale={locale} />
    <main className="marketing-page" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="hero">
        <div className="shell hero__grid">
          <div className="hero__copy">
            <p className="eyebrow"><span className="status-dot" />{t("hero.eyebrow")}</p>
            <h1>{t("hero.title")} <span>{t("hero.accent")}</span></h1>
            <p className="hero__lede">{t("hero.description")}</p>
            <div className="hero__actions">
              <Link href="/docs/quick-start" className="button" data-analytics-event="quickstart_opened" data-analytics-source="hero">{t("hero.primary")}<ArrowRight size={17} aria-hidden="true" /></Link>
              <a href="#product-tour" className="button button--ghost">{t("hero.secondary")}<ArrowUpRight size={17} aria-hidden="true" /></a>
            </div>
            <ul className="hero__badges">{(t.raw("hero.badges") as string[]).map(badge => <li key={badge}><Check size={13} aria-hidden="true" />{badge}</li>)}</ul>
          </div>
          <div className="hero-preview">
            <div className="hero-preview__heading"><span>{t("hero.previewLabel")}</span><span className="preview-live"><i />Sushi SaaS</span></div>
            <div className="hero-preview__screen">
              <Image src="/product/credits.jpg" alt={t("tour.items.0.alt")} width={1707} height={960} priority sizes="(max-width: 900px) 100vw, 700px" />
            </div>
            <div className="hero-preview__caption"><CoinsMark /><div><strong>{t("hero.previewTitle")}</strong><span>{t("hero.previewNote")}</span></div><span className="hero-preview__arrow" aria-hidden="true">↗</span></div>
          </div>
        </div>
      </section>

      <div className="shell stack-strip">
        <p>{t("stackLabel")}</p>
        <ul aria-label={t("stackLabel")}>{["Next.js", "TypeScript", "Better Auth", "Stripe", "PostgreSQL", "Drizzle"].map(name => <li key={name}>{name}</li>)}</ul>
      </div>

      <ProductTour />

      <section className="section proof-section">
        <div className="shell">
          <div className="section-heading"><div><p className="eyebrow">{t("proof.eyebrow")}</p><h2>{t("proof.title")}</h2></div><p>{t("proof.description")}</p></div>
          <div className="proof-grid">{proof.map((item, index) => {
            const Icon = proofIcons[index];
            return <article className="proof-card" key={item.title}><span className="proof-icon"><Icon size={23} aria-hidden="true" /></span><h3>{item.title}</h3><p>{item.body}</p><a href={sourceReview.repository + "/blob/" + sourceReview.commit + "/" + proofSources[index]} target="_blank" rel="noopener noreferrer" className="text-link" data-analytics-event="github_opened" data-analytics-source="article">{t("proof.action")}<ArrowUpRight size={15} aria-hidden="true" /></a></article>;
          })}</div>
        </div>
      </section>

      <StarterProfiles />

      <section className="section workflow-section">
        <div className="shell">
          <div className="section-heading"><div><p className="eyebrow">{t("workflow.eyebrow")}</p><h2>{t("workflow.title")}</h2></div><div><p>{t("workflow.description")}</p><Link href="/docs/image-generation-workflow" className="text-link">{t("workflow.action")}<ArrowRight size={16} aria-hidden="true" /></Link></div></div>
          <ol className="workflow-steps">{steps.map((step, index) => <li key={step.title}><span className="workflow-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol>
        </div>
      </section>

      <section className="case-section shell">
        <div className="case-copy"><p className="eyebrow">{t("caseStudy.eyebrow")}</p><h2>{t("caseStudy.title")}</h2><p>{t("caseStudy.description")}</p><Link href="/blogs/dojoclip-ai-saas-use-case" className="button button--light">{t("caseStudy.action")}<ArrowRight size={17} aria-hidden="true" /></Link></div>
        <div className="case-aside"><div className="case-wordmark"><span aria-hidden="true">D.</span><strong>DojoClip</strong><a href="https://dojoclip.com/" aria-label={t("caseStudy.visit")} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={23} aria-hidden="true" /></a></div><h3>{t("caseStudy.asideTitle")}</h3><ul>{(t.raw("caseStudy.items") as string[]).map(item => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}</ul><p>{t("caseStudy.note")}</p></div>
      </section>

      <section className="section faq-section"><div className="shell faq-grid"><div><p className="eyebrow">{t("faq.eyebrow")}</p><h2>{t("faq.title")}</h2><Link href="/docs/deployment-and-security" className="text-link">{t("faq.guide")}<ArrowRight size={16} aria-hidden="true" /></Link></div><div className="faq-list">{questions.map(question => <details key={question.question}><summary>{question.question}<span aria-hidden="true">+</span></summary><p>{question.answer}</p></details>)}</div></div></section>

      <section className="closing shell"><p className="eyebrow">{t("closing.eyebrow")}</p><h2>{t("closing.title")}</h2><p>{t("closing.description")}</p><div className="hero__actions"><Link href="/docs/quick-start" className="button" data-analytics-event="quickstart_opened" data-analytics-source="closing">{t("closing.primary")}<ArrowRight size={17} aria-hidden="true" /></Link><a href={SiteConfig.repositoryUrl} target="_blank" rel="noopener noreferrer" className="button button--ghost" data-analytics-event="github_opened" data-analytics-source="closing"><Github size={17} aria-hidden="true" />{t("closing.secondary")}</a></div><small>{t("closing.license")}</small></section>
    </main>
    <SiteFooter />
  </>;
}

function CoinsMark() {
  return <span className="preview-symbol" aria-hidden="true"><Layers3 size={21} /></span>;
}
