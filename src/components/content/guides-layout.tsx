import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { RootProvider, TreeContextProvider } from "fumadocs-ui/provider";
import { SiteConfig } from "@/config/site";
import { localeNames, localePath, locales, normalizeLocale } from "@/i18n/locale";
import { blogSource } from "@/lib/source";

/**
 * Editorial guides use a conventional site header instead of the documentation
 * notebook. The tree provider remains available for article breadcrumbs and
 * previous/next links, but it is deliberately not rendered as a sidebar.
 */
export async function GuidesLayout({
  children,
  locale
}: {
  children: ReactNode;
  locale?: string;
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
      search={{ enabled: false }}
    >
      <TreeContextProvider
        tree={blogSource.pageTree[lang] ?? { name: "", children: [] }}
      >
        <HomeLayout
          className="guides-layout"
          i18n
          nav={{
            title: SiteConfig.name,
            url: localePath(lang)
          }}
          links={[
            {
              text: t("docs"),
              url: localePath(lang, "/docs"),
              active: "nested-url"
            },
            {
              text: t("blog"),
              url: localePath(lang, "/blogs"),
              active: "nested-url"
            },
            {
              text: t("github"),
              url: SiteConfig.repositoryUrl,
              external: true
            }
          ]}
          searchToggle={{ enabled: false }}
        >
          {children}
        </HomeLayout>
      </TreeContextProvider>
    </RootProvider>
  );
}
