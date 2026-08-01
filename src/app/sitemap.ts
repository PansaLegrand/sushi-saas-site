import type { MetadataRoute } from "next";
import { SiteConfig } from "@/config/site";
import { absoluteLocaleUrl, locales } from "@/i18n/locale";
import { blogSource, docsSource } from "@/lib/source";

function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((locale) => [
      locale,
      absoluteLocaleUrl(SiteConfig.origin, locale, path)
    ])
  );
  languages["x-default"] = absoluteLocaleUrl(SiteConfig.origin, "en", path);
  return languages;
}

function validDate(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
}

function normalizedPath(url: string, locale: string): string {
  const prefix = `/${locale}`;
  const path = url.startsWith(prefix) ? url.slice(prefix.length) : url;
  return path || "/";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of ["/", "/docs", "/blogs", "/privacy", "/terms"]) {
      entries.push({
        url: absoluteLocaleUrl(SiteConfig.origin, locale, path),
        alternates: { languages: languageAlternates(path) }
      });
    }

    for (const source of [docsSource, blogSource] as const) {
      for (const page of source.getPages(locale)) {
        if ((page.data as any).noindex === true) continue;
        const path = normalizedPath(page.url, locale);
        entries.push({
          url: absoluteLocaleUrl(SiteConfig.origin, locale, path),
          alternates: { languages: languageAlternates(path) },
          lastModified:
            validDate((page.data as any).updatedAt) ??
            validDate((page.data as any).publishedAt)
        });
      }
    }
  }

  return entries;
}
