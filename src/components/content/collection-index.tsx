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

function treeOrder(source: any, locale: string): Map<string, number> {
  const urls: string[] = [];

  function visit(node: any): void {
    if (node?.type === "page" && typeof node.url === "string") {
      urls.push(node.url);
      return;
    }

    if (node?.type === "folder") {
      if (node.index) visit(node.index);
      if (Array.isArray(node.children)) node.children.forEach(visit);
    }
  }

  const tree = source.pageTree?.[locale];
  if (Array.isArray(tree?.children)) tree.children.forEach(visit);
  return new Map(urls.map((url, index) => [url, index]));
}

function treeSections(source: any, locale: string, pages: any[]) {
  const pagesByUrl = new Map(pages.map((page: any) => [page.url, page]));
  const included = new Set<string>();
  const tree = source.pageTree?.[locale];
  let children = Array.isArray(tree?.children) ? tree.children : [];

  // A locale-level root can wrap the actual navigation groups.
  if (
    children.length === 1 &&
    children[0]?.type === "folder" &&
    children[0]?.root === true &&
    Array.isArray(children[0]?.children)
  ) {
    children = children[0].children;
  }

  function collect(node: any): any[] {
    if (node?.type === "page" && typeof node.url === "string") {
      const page = pagesByUrl.get(node.url);
      if (page) included.add(node.url);
      return page ? [page] : [];
    }

    if (node?.type !== "folder") return [];
    const nested = node.index ? collect(node.index) : [];
    if (Array.isArray(node.children)) {
      nested.push(...node.children.flatMap(collect));
    }
    return nested;
  }

  const sections = children.flatMap((node: any) => {
    if (node?.type === "page") {
      const sectionPages = collect(node);
      return sectionPages.length > 0 ? [{ title: undefined, pages: sectionPages }] : [];
    }

    if (node?.type !== "folder") return [];
    const sectionPages = collect(node);
    return sectionPages.length > 0
      ? [
          {
            title: typeof node.name === "string" ? node.name : undefined,
            pages: sectionPages
          }
        ]
      : [];
  });

  const ungrouped = pages.filter((page: any) => !included.has(page.url));
  if (ungrouped.length > 0) sections.push({ title: undefined, pages: ungrouped });
  return sections;
}

export function CollectionIndex({
  source,
  locale,
  title,
  description,
  emptyLabel,
  topicsLabel,
  order = "date",
  grouped = false
}: {
  source: any;
  locale?: string;
  title: string;
  description: string;
  emptyLabel: string;
  topicsLabel: string;
  order?: "date" | "tree";
  grouped?: boolean;
}) {
  const lang = normalizeLocale(locale);
  const pages = source.getPages(lang).filter((page: any) => page.data?.noindex !== true);

  if (order === "tree") {
    const positions = treeOrder(source, lang);
    pages.sort(
      (left: any, right: any) =>
        (positions.get(left.url) ?? Number.MAX_SAFE_INTEGER) -
        (positions.get(right.url) ?? Number.MAX_SAFE_INTEGER)
    );
  } else {
    pages.sort(
      (left: any, right: any) =>
        timestamp(right.data.updatedAt ?? right.data.publishedAt) -
        timestamp(left.data.updatedAt ?? left.data.publishedAt)
    );
  }

  function card(page: any, documentation: boolean) {
    const tags = Array.isArray(page.data.tags)
      ? page.data.tags
      : typeof page.data.tags === "string"
      ? page.data.tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : [];
    const date = page.data.updatedAt ?? page.data.publishedAt;
    const CardTitle = documentation ? "h3" : "h2";

    return (
      <article
        className={`content-card${documentation ? " content-card--documentation" : ""}`}
        key={page.url}
      >
        {!documentation && date ? (
          <div className="content-card__meta">
            <time dateTime={date}>
              {new Intl.DateTimeFormat(lang, {
                year: "numeric",
                month: "short",
                day: "numeric"
              }).format(new Date(date))}
            </time>
          </div>
        ) : null}
        <CardTitle>{page.data.title}</CardTitle>
        {page.data.description ? <p>{page.data.description}</p> : null}
        {!documentation && tags.length > 0 ? (
          <ul className="tag-list" aria-label={topicsLabel}>
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
  }

  const sections = grouped ? treeSections(source, lang, pages) : [];

  return (
    <DocsPage full>
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>
        {pages.length === 0 ? (
          <p className="content-empty">{emptyLabel}</p>
        ) : (
          grouped ? (
            <div className="content-sections">
              {sections.map((section: any, index: number) => (
                <section className="content-section" key={`${section.title ?? "pages"}-${index}`}>
                  {section.title ? <h2>{section.title}</h2> : null}
                  <div className="content-grid content-grid--documentation">
                    {section.pages.map((page: any) => card(page, true))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="content-grid">{pages.map((page: any) => card(page, false))}</div>
          )
        )}
      </DocsBody>
    </DocsPage>
  );
}
