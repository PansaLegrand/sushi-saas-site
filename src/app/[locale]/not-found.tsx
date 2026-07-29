import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="shell legal-page">
      <p className="eyebrow">404</p>
      <h1>{t("title")}</h1>
      <p className="legal-page__notice">{t("body")}</p>
      <p>
        <Link href="/" className="button">
          {t("action")}
        </Link>
      </p>
    </main>
  );
}
