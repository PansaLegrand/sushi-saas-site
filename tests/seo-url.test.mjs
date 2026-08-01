import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/i18n/locale.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;
const localeModule = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

test("the homepage canonical retains the root slash", () => {
  assert.equal(
    localeModule.absoluteLocaleUrl("https://www.sushi-templates.com", "en", "/"),
    "https://www.sushi-templates.com/"
  );
});

test("non-root canonicals remain slashless", () => {
  assert.equal(
    localeModule.absoluteLocaleUrl(
      "https://www.sushi-templates.com",
      "fr",
      "/docs/quick-start/"
    ),
    "https://www.sushi-templates.com/fr/docs/quick-start"
  );
});
