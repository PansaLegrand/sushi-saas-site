import { createI18nSearchAPI, type AdvancedIndex, type AdvancedOptions } from "fumadocs-core/search/server";
import { defaultLocale, locales } from "@/i18n/locale";

export type ContentSearchIndex = AdvancedIndex & { locale: string };

/** Orama 3 needs an explicit tokenizer for languages without its own stemmer. */
function segmentedTokenizer(locale: "zh" | "ja"): AdvancedOptions["tokenizer"] {
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  return {
    language: locale,
    normalizationCache: new Map<string, string>(),
    tokenize(value: string) {
      return [...new Set(
        [...segmenter.segment(value.normalize("NFKC").toLocaleLowerCase(locale))]
          .filter((part) => part.isWordLike)
          .map((part) => part.segment)
      )];
    }
  };
}

export function createContentSearch(indexes: ContentSearchIndex[] | (() => ContentSearchIndex[])) {
  return createI18nSearchAPI("advanced", {
    i18n: { defaultLanguage: defaultLocale, languages: [...locales] },
    indexes,
    localeMap: {
      en: "english",
      es: "spanish",
      fr: "french",
      zh: { tokenizer: segmentedTokenizer("zh") },
      ja: { tokenizer: segmentedTokenizer("ja") }
    },
    search: {
      limit: 8,
      threshold: 0,
      tolerance: 0,
      groupBy: { properties: ["page_id"], maxResult: 3 }
    }
  });
}
