import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { Link } from "@/i18n/navigation";
import { normalizeLocale } from "@/i18n/locale";

function publicHref(url: string, locale: string): string {
  const localePrefix = `/${locale}`;
  const raw = url.startsWith(localePrefix)
    ? url.slice(localePrefix.length) || "/"
    : url;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function timestamp(value: unknown): number {
  if (typeof value !== "string") return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function CollectionIndex({
  source,
  locale,
  title,
  description,
  emptyLabel
}: {
  source: any;
  locale?: string;
  title: string;
  description: string;
  emptyLabel: string;
}) {
  const lang = normalizeLocale(locale);
  const pages = source
    .getPages(lang)
    .filter((page: any) => page.data?.noindex !== true)
    .sort(
      (left: any, right: any) =>
        timestamp(right.data.updatedAt ?? right.data.publishedAt) -
        timestamp(left.data.updatedAt ?? left.data.publishedAt)
    );

  return (
    <DocsPage full>
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>
        {pages.length === 0 ? (
          <p className="content-empty">{emptyLabel}</p>
        ) : (
          <div className="content-grid">
            {pages.map((page: any) => {
              const tags = Array.isArray(page.data.tags)
                ? page.data.tags
                : typeof page.data.tags === "string"
                ? page.data.tags
                    .split(",")
                    .map((tag: string) => tag.trim())
                    .filter(Boolean)
                : [];
              const date = page.data.updatedAt ?? page.data.publishedAt;

              return (
                <article className="content-card" key={page.url}>
                  <div className="content-card__meta">
                    {date ? (
                      <time dateTime={date}>
                        {new Intl.DateTimeFormat(lang, {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        }).format(new Date(date))}
                      </time>
                    ) : (
                      <span>Guide</span>
                    )}
                  </div>
                  <h2>{page.data.title}</h2>
                  {page.data.description ? <p>{page.data.description}</p> : null}
                  {tags.length > 0 ? (
                    <ul className="tag-list" aria-label="Topics">
                      {tags.slice(0, 3).map((tag: string) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                  <Link
                    href={publicHref(page.url, lang)}
                    className="content-card__link"
                    aria-label={page.data.title}
                  />
                </article>
              );
            })}
          </div>
        )}
      </DocsBody>
    </DocsPage>
  );
}
