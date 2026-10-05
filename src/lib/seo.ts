import type { Metadata } from "next";
import { absoluteLocaleUrl, locales, normalizeLocale, type AppLocale } from "@/i18n/locale";
import { SiteConfig } from "@/config/site";

type MetadataInput = {
  locale?: string;
  path?: string;
  title: string;
  description?: string;
  keywords?: string | string[];
  image?: string;
  imageAlt?: string;
  availableLocales?: readonly AppLocale[];
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

const openGraphLocales: Record<AppLocale, string> = {
  en: "en_US",
  zh: "zh_CN",
  es: "es_ES",
  fr: "fr_FR",
  ja: "ja_JP"
};

export function languageAlternates(
  path: string,
  availableLocales: readonly AppLocale[] = locales
): Record<string, string> {
  const languages: Record<string, string> = Object.fromEntries(
    availableLocales.map((locale) => [
      locale,
      absoluteLocaleUrl(SiteConfig.origin, locale, path)
    ])
  );
  const fallback = availableLocales.includes("en") ? "en" : availableLocales[0];
  if (fallback) {
    languages["x-default"] = absoluteLocaleUrl(SiteConfig.origin, fallback, path);
  }
  return languages;
}

function keywords(value?: string | string[]): string[] | undefined {
  if (!value) return undefined;
  return Array.isArray(value)
    ? value
    : value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function buildMetadata({
  locale,
  path = "/",
  title,
  description,
  keywords: rawKeywords,
  image = "/og.png",
  imageAlt,
  availableLocales = locales,
  noindex,
  type = "website",
  publishedTime,
  modifiedTime,
  authors
}: MetadataInput): Metadata {
  const lang = normalizeLocale(locale);
  const canonical = absoluteLocaleUrl(SiteConfig.origin, lang, path);
  const defaultImage = new URL(image, SiteConfig.origin).toString() ===
    new URL("/og.png", SiteConfig.origin).toString();
  // Open Graph's article:author identifies a profile URL, not a display name.
  // The shared organization byline has a verified URL; personal bylines must
  // supply an actual profile before we can identify them in this field.
  const authorUrls = authors?.includes(SiteConfig.name) ? [SiteConfig.origin] : undefined;

  return {
    metadataBase: new URL(SiteConfig.origin),
    title,
    description,
    authors: authors?.map((name) => ({
      name,
      url: name === SiteConfig.name ? SiteConfig.origin : undefined
    })),
    keywords: keywords(rawKeywords),
    alternates: {
      canonical,
      languages: noindex ? undefined : languageAlternates(path, availableLocales)
    },
    openGraph: {
      type,
      url: canonical,
      title,
      description,
      siteName: SiteConfig.name,
      locale: openGraphLocales[lang],
      alternateLocale: availableLocales
        .filter((available) => available !== lang)
        .map((available) => openGraphLocales[available]),
      images: [{
        url: image,
        width: defaultImage ? 1200 : undefined,
        height: defaultImage ? 630 : undefined,
        alt: imageAlt ?? (defaultImage ? "Sushi SaaS — open-source Next.js SaaS starter" : title)
      }],
      publishedTime: type === "article" ? publishedTime : undefined,
      modifiedTime: type === "article" ? modifiedTime : undefined,
      authors: type === "article" ? authorUrls : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    },
    robots: noindex ? { index: false, follow: true } : undefined
  };
}

export function buildArticleStructuredData({
  locale,
  kind,
  slug,
  title,
  description,
  image,
  publishedTime,
  modifiedTime,
  authors
}: Pick<MetadataInput,
  "locale" | "title" | "description" | "image" | "publishedTime" | "modifiedTime" | "authors"
> & {
  kind: "docs" | "blogs";
  slug: string;
}) {
  const lang = normalizeLocale(locale);
  const url = absoluteLocaleUrl(SiteConfig.origin, lang, `/${kind}/${slug}`);
  const isAboutPage = kind === "blogs" && slug === "about";
  const collectionNames = {
    en: { docs: "Documentation", blogs: "Guides" },
    zh: { docs: "文档", blogs: "指南" },
    es: { docs: "Documentación", blogs: "Guías" },
    fr: { docs: "Documentation", blogs: "Guides" },
    ja: { docs: "ドキュメント", blogs: "ガイド" }
  };
  // A share card is useful for Open Graph but is not a representative article
  // image. Only authored content images belong in Article structured data.
  const articleImage = image ? new URL(image, SiteConfig.origin).toString() : undefined;
  const representativeImage = articleImage === new URL("/og.png", SiteConfig.origin).toString()
    ? undefined
    : articleImage;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": isAboutPage ? "AboutPage" : kind === "docs" ? "TechArticle" : "BlogPosting",
        "@id": `${url}#article`,
        url,
        headline: title,
        description,
        image: isAboutPage || !representativeImage ? undefined : [representativeImage],
        datePublished: isAboutPage ? undefined : publishedTime,
        dateModified: isAboutPage ? undefined : modifiedTime ?? publishedTime,
        inLanguage: lang,
        author: isAboutPage ? undefined : authors?.map((name) => ({
          "@type": name === SiteConfig.name ? "Organization" : "Person",
          name,
          url: name === SiteConfig.name ? SiteConfig.origin : undefined
        })),
        publisher: {
          "@type": "Organization",
          name: SiteConfig.name,
          url: SiteConfig.origin
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SiteConfig.name,
            item: absoluteLocaleUrl(SiteConfig.origin, lang)
          },
          {
            "@type": "ListItem",
            position: 2,
            name: collectionNames[lang][kind],
            item: absoluteLocaleUrl(SiteConfig.origin, lang, `/${kind}`)
          },
          { "@type": "ListItem", position: 3, name: title, item: url }
        ]
      }
    ]
  };
}
