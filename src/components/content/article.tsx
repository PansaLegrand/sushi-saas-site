import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { getMDXComponents } from "@/mdx-components";
import { locales, normalizeLocale } from "@/i18n/locale";
import { buildArticleStructuredData, buildMetadata } from "@/lib/seo";

type ContentKind = "docs" | "blogs";
type PageParams = { slug?: string[]; locale?: string };

function values(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  if (typeof value === "string") return [value];
  return undefined;
}

export function getArticleMetadata({
  source,
  kind,
  params
}: {
  source: any;
  kind: ContentKind;
  params: PageParams;
}): Metadata {
  const page = source.getPage(params.slug, params.locale);
  if (!page) notFound();

  const data = page.data as any;
  const slug = (params.slug ?? []).join("/");
  const path = `/${kind}/${slug}`;
  const tags = Array.isArray(data.keywords)
    ? data.keywords
    : typeof data.keywords === "string"
    ? data.keywords
    : data.tags;
  const authors = values(data.authors) ?? values(data.author);

  return buildMetadata({
    locale: params.locale,
    path,
    title: page.data.title,
    description: page.data.description,
    keywords: tags,
    image: data.image,
    imageAlt: data.imageAlt,
    availableLocales: locales.filter((locale) => {
      const variant = source.getPage(params.slug, locale);
      return variant && variant.data.noindex !== true;
    }),
    noindex: data.noindex === true,
    type: kind === "blogs" && slug === "about" ? "website" : "article",
    publishedTime: data.publishedAt,
    modifiedTime: data.updatedAt ?? data.publishedAt,
    authors
  });
}

export function Article({
  source,
  kind,
  params
}: {
  source: any;
  kind: ContentKind;
  params: PageParams;
}) {
  const page = source.getPage(params.slug, params.locale);
  if (!page) notFound();

  const data = page.data as any;
  const MDXContent = page.data.body;
  const slug = (params.slug ?? []).join("/");
  const locale = normalizeLocale(params.locale);
  const authors = values(data.authors) ?? values(data.author);
  const isAboutPage = kind === "blogs" && slug === "about";
  const jsonLd = buildArticleStructuredData({
    locale,
    kind,
    slug,
    title: page.data.title,
    description: page.data.description,
    image: data.image,
    publishedTime: data.publishedAt,
    modifiedTime: data.updatedAt,
    authors
  });

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      container={kind === "blogs" ? { className: "guide-article-page" } : undefined}
      article={kind === "blogs" ? { className: "guide-article-content" } : undefined}
      tableOfContent={{ style: "clerk" }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      {!isAboutPage && (authors?.length || data.updatedAt || data.publishedAt) ? (
        <div className="article-meta">
          {authors?.length ? <span>{authors.join(", ")}</span> : null}
          {data.updatedAt ?? data.publishedAt ? (
            <time dateTime={data.updatedAt ?? data.publishedAt}>
              {new Intl.DateTimeFormat(locale, {
                year: "numeric",
                month: "long",
                day: "numeric"
              }).format(new Date(data.updatedAt ?? data.publishedAt))}
            </time>
          ) : null}
        </div>
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
        }}
      />
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            a: createRelativeLink(source, page)
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}
