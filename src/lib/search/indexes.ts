import { blogSource, docsSource } from "@/lib/source";
import { searchCopy } from "./copy";
import { createContentSearch } from "./server";
import { normalizeLocale } from "@/i18n/locale";

/** MDX bodies stay on the server; the route exports search results only. */
export const contentSearch = createContentSearch(() => [
  ...docsSource.getLanguages().flatMap(({ language, pages }) => pages
    .filter((page) => !page.data.noindex)
    .map((page) => ({
      id: page.url,
      url: page.url,
      locale: language,
      title: page.data.title,
      description: page.data.description,
      structuredData: page.data.structuredData,
      breadcrumbs: [searchCopy[normalizeLocale(language)].docs]
    }))),
  ...blogSource.getLanguages().flatMap(({ language, pages }) => pages
    .filter((page) => !page.data.noindex)
    .map((page) => ({
      id: page.url,
      url: page.url,
      locale: language,
      title: page.data.title,
      description: page.data.description,
      structuredData: page.data.structuredData,
      breadcrumbs: [searchCopy[normalizeLocale(language)].guides]
    })))
]);
