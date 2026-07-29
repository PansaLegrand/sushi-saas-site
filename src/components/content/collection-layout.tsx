import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { RootProvider } from "fumadocs-ui/provider";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { localeNames, locales, normalizeLocale } from "@/i18n/locale";
import { SiteConfig } from "@/config/site";

export async function CollectionLayout({
  children,
  locale,
  source
}: {
  children: ReactNode;
  locale?: string;
  source: any;
}) {
  const lang = normalizeLocale(locale);
  const t = await getTranslations("nav");

  return (
    <RootProvider
      i18n={{
        locale: lang,
        locales: locales.map((available) => ({
          locale: available,
          name: localeNames[available]
        }))
      }}
    >
      <DocsLayout
        tree={source.pageTree[lang] ?? { name: "", children: [] }}
        nav={{
          title: SiteConfig.name,
          url: "/"
        }}
        links={[
          { text: t("docs"), url: "/docs", active: "nested-url" },
          { text: t("blog"), url: "/blogs", active: "nested-url" },
          {
            text: t("github"),
            url: SiteConfig.repositoryUrl,
            external: true
          }
        ]}
        searchToggle={{ enabled: false }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
