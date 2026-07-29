import type { MetadataRoute } from "next";
import { SiteConfig } from "@/config/site";
import { absoluteLocaleUrl, locales } from "@/i18n/locale";
import { blogSource, docsSource } from "@/lib/source";

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
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : path === "/docs" ? 0.9 : 0.6
      });
    }

    for (const [source, changeFrequency] of [
      [docsSource, "monthly"],
      [blogSource, "weekly"]
    ] as const) {
      for (const page of source.getPages(locale)) {
        if ((page.data as any).noindex === true) continue;
        entries.push({
          url: absoluteLocaleUrl(
            SiteConfig.origin,
            locale,
            normalizedPath(page.url, locale)
          ),
          lastModified:
            validDate((page.data as any).updatedAt) ??
            validDate((page.data as any).publishedAt),
          changeFrequency,
          priority: source === docsSource ? 0.8 : 0.65
        });
      }
    }
  }

  return entries;
}
