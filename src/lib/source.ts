import { blog, docs } from "@/.source";
import { loader } from "fumadocs-core/source";
import type { I18nConfig } from "fumadocs-core/i18n";
import { icons } from "lucide-react";
import { createElement } from "react";
import { defaultLocale, locales } from "@/i18n/locale";

export const contentI18n: I18nConfig = {
  defaultLanguage: defaultLocale,
  languages: [...locales],
  parser: "dir"
};

function resolveIcon(icon?: string) {
  if (!icon || !(icon in icons)) return undefined;
  return createElement(icons[icon as keyof typeof icons]);
}

export const docsSource = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  i18n: contentI18n,
  icon: resolveIcon
});

export const blogSource = loader({
  baseUrl: "/blogs",
  source: blog.toFumadocsSource(),
  i18n: contentI18n,
  icon: resolveIcon
});
