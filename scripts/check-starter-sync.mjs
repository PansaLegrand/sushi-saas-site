import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkStarterProvenance, extractLinks } from "./check-content.mjs";

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

/** Read tracked source only. Never open a developer's actual environment files. */
export function checkStarterSync(starterRoot, siteRoot = process.cwd()) {
  const errors = [];
  const manifest = JSON.parse(
    readFileSync(join(siteRoot, "docs/starter-source.json"), "utf8")
  );
  if (!/^[a-f0-9]{40}$/.test(manifest.commit)) {
    return { errors: ["Starter snapshot must use an immutable full Git commit."], links: 0 };
  }
  const git = (args) => execFileSync("git", args, {
    cwd: starterRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
  try {
    git(["cat-file", "-e", `${manifest.commit}^{commit}`]);
  } catch {
    return { errors: ["The reviewed starter commit is unavailable in this checkout."], links: 0 };
  }

  const changed = git(["diff", "--name-only", "--no-renames", manifest.commit])
    .split("\n")
    .filter((file) => file && !["README.md", "AGENTS.md", "LICENSE"].includes(file));
  if (changed.length) {
    errors.push(`Starter changed since the reviewed snapshot: ${changed.join(", ")}. Review the affected public guides before updating the pin.`);
  }

  let links = 0;
  const checkedPaths = new Set();
  for (const collection of ["docs", "blog"]) {
    for (const file of walk(join(siteRoot, "content", collection))) {
      if (!/\.mdx?$/.test(file)) continue;
      const source = readFileSync(file, "utf8");
      for (const error of checkStarterProvenance(source, manifest)) {
        errors.push(`${relative(siteRoot, file)}: ${error}`);
      }
      for (const raw of extractLinks(source)) {
        if (!raw.startsWith(`${manifest.repository}/`)) continue;
        const url = new URL(raw);
        const parts = url.pathname.split("/").filter(Boolean);
        if (!["tree", "blob"].includes(parts[2])) continue;
        links += 1;
        if (parts[3] !== manifest.commit) {
          errors.push(`${relative(siteRoot, file)}: source link is not pinned to the reviewed snapshot.`);
          continue;
        }
        const sourcePath = decodeURIComponent(parts.slice(4).join("/"));
        if (!sourcePath || checkedPaths.has(sourcePath)) continue;
        checkedPaths.add(sourcePath);
        try {
          git(["cat-file", "-e", `${manifest.commit}:${sourcePath}`]);
        } catch {
          errors.push(`${relative(siteRoot, file)}: missing pinned source path ${sourcePath}.`);
        }
      }
    }
  }
  return { errors, links };
}

function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const index = args.indexOf("--starter-dir");
  if (args.length !== 2 || index !== 0 || !args[1]) {
    console.error("Usage: pnpm content:check:starter -- --starter-dir /path/to/sushi-saas-template");
    process.exitCode = 1;
    return;
  }
  try {
    const result = checkStarterSync(resolve(args[1]));
    if (result.errors.length) {
      console.error(result.errors.join("\n"));
      process.exitCode = 1;
      return;
    }
    console.log(`Starter snapshot matches tracked source; ${result.links} pinned source links checked.`);
  } catch {
    console.error("Unable to check starter source. Verify both repository paths and the review manifest.");
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
