import { getTranslations } from "next-intl/server";
import { CollectionIndex } from "@/components/content/collection-index";
import { docsSource } from "@/lib/source";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("docs");
  return buildMetadata({
    locale,
    path: "/docs",
    title: t("title"),
    description: t("intro")
  });
}

export default async function DocsIndex({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("docs");
  return (
    <CollectionIndex
      source={docsSource}
      locale={locale}
      title={t("title")}
      description={t("intro")}
      emptyLabel={t("empty")}
    />
  );
}
