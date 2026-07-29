import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("privacy");
  return buildMetadata({
    locale,
    path: "/privacy",
    title: t("title"),
    description: t("description")
  });
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  return (
    <LegalPage
      title={t("title")}
      updated={t("updated")}
      notice={t("notice")}
      sections={t.raw("sections") as Array<{ heading: string; paragraphs: string[] }>}
    />
  );
}
