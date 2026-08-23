import { getTranslations } from "next-intl/server";
import { Github } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { localeNames, locales, normalizeLocale } from "@/i18n/locale";
import { SiteConfig } from "@/config/site";

export async function SiteHeader({ locale }: { locale?: string }) {
  const t = await getTranslations("nav");
  const lang = normalizeLocale(locale);

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="brand" aria-label={SiteConfig.name}>
          <span className="brand__mark" aria-hidden="true">
            S
          </span>
          <span>{SiteConfig.name}</span>
        </Link>

        <nav className="site-nav" aria-label={t("label")}>
          <Link href="/docs/quick-start">{t("start")}</Link>
          <Link href="/docs">{t("docs")}</Link>
          <Link href="/blogs">{t("blog")}</Link>
          <a
            href={SiteConfig.repositoryUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="site-nav__github"
          >
            <Github size={16} aria-hidden="true" />
            <span>{t("github")}</span>
          </a>
          <details className="locale-menu">
            <summary aria-label={t("language")}>{lang.toUpperCase()}</summary>
            <div className="locale-menu__items">
              {locales.map((available) => (
                <Link
                  key={available}
                  href="/"
                  locale={available}
                  aria-current={available === lang ? "page" : undefined}
                >
                  {localeNames[available]}
                </Link>
              ))}
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
