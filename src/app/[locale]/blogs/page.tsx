import { getTranslations } from "next-intl/server";
import { CollectionIndex } from "@/components/content/collection-index";
import { blogSource } from "@/lib/source";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("blogs");
  return buildMetadata({
    locale,
    path: "/blogs",
    title: t("title"),
    description: t("intro")
  });
}

export default async function BlogIndex({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("blogs");
  return (
    <CollectionIndex
      source={blogSource}
      locale={locale}
      title={t("title")}
      description={t("intro")}
      emptyLabel={t("empty")}
    />
  );
}
