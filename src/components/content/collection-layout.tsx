import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { RootProvider } from "fumadocs-ui/provider";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { localePath, normalizeLocale } from "@/i18n/locale";
import { contentUiI18n } from "@/i18n/content-ui";
import { SiteConfig } from "@/config/site";
import { ContentSearchDialog } from "./search-dialog";

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
      i18n={contentUiI18n(lang)}
      search={{
        SearchDialog: ContentSearchDialog,
        links: [
          [t("start"), localePath(lang, "/docs/quick-start")],
          [t("docs"), localePath(lang, "/docs")],
          [t("blog"), localePath(lang, "/blogs")]
        ]
      }}
    >
      <DocsLayout
        tree={source.pageTree[lang] ?? { name: "", children: [] }}
        i18n
        nav={{
          title: SiteConfig.name,
          url: localePath(lang)
        }}
        links={[
          {
            type: "button",
            text: t("start"),
            url: localePath(lang, "/docs/quick-start")
          },
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
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
