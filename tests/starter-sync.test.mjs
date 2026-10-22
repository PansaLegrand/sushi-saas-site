import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkStarterSync } from "../scripts/check-starter-sync.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "sushi-doc-sync-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const starter = join(root, "starter");
  const site = join(root, "site");
  mkdirSync(starter);
  mkdirSync(join(site, "docs"), { recursive: true });
  mkdirSync(join(site, "content/docs/en"), { recursive: true });
  mkdirSync(join(site, "content/blog/en"), { recursive: true });
  const git = (...args) => execFileSync("git", args, {
    cwd: starter, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]
  }).trim();
  git("init", "--quiet");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "Documentation fixture");
  writeFileSync(join(starter, "package.json"), '{"scripts":{"dev":"next dev"}}\n');
  writeFileSync(join(starter, "README.md"), "Fixture\n");
  git("add", ".");
  git("-c", "core.hooksPath=/dev/null", "commit", "--quiet", "-m", "fixture");
  const commit = git("rev-parse", "HEAD");
  const repository = "https://github.com/PansaLegrand/sushi-saas-template";
  const manifestPath = join(site, "docs/starter-source.json");
  writeFileSync(manifestPath, JSON.stringify({ repository, commit }));
  const page = join(site, "content/docs/en/setup.mdx");
  writeFileSync(page, `[Scripts](${repository}/blob/${commit}/package.json)\n`);
  return { starter, site, page, commit, repository, manifestPath };
}

test("source review accepts exact source and README-only edits but detects runtime drift", (t) => {
  const f = fixture(t);
  assert.deepEqual(checkStarterSync(f.starter, f.site), { errors: [], links: 1 });
  writeFileSync(join(f.starter, "README.md"), "Updated official docs link\n");
  assert.equal(checkStarterSync(f.starter, f.site).errors.length, 0);
  writeFileSync(join(f.starter, "package.json"), '{"scripts":{"dev":"different"}}\n');
  assert.match(checkStarterSync(f.starter, f.site).errors[0], /Starter changed.*package.json/);
});

test("source review rejects unavailable files and moving source references", (t) => {
  const f = fixture(t);
  writeFileSync(f.page, `[Missing](${f.repository}/blob/${f.commit}/absent.ts)\n`);
  assert.match(checkStarterSync(f.starter, f.site).errors[0], /missing pinned source path absent.ts/);
  writeFileSync(f.page, `[Moving](${f.repository}/blob/main/package.json)\n`);
  assert.match(checkStarterSync(f.starter, f.site).errors[0], /not pinned/);
});

test("source review requires a full immutable revision", (t) => {
  const f = fixture(t);
  writeFileSync(f.manifestPath, JSON.stringify({ repository: f.repository, commit: "main" }));
  assert.match(checkStarterSync(f.starter, f.site).errors[0], /immutable full Git commit/);
});

test("source review rejects stale displayed labels even when destinations are correctly pinned", (t) => {
  const f = fixture(t);
  const stale = f.commit.startsWith("0000000") ? "fffffff" : "0000000";
  writeFileSync(f.page, `[Starter at \`${stale}\`](${f.repository}/tree/${f.commit})\n`);
  assert.match(checkStarterSync(f.starter, f.site).errors[0], /source link label .* does not match/);
  writeFileSync(f.page, `[Starter at \`${f.commit.slice(0, 7)}\`](${f.repository}/tree/${f.commit})\n`);
  assert.deepEqual(checkStarterSync(f.starter, f.site), { errors: [], links: 1 });
});
