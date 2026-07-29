import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("terms");
  return buildMetadata({
    locale,
    path: "/terms",
    title: t("title"),
    description: t("description")
  });
}

export default async function TermsPage() {
  const t = await getTranslations("terms");
  return (
    <LegalPage
      title={t("title")}
      updated={t("updated")}
      notice={t("notice")}
      sections={t.raw("sections") as Array<{ heading: string; paragraphs: string[] }>}
    />
  );
}
