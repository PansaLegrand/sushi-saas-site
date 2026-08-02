import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const locales = ["en", "zh", "es", "fr", "ja"];
const docGroups = [
  "(01-start-here)",
  "(02-build-the-product)",
  "(03-operate-and-launch)",
  "(04-optional-examples)",
  "(05-admin-console)"
];

function file(path) {
  return new URL(`../${path}`, import.meta.url);
}

function json(path) {
  return JSON.parse(readFileSync(file(path), "utf8"));
}

test("localized docs expose the same ordered adoption journey", () => {
  for (const locale of locales) {
    const root = `content/docs/${locale}`;
    assert.equal(existsSync(file(`${root}/_meta.json`)), false);
    assert.deepEqual(json(`${root}/meta.json`).pages, docGroups);

    for (const group of docGroups) {
      const metadata = json(`${root}/${group}/meta.json`);
      assert.ok(metadata.title);
      assert.ok(metadata.pages.length > 0);
      for (const slug of metadata.pages) {
        assert.ok(existsSync(file(`${root}/${group}/${slug}.mdx`)));
      }
    }
  }
});

test("guides use a stable decision-first tree order", () => {
  const expected = [
    "why-use-a-saas-template",
    "anatomy-of-modern-saas",
    "web-authentication-deep-dive",
    "what-is-middleware",
    "affiliate-and-reward"
  ];

  for (const locale of locales) {
    const root = `content/blog/${locale}`;
    assert.equal(existsSync(file(`${root}/_meta.json`)), false);
    assert.deepEqual(json(`${root}/meta.json`).pages, [
      "about",
      "(inside-the-starter)"
    ]);
    assert.deepEqual(
      json(`${root}/(inside-the-starter)/meta.json`).pages,
      expected
    );
  }
});

test("the docs index groups tasks while guides keep editorial cards", () => {
  const docsPage = readFileSync(file("src/app/[locale]/docs/page.tsx"), "utf8");
  const guidesPage = readFileSync(file("src/app/[locale]/blogs/page.tsx"), "utf8");

  assert.match(docsPage, /order="tree"/);
  assert.match(docsPage, /\bgrouped\b/);
  assert.match(guidesPage, /order="tree"/);
  assert.doesNotMatch(guidesPage, /\bgrouped\b/);
});

test("Fumadocs links use the same as-needed locale policy as canonical URLs", () => {
  const source = readFileSync(file("src/lib/source.ts"), "utf8");

  assert.match(source, /hideLocale:\s*["']default-locale["']/);
});
