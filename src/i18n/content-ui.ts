import type { Translations } from "fumadocs-ui/i18n";
import {
  localeNames,
  locales,
  normalizeLocale,
  type AppLocale
} from "@/i18n/locale";

const translations: Record<AppLocale, Translations> = {
  en: {
    search: "Search",
    searchNoResult: "No results found",
    toc: "On this page",
    tocNoHeadings: "No headings",
    lastUpdate: "Last updated on",
    chooseLanguage: "Choose a language",
    nextPage: "Next page",
    previousPage: "Previous page",
    chooseTheme: "Choose a theme",
    editOnGithub: "Edit on GitHub"
  },
  zh: {
    search: "搜索",
    searchNoResult: "未找到结果",
    toc: "本页内容",
    tocNoHeadings: "没有标题",
    lastUpdate: "最后更新于",
    chooseLanguage: "选择语言",
    nextPage: "下一页",
    previousPage: "上一页",
    chooseTheme: "选择主题",
    editOnGithub: "在 GitHub 上编辑"
  },
  es: {
    search: "Buscar",
    searchNoResult: "No se encontraron resultados",
    toc: "En esta página",
    tocNoHeadings: "No hay encabezados",
    lastUpdate: "Última actualización",
    chooseLanguage: "Elegir idioma",
    nextPage: "Página siguiente",
    previousPage: "Página anterior",
    chooseTheme: "Elegir tema",
    editOnGithub: "Editar en GitHub"
  },
  fr: {
    search: "Rechercher",
    searchNoResult: "Aucun résultat",
    toc: "Sur cette page",
    tocNoHeadings: "Aucun titre",
    lastUpdate: "Dernière mise à jour le",
    chooseLanguage: "Choisir la langue",
    nextPage: "Page suivante",
    previousPage: "Page précédente",
    chooseTheme: "Choisir le thème",
    editOnGithub: "Modifier sur GitHub"
  },
  ja: {
    search: "検索",
    searchNoResult: "結果が見つかりません",
    toc: "このページの内容",
    tocNoHeadings: "見出しはありません",
    lastUpdate: "最終更新日",
    chooseLanguage: "言語を選択",
    nextPage: "次のページ",
    previousPage: "前のページ",
    chooseTheme: "テーマを選択",
    editOnGithub: "GitHub で編集"
  }
};

export function contentUiI18n(locale?: string) {
  const lang = normalizeLocale(locale);

  return {
    locale: lang,
    translations: translations[lang],
    locales: locales.map((available) => ({
      locale: available,
      name: localeNames[available]
    }))
  };
}
