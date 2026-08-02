import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("docs keep the notebook tree while guides use the top-navigation shell", () => {
  const docsLayout = source("../src/app/[locale]/docs/layout.tsx");
  const guidesRouteLayout = source("../src/app/[locale]/blogs/layout.tsx");
  const guidesLayout = source("../src/components/content/guides-layout.tsx");

  assert.match(docsLayout, /CollectionLayout/);
  assert.match(guidesRouteLayout, /GuidesLayout/);
  assert.match(guidesLayout, /HomeLayout/);
  assert.doesNotMatch(guidesLayout, /layouts\/notebook/);
});
