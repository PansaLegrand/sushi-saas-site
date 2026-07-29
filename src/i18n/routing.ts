import { defineRouting } from "next-intl/routing";
import { defaultLocale, localePrefix, locales } from "./locale";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix,
  localeDetection: true
});
