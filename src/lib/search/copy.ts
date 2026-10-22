import type { AppLocale } from "@/i18n/locale";

export const searchCopy: Record<AppLocale, {
  docs: string;
  guides: string;
  hint: string;
  loading: string;
  unavailable: string;
  retry: string;
  close: string;
}> = {
  en: {
    docs: "Documentation", guides: "Guides", hint: "Search documentation and guides in English.",
    loading: "Searching…", unavailable: "Search is unavailable. Try again or browse the documentation.",
    retry: "Try again", close: "Close search"
  },
  zh: {
    docs: "文档", guides: "指南", hint: "搜索中文文档和指南。",
    loading: "正在搜索…", unavailable: "搜索暂不可用。请重试，或直接浏览文档。",
    retry: "重试", close: "关闭搜索"
  },
  es: {
    docs: "Documentación", guides: "Guías", hint: "Busca documentación y guías en español.",
    loading: "Buscando…", unavailable: "La búsqueda no está disponible. Reintenta o explora la documentación.",
    retry: "Reintentar", close: "Cerrar búsqueda"
  },
  fr: {
    docs: "Documentation", guides: "Guides", hint: "Recherchez dans la documentation et les guides en français.",
    loading: "Recherche…", unavailable: "La recherche est indisponible. Réessayez ou parcourez la documentation.",
    retry: "Réessayer", close: "Fermer la recherche"
  },
  ja: {
    docs: "ドキュメント", guides: "ガイド", hint: "日本語のドキュメントとガイドを検索します。",
    loading: "検索中…", unavailable: "検索を利用できません。再試行するか、ドキュメントをご覧ください。",
    retry: "再試行", close: "検索を閉じる"
  }
};
