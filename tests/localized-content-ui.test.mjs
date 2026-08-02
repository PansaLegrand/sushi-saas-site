import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("docs and guides share the localized Fumadocs controls", () => {
  const docsLayout = source("../src/components/content/collection-layout.tsx");
  const guidesLayout = source("../src/components/content/guides-layout.tsx");

  for (const layout of [docsLayout, guidesLayout]) {
    assert.match(layout, /contentUiI18n\(lang\)/);
    assert.match(layout, /<RootProvider\s+i18n=/);
  }

  assert.match(docsLayout, /<DocsLayout[\s\S]*?\bi18n\b/);
  assert.match(guidesLayout, /<HomeLayout[\s\S]*?\bi18n\b/);
});

test("Fumadocs controls have translations for every supported locale", () => {
  const translations = source("../src/i18n/content-ui.ts");

  for (const locale of ["en", "zh", "es", "fr", "ja"]) {
    assert.match(translations, new RegExp(`\\n  ${locale}: \\{`));
  }

  for (const label of [
    "On this page",
    "本页内容",
    "En esta página",
    "Sur cette page",
    "このページの内容"
  ]) {
    assert.match(translations, new RegExp(label));
  }
});
