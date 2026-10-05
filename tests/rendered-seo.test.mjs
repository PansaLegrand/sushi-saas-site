import assert from "node:assert/strict";
import test from "node:test";

// Run against a built local server, for example:
// SEO_TEST_BASE_URL=http://localhost:3004 pnpm test
const baseUrl = process.env.SEO_TEST_BASE_URL;
const origin = "https://www.sushisaas.com";
const locales = ["en", "zh", "es", "fr", "ja"];
const ogLocales = { en: "en_US", zh: "zh_CN", es: "es_ES", fr: "fr_FR", ja: "ja_JP" };

function tags(head) {
  return [...head.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(([tag]) =>
    Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) =>
      [key.toLowerCase(), value]
    ))
  );
}

function publicUrl(locale, path) {
  return `${origin}${locale === "en" ? "" : `/${locale}`}${path === "/" && locale !== "en" ? "" : path}`;
}

test("built pages emit complete canonical, localized, and article metadata in the initial head", {
  skip: !baseUrl
}, async () => {
  for (const locale of locales) {
    for (const path of ["/", "/docs/quick-start", "/blogs/about"]) {
      const route = `${locale === "en" ? "" : `/${locale}`}${path === "/" && locale !== "en" ? "" : path}`;
      for (const userAgent of ["Mozilla/5.0", "Googlebot", "Twitterbot"]) {
        const response = await fetch(new URL(route, baseUrl), {
          headers: { "User-Agent": userAgent },
          signal: AbortSignal.timeout(15_000)
        });
        assert.equal(response.status, 200, `${route}: ${userAgent}`);
        const html = await response.text();
        const head = html.slice(0, html.indexOf("</head>"));
        const metadata = tags(head);
        assert.deepEqual(
          metadata.filter((tag) => tag.rel === "canonical").map((tag) => tag.href),
          [publicUrl(locale, path)],
          `${route}: canonical in head for ${userAgent}`
        );
        const languages = Object.fromEntries(metadata
          .filter((tag) => tag.rel === "alternate" && tag.hreflang)
          .map((tag) => [tag.hreflang, tag.href]));
        assert.deepEqual(languages, {
          ...Object.fromEntries(locales.map((available) => [available, publicUrl(available, path)])),
          "x-default": publicUrl("en", path)
        });
        assert.ok(metadata.some((tag) => tag.name === "description" && tag.content));
        assert.match(head, /<title>[^<]+<\/title>/);
        assert.ok(metadata.some((tag) => tag.property === "og:locale" && tag.content === ogLocales[locale]));
        if (path !== "/") {
          const graphs = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
            .map(([, json]) => JSON.parse(json));
          const article = graphs.flatMap((graph) => graph["@graph"] ?? [])
            .find((node) => node["@type"] === (path === "/blogs/about" ? "AboutPage" : "TechArticle"));
          assert.ok(article);
          assert.equal(article.image, undefined);
          if (path === "/blogs/about") {
            assert.equal(metadata.some((tag) => tag.property === "article:published_time"), false);
          } else {
            assert.ok(metadata.some((tag) => tag.property === "article:author" && tag.content === origin));
          }
        }
      }
    }
  }
});

test("built sitemap, redirect, and missing-page responses preserve their indexing contract", {
  skip: !baseUrl
}, async () => {
  const response = await fetch(new URL("/sitemap.xml", baseUrl), {
    signal: AbortSignal.timeout(15_000)
  });
  assert.equal(response.status, 200);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.includes(`${origin}/docs/quick-start`));
  assert.equal(urls.some((url) => url.startsWith(`${origin}/en/`)), false);
  assert.equal(urls.some((url) => url.includes("?")), false);

  const legacy = await fetch(new URL("/en/blogs/quick-start", baseUrl), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000)
  });
  assert.equal(legacy.status, 308);
  assert.ok(legacy.headers.get("Location").endsWith("/docs/quick-start"));
  const missing = await fetch(new URL("/docs/never-a-real-guide", baseUrl), {
    signal: AbortSignal.timeout(15_000)
  });
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /<meta name="robots" content="noindex"/);
});
