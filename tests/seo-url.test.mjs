import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function moduleUrl(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  let compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  for (const [name, url] of Object.entries(dependencies)) {
    compiled = compiled.replaceAll(`"${name}"`, `"${url}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
}

const localeUrl = moduleUrl("../src/i18n/locale.ts");
const siteUrl = moduleUrl("../src/config/site.ts");
const seoUrl = moduleUrl("../src/lib/seo.ts", {
  "@/i18n/locale": localeUrl,
  "@/config/site": siteUrl
});
const localeModule = await import(localeUrl);
const seoModule = await import(seoUrl);

test("the homepage canonical retains the root slash", () => {
  assert.equal(
    localeModule.absoluteLocaleUrl("https://www.sushisaas.com", "en", "/"),
    "https://www.sushisaas.com/"
  );
});

test("localized metadata is self-canonical with reciprocal language alternates", () => {
  const metadata = seoModule.buildMetadata({
    locale: "fr",
    path: "/docs/quick-start",
    title: "Démarrage rapide",
    description: "Configurez le starter."
  });
  assert.equal(metadata.alternates.canonical, "https://www.sushisaas.com/fr/docs/quick-start");
  assert.equal(metadata.alternates.languages.fr, metadata.alternates.canonical);
  assert.equal(metadata.alternates.languages["x-default"], "https://www.sushisaas.com/docs/quick-start");
  assert.equal(Object.keys(metadata.alternates.languages).length, 6);
  assert.equal(metadata.openGraph.locale, "fr_FR");
  assert.deepEqual(metadata.openGraph.alternateLocale, ["en_US", "zh_CN", "es_ES", "ja_JP"]);
});

test("unpublished or noindex translations are absent from language clusters", () => {
  assert.deepEqual(seoModule.languageAlternates("/docs/example", ["en", "ja"]), {
    en: "https://www.sushisaas.com/docs/example",
    ja: "https://www.sushisaas.com/ja/docs/example",
    "x-default": "https://www.sushisaas.com/docs/example"
  });
  assert.deepEqual(seoModule.languageAlternates("/docs/example", []), {});
  assert.equal(
    seoModule.languageAlternates("/docs/example", ["fr"])["x-default"],
    "https://www.sushisaas.com/fr/docs/example"
  );
  const metadata = seoModule.buildMetadata({
    locale: "fr",
    path: "/docs/example",
    title: "Hidden draft",
    noindex: true
  });
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.alternates.languages, undefined);
});

test("share-card dimensions are only asserted for the known site image", () => {
  const defaults = seoModule.buildMetadata({ title: "Quick Start" });
  assert.equal(defaults.openGraph.images[0].width, 1200);
  const custom = seoModule.buildMetadata({
    title: "Architecture",
    image: "https://images.example.com/og.png",
    imageAlt: "The job worker and web application use the same queue."
  });
  assert.equal(custom.openGraph.images[0].width, undefined);
  assert.equal(custom.openGraph.images[0].height, undefined);
  assert.equal(custom.openGraph.images[0].alt, "The job worker and web application use the same queue.");
});

test("article authors retain visible names while Open Graph identifies their profile URL", () => {
  const metadata = seoModule.buildMetadata({
    title: "Quick Start",
    type: "article",
    authors: ["Sushi SaaS"]
  });
  assert.deepEqual(metadata.authors, [{ name: "Sushi SaaS", url: "https://www.sushisaas.com" }]);
  assert.deepEqual(metadata.openGraph.authors, ["https://www.sushisaas.com"]);
});

test("article structured data does not claim the generic branding card as its image", () => {
  const input = {
    kind: "docs",
    slug: "quick-start",
    locale: "fr",
    title: "Démarrage rapide",
    description: "Configurez le starter.",
    authors: ["Sushi SaaS"],
    publishedTime: "2026-08-01T00:00:00.000Z",
    modifiedTime: "2026-10-05T00:00:00.000Z"
  };
  for (const image of [undefined, "/og.png", "https://www.sushisaas.com/og.png"]) {
    const graph = JSON.parse(JSON.stringify(seoModule.buildArticleStructuredData({ ...input, image })));
    const article = graph["@graph"][0];
    assert.equal(article["@type"], "TechArticle");
    assert.equal(article.url, "https://www.sushisaas.com/fr/docs/quick-start");
    assert.equal(article.image, undefined);
    assert.equal(article.dateModified, input.modifiedTime);
    assert.equal(article.author[0]["@type"], "Organization");
    assert.equal(article.mainEntityOfPage["@id"], article.url);
    assert.equal(graph["@graph"][1].itemListElement[1].item, "https://www.sushisaas.com/fr/docs");
  }
  const illustrated = seoModule.buildArticleStructuredData({ ...input, image: "/guides/worker-architecture.png" });
  assert.deepEqual(illustrated["@graph"][0].image, ["https://www.sushisaas.com/guides/worker-architecture.png"]);
});

test("the about page is not represented as a dated blog article", () => {
  const graph = seoModule.buildArticleStructuredData({
    kind: "blogs",
    slug: "about",
    title: "What Sushi SaaS Is",
    publishedTime: "2025-10-02T00:00:00.000Z"
  });
  assert.equal(graph["@graph"][0]["@type"], "AboutPage");
  assert.equal(graph["@graph"][0].datePublished, undefined);
  assert.equal(graph["@graph"][0].author, undefined);
});

test("the sitemap excludes noindex pages and their alternate URLs without inventing dates", async () => {
  const fixtureUrl = `data:text/javascript;base64,${Buffer.from(`
    const pages = {
      en: [
        { slugs: ['welcome'], url: '/docs/welcome', data: { updatedAt: '2026-10-05T00:00:00.000Z' } },
        { slugs: ['english-only'], url: '/docs/english-only', data: {} },
        { slugs: ['draft'], url: '/docs/draft', data: { noindex: true } }
      ],
      fr: [{ slugs: ['welcome'], url: '/fr/docs/welcome', data: { noindex: true } }],
      ja: [{ slugs: ['welcome'], url: '/ja/docs/welcome', data: { publishedAt: '2026-08-01T00:00:00.000Z' } }]
    };
    export const docsSource = {
      getPages: (locale) => pages[locale] ?? [],
      getPage: (slugs, locale) => (pages[locale] ?? []).find((page) => page.slugs.join('/') === slugs.join('/'))
    };
    export const blogSource = { getPages: () => [] };
  `).toString("base64")}`;
  const { default: sitemap } = await import(moduleUrl("../src/app/sitemap.ts", {
    "@/i18n/locale": localeUrl,
    "@/config/site": siteUrl,
    "@/lib/seo": seoUrl,
    "@/lib/source": fixtureUrl
  }));
  const entries = sitemap();
  assert.equal(entries.length, 28);
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);
  assert.equal(entries.some((entry) => entry.url.endsWith('/draft')), false);
  assert.equal(entries.some((entry) => entry.url.includes('/fr/docs/welcome')), false);
  const welcome = entries.find((entry) => entry.url === 'https://www.sushisaas.com/docs/welcome');
  assert.equal(welcome.lastModified.toISOString(), '2026-10-05T00:00:00.000Z');
  assert.deepEqual(Object.keys(welcome.alternates.languages), ['en', 'ja', 'x-default']);
  const englishOnly = entries.find((entry) => entry.url.endsWith('/docs/english-only'));
  assert.equal(englishOnly.lastModified, undefined);
});

test("non-root canonicals remain slashless", () => {
  assert.equal(
    localeModule.absoluteLocaleUrl(
      "https://www.sushisaas.com",
      "fr",
      "/docs/quick-start/"
    ),
    "https://www.sushisaas.com/fr/docs/quick-start"
  );
});
