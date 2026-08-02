import assert from "node:assert/strict";
import test from "node:test";
import {
  contentSlug,
  extractLinks,
  parseFrontmatter,
  publicContentPath
} from "../scripts/check-content.mjs";

test("group folders do not become public slug segments", () => {
  assert.equal(
    contentSlug(
      "/repo/content/docs/en/(01-start-here)/quick-start.mdx",
      "/repo/content/docs/en"
    ),
    "quick-start"
  );
});

test("the default locale is unprefixed", () => {
  assert.equal(publicContentPath("docs", "en", "quick-start"), "/docs/quick-start");
  assert.equal(
    publicContentPath("docs", "fr", "quick-start"),
    "/fr/docs/quick-start"
  );
});

test("frontmatter fields and content links are extracted", () => {
  const source = `---
title: "Hello"
updatedAt: "2026-07-29"
---
[Docs](/docs/quick-start)
<a href="/fr/blogs/about">About</a>`;
  assert.equal(parseFrontmatter(source)?.values.title, "Hello");
  assert.deepEqual(extractLinks(source), [
    "/docs/quick-start",
    "/fr/blogs/about"
  ]);
});
