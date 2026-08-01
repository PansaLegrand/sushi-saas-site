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

const collectionNames: Record<string, Record<ContentKind, string>> = {
  en: { docs: "Documentation", blogs: "Blog" },
  zh: { docs: "文档", blogs: "博客" },
  es: { docs: "Documentación", blogs: "Blog" },
  fr: { docs: "Documentation", blogs: "Blog" },
  ja: { docs: "ドキュメント", blogs: "ブログ" }
};

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
  const image = new URL(data.image ?? "/og.png", SiteConfig.origin).toString();
  const isAboutPage = kind === "blogs" && slug === "about";
  const collectionName = collectionNames[locale]?.[kind] ?? collectionNames.en[kind];
  const collectionUrl = absoluteLocaleUrl(SiteConfig.origin, locale, `/${kind}`);
  const article = {
    "@type": isAboutPage ? "AboutPage" : kind === "docs" ? "TechArticle" : "BlogPosting",
    "@id": `${url}#article`,
    headline: page.data.title,
    description: page.data.description,
    image: isAboutPage ? undefined : [image],
    datePublished: isAboutPage ? undefined : data.publishedAt,
    dateModified: isAboutPage ? undefined : data.updatedAt ?? data.publishedAt,
    inLanguage: locale,
    author: isAboutPage
      ? undefined
      : authors?.map((name) => ({
          "@type": "Person",
          name,
          url: absoluteLocaleUrl(SiteConfig.origin, locale, "/blogs/about")
        })),
    publisher: {
      "@type": "Organization",
      name: SiteConfig.name,
      url: SiteConfig.origin
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url }
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      article,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SiteConfig.name,
            item: absoluteLocaleUrl(SiteConfig.origin, locale)
          },
          {
            "@type": "ListItem",
            position: 2,
            name: collectionName,
            item: collectionUrl
          },
          {
            "@type": "ListItem",
            position: 3,
            name: page.data.title,
            item: url
          }
        ]
      }
    ]
  };

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: "clerk" }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
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
