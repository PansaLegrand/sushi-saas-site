import type { MetadataRoute } from "next";
import { SiteConfig } from "@/config/site";
import { absoluteLocaleUrl, locales } from "@/i18n/locale";
import { blogSource, docsSource } from "@/lib/source";
import { languageAlternates } from "@/lib/seo";

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
          alternates: {
            languages: languageAlternates(path, locales.filter((available) => {
              const variant = source.getPage(page.slugs, available);
              return variant && (variant.data as any).noindex !== true;
            }))
          },
          lastModified:
            validDate((page.data as any).updatedAt) ??
            validDate((page.data as any).publishedAt)
        });
      }
    }
  }

  return entries;
}
