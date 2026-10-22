import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { structure } from "fumadocs-core/mdx-plugins";

function moduleUrl(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  let compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  for (const [name, url] of Object.entries(dependencies)) compiled = compiled.replaceAll(`"${name}"`, `"${url}"`);
  return `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
}

const localeUrl = moduleUrl("../src/i18n/locale.ts");
const { createContentSearch } = await import(moduleUrl("../src/lib/search/server.ts", {
  "@/i18n/locale": localeUrl,
  "fumadocs-core/search/server": import.meta.resolve("fumadocs-core/search/server")
}));
const { handleContentSearch, MAX_SEARCH_LENGTH } = await import(moduleUrl("../src/lib/search/handler.ts", {
  "@/i18n/locale": localeUrl
}));
const locales = ["en", "zh", "es", "fr", "ja"];
const contentPages = [
  ["docs", "(01-start-here)/quick-start", "quick-start"],
  ["blog", "(inside-the-starter)/dojoclip-ai-saas-use-case", "dojoclip-ai-saas-use-case"]
];
const indexes = locales.flatMap((locale) => contentPages.map(([collection, path, slug]) => {
  const source = readFileSync(new URL(`../content/${collection}/${locale}/${path}.mdx`, import.meta.url), "utf8");
  const title = source.match(/^title:\s*(.*)$/m)[1].replace(/^"|"$/g, "");
  const body = source.split("\n---\n").slice(1).join("\n---\n");
  const url = `${locale === "en" ? "" : `/${locale}`}/${collection === "blog" ? "blogs" : "docs"}/${slug}`;
  return { id: url, url, title, locale, structuredData: structure(body) };
}));
const server = createContentSearch(indexes);

test("real localized content matches native queries without cross-locale leakage", async () => {
  const queries = { en: "credits", zh: "积分", es: "créditos", fr: "crédits", ja: "クレジット" };
  for (const locale of locales) {
    const results = await server.search(queries[locale], { locale });
    assert.ok(results.some((result) => result.url.includes("/docs/quick-start")), `${locale}: missing Quick Start`);
    for (const result of results) {
      if (locale === "en") assert.match(result.url, /^\/(docs|blogs)\//);
      else assert.ok(result.url.startsWith(`/${locale}/`), `${locale}: leaked ${result.url}`);
    }
  }
});

test("both collections remain searchable in every locale", async () => {
  for (const locale of locales) {
    const results = await server.search("DojoClip", { locale });
    assert.ok(results.some((result) => result.url.includes("/blogs/dojoclip-ai-saas-use-case")), locale);
  }
  assert.deepEqual(await server.search("zzzzzznonexistentsearchterm", { locale: "en" }), []);
});

test("empty and malformed searches never invoke the index", async () => {
  let called = false;
  const unavailable = { search() { called = true; throw new Error("must not run"); } };
  const empty = await handleContentSearch(new Request("http://localhost/api/search?query=%20%20&locale=fr"), unavailable);
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), []);
  for (const query of ["locale=unknown&query=credit", `query=${"a".repeat(MAX_SEARCH_LENGTH + 1)}`]) {
    const response = await handleContentSearch(new Request(`http://localhost/api/search?${query}`), unavailable);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "INVALID_SEARCH" });
  }
  assert.equal(called, false);
});

test("search responses are bounded and failures expose no internal messages", async () => {
  const request = new Request("http://localhost/api/search?query=credit&locale=FR");
  let options;
  const response = await handleContentSearch(request, { async search(_query, input) { options = input; return Array(50).fill({ type: "page", content: "Result", url: "/fr/docs/quick-start", id: "result" }); } });
  assert.equal((await response.json()).length, 24);
  assert.deepEqual(options, { locale: "fr" });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  const failed = await handleContentSearch(request, { async search() { throw new Error("private failure detail"); } });
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { error: "SEARCH_UNAVAILABLE" });
});

test("search layouts expose the local dialog and Quick Start without a static index export", () => {
  for (const name of ["collection-layout", "guides-layout"]) {
    const source = readFileSync(new URL(`../src/components/content/${name}.tsx`, import.meta.url), "utf8");
    assert.match(source, /SearchDialog: ContentSearchDialog/);
    assert.match(source, /text: t\("start"\)/);
    assert.doesNotMatch(source, /searchToggle=\{\{ enabled: false/);
  }
  const route = readFileSync(new URL("../src/app/api/search/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(route, /staticGET/);
});
