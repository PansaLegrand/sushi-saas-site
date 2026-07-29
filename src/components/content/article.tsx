import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { getMDXComponents } from "@/mdx-components";
import { SiteConfig } from "@/config/site";
import { absoluteLocaleUrl, normalizeLocale } from "@/i18n/locale";
import { buildMetadata } from "@/lib/seo";

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
    noindex: data.noindex === true,
    type: "article",
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
  const url = absoluteLocaleUrl(SiteConfig.origin, locale, `/${kind}/${slug}`);
  const authors = values(data.authors) ?? values(data.author);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": kind === "docs" ? "TechArticle" : "BlogPosting",
    headline: page.data.title,
    description: page.data.description,
    datePublished: data.publishedAt,
    dateModified: data.updatedAt ?? data.publishedAt,
    inLanguage: locale,
    author: authors?.map((name) => ({ "@type": "Person", name })),
    mainEntityOfPage: url
  };

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: "clerk" }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
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
