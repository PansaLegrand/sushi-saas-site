export const locales = ["en", "zh", "es", "fr", "ja"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";
export const localePrefix = "as-needed" as const;

export const localeNames: Record<AppLocale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  fr: "Français",
  ja: "日本語"
};

const aliases: Record<string, AppLocale> = {
  en: "en",
  "en-us": "en",
  zh: "zh",
  "zh-cn": "zh",
  "zh-tw": "zh",
  "zh-hk": "zh",
  es: "es",
  fr: "fr",
  ja: "ja"
};

export function normalizeLocale(value?: string | null): AppLocale {
  return aliases[(value || "").toLowerCase()] || defaultLocale;
}

export function isLocale(value?: string | null): value is AppLocale {
  return typeof value === "string" && locales.includes(value.toLowerCase() as AppLocale);
}

function normalizePath(path = "/"): string {
  if (path === "/") return "";
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
}

export function localePath(locale: string | undefined, path = "/"): string {
  const lang = normalizeLocale(locale);
  const suffix = normalizePath(path);
  const prefix = lang === defaultLocale ? "" : `/${lang}`;
  return `${prefix}${suffix}` || "/";
}

export function absoluteLocaleUrl(
  origin: string,
  locale: string | undefined,
  path = "/"
): string {
  const url = new URL(localePath(locale, path), origin);
  return url.toString().replace(/\/$/, "");
}
