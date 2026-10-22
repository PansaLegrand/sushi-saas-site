import assert from "node:assert/strict";
import test from "node:test";
import {
  contentSlug,
  checkStarterProvenance,
  extractLinks,
  parseFrontmatter,
  publicContentPath
} from "../scripts/check-content.mjs";

const sourceSnapshot = {
  repository: "https://github.com/example/starter",
  commit: "1234567890abcdef1234567890abcdef12345678"
};

test("source labels agree with the destination while descriptive labels remain valid", () => {
  const { repository, commit } = sourceSnapshot;
  const source = [
    `[Revision \`1234567\`](${repository}/tree/${commit})`,
    `[\`src/lib/auth.ts\`](${repository}/blob/${commit}/src/lib/auth.ts)`
  ].join("\n");
  assert.deepEqual(checkStarterProvenance(source, sourceSnapshot), []);
  assert.match(
    checkStarterProvenance(`[\`b16b416\`](${repository}/tree/${commit})`, sourceSnapshot)[0],
    /source link label b16b416 does not match its target revision/
  );
  assert.match(
    checkStarterProvenance(`[commit b16b416](${repository}/blob/${commit}/README.md)`, sourceSnapshot)[0],
    /source link label b16b416/
  );
});

test("current source declarations match in every locale without rewriting historical context", () => {
  const declarations = [
    "Verified against starter commit `b16b416`:",
    "Vérifié avec le commit `b16b416` du starter :",
    "Verificado con el commit `b16b416` del starter:",
    "已根据启动模板提交 `b16b416` 验证：",
    "スターターのコミット `b16b416` で確認済みです。"
  ];
  for (const declaration of declarations) {
    assert.match(checkStarterProvenance(declaration, sourceSnapshot)[0], /current source declaration/);
    assert.deepEqual(checkStarterProvenance(declaration.replace("b16b416", "1234567"), sourceSnapshot), []);
  }
  assert.deepEqual(checkStarterProvenance("Historical behavior before `b16b416` differed.", sourceSnapshot), []);
  assert.deepEqual(checkStarterProvenance("[External revision b16b416](https://github.com/other/project/tree/1234567890abcdef1234567890abcdef12345678)", sourceSnapshot), []);
});

test("copyable starter checkouts stay aligned when the reviewed pin changes", () => {
  assert.match(
    checkStarterProvenance("git switch -c my-saas b16b416\n", sourceSnapshot)[0],
    /starter checkout b16b416 does not match reviewed revision/
  );
  assert.deepEqual(checkStarterProvenance(`git switch -c my-saas ${sourceSnapshot.commit}\n`, sourceSnapshot), []);
});

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
