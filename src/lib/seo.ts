import type { Metadata } from "next";
import { absoluteLocaleUrl, locales, normalizeLocale } from "@/i18n/locale";
import { SiteConfig } from "@/config/site";

type MetadataInput = {
  locale?: string;
  path?: string;
  title: string;
  description?: string;
  keywords?: string | string[];
  image?: string;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

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
  image,
  noindex,
  type = "website",
  publishedTime,
  modifiedTime,
  authors
}: MetadataInput): Metadata {
  const lang = normalizeLocale(locale);
  const canonical = absoluteLocaleUrl(SiteConfig.origin, lang, path);
  const languages = Object.fromEntries(
    locales.map((available) => [
      available,
      absoluteLocaleUrl(SiteConfig.origin, available, path)
    ])
  );

  return {
    metadataBase: new URL(SiteConfig.origin),
    title,
    description,
    keywords: keywords(rawKeywords),
    alternates: { canonical, languages },
    openGraph: {
      type,
      url: canonical,
      title,
      description,
      siteName: SiteConfig.name,
      locale: lang,
      images: image ? [{ url: image }] : undefined,
      publishedTime: type === "article" ? publishedTime : undefined,
      modifiedTime: type === "article" ? modifiedTime : undefined,
      authors: type === "article" ? authors : undefined
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined
    },
    robots: noindex ? { index: false, follow: true } : undefined
  };
}
