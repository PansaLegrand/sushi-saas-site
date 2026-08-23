import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteConfig } from "@/config/site";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div>
          <p className="site-footer__name">{SiteConfig.name}</p>
          <p>{t("description")}</p>
        </div>
        <nav aria-label={t("label")}>
          <Link href="/docs/quick-start">{t("start")}</Link>
          <Link href="/docs">{t("docs")}</Link>
          <Link href="/blogs">{t("blog")}</Link>
          <Link href="/privacy">{t("privacy")}</Link>
          <Link href="/terms">{t("terms")}</Link>
        </nav>
      </div>
    </footer>
  );
}
