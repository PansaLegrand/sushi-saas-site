import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const LOCALES = ["en", "zh", "es", "fr", "ja"];
export const COLLECTIONS = ["docs", "blog"];
export const SITE_ORIGIN = "https://www.sushisaas.com";
export const STARTER_REPOSITORY =
  "https://github.com/PansaLegrand/sushi-saas-template";

const LEGACY_DOC_SLUGS = new Set([
  "quick-start",
  "database-setup",
  "authentication-and-admin",
  "stripe-setup",
  "notifications-slack",
  "storage-uploads",
  "logging",
  "email-service",
  "account-ledger",
  "text-to-video-tasks",
  "reservations-feature"
]);

export function contentSlug(file, localeRoot) {
  return relative(localeRoot, file)
    .split(sep)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .join("/")
    .replace(/\.(md|mdx)$/i, "");
}

export function publicContentPath(collection, locale, slug) {
  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const route = collection === "blog" ? "blogs" : "docs";
  return `${localePrefix}/${route}/${slug}`;
}

export function parseFrontmatter(source) {
  if (!source.startsWith("---")) return null;
  const end = source.indexOf("\n---", 3);
  if (end === -1) return null;

  const block = source.slice(3, end);
  const values = {};
  for (const line of block.split(/\r?\n/)) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
  }
  return { block, values };
}

export function extractLinks(source) {
  const links = [];
  const patterns = [/\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, /href=["']([^"']+)["']/g];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) links.push(match[1]);
  }
  return links;
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function routeFromLink(raw, currentLocale) {
  if (raw.startsWith("#") || raw.startsWith("mailto:")) return null;

  let path = raw;
  try {
    const url = new URL(raw);
    if (url.origin !== SITE_ORIGIN) return null;
    path = url.pathname;
  } catch {
    if (!raw.startsWith("/")) return null;
    path = raw.split(/[?#]/)[0];
  }

  const parts = path.split("/").filter(Boolean);
  let locale = currentLocale;
  if (LOCALES.includes(parts[0])) locale = parts.shift();
  if (parts.length < 2) return null;
  const collection = parts.shift();
  if (collection !== "docs" && collection !== "blogs") return null;
  return {
    collection: collection === "blogs" ? "blog" : "docs",
    locale,
    slug: parts.join("/")
  };
}

function sorted(values) {
  return [...values].sort();
}

export function checkContent(root = process.cwd()) {
  const errors = [];
  const known = new Map();
  const pages = [];

  for (const collection of COLLECTIONS) {
    const collectionRoot = join(root, "content", collection);
    if (!existsSync(collectionRoot)) {
      errors.push(`missing collection: content/${collection}`);
      continue;
    }

    for (const locale of LOCALES) {
      const localeRoot = join(collectionRoot, locale);
      if (!existsSync(localeRoot)) {
        errors.push(`missing locale: content/${collection}/${locale}`);
        continue;
      }

      const slugs = new Set();
      for (const file of walk(localeRoot)) {
        if (extname(file) === ".json") {
          try {
            JSON.parse(readFileSync(file, "utf8"));
          } catch (error) {
            errors.push(`${relative(root, file)}: invalid JSON (${error.message})`);
          }
          continue;
        }
        if (!/\.mdx?$/i.test(file)) continue;

        const slug = contentSlug(file, localeRoot);
        if (slugs.has(slug)) {
          errors.push(`duplicate slug: ${collection}/${locale}/${slug}`);
        }
        slugs.add(slug);
        pages.push({ collection, locale, slug, file });
      }
      known.set(`${collection}:${locale}`, slugs);
    }

    const reference = known.get(`${collection}:en`) ?? new Set();
    for (const locale of LOCALES.filter((value) => value !== "en")) {
      const actual = known.get(`${collection}:${locale}`) ?? new Set();
      const missing = sorted([...reference].filter((slug) => !actual.has(slug)));
      const extra = sorted([...actual].filter((slug) => !reference.has(slug)));
      if (missing.length || extra.length) {
        errors.push(
          `${collection}/${locale}: locale parity differs (missing: ${
            missing.join(", ") || "none"
          }; extra: ${extra.join(", ") || "none"})`
        );
      }
    }
  }

  for (const page of pages) {
    const label = relative(root, page.file);
    const source = readFileSync(page.file, "utf8");
    const frontmatter = parseFrontmatter(source);
    if (!frontmatter) {
      errors.push(`${label}: missing frontmatter`);
      continue;
    }
    if (!frontmatter.values.title) errors.push(`${label}: missing title`);
    if (!frontmatter.values.description) errors.push(`${label}: missing description`);
    if (/^canonical:/m.test(frontmatter.block)) {
      errors.push(`${label}: canonical must be derived by the route, not frontmatter`);
    }
    for (const field of ["publishedAt", "updatedAt"]) {
      const value = frontmatter.values[field];
      if (value && Number.isNaN(Date.parse(value))) {
        errors.push(`${label}: ${field} is not a valid date`);
      }
    }

    if (/PansaLegrand\/saas-sushi-template|github\.com\/PansaLegrand\/saas-sushi-template/i.test(source)) {
      errors.push(`${label}: uses the retired starter repository URL`);
    }
    if (source.includes(`${SITE_ORIGIN}/en/`)) {
      errors.push(`${label}: hardcodes /en even though the default locale is unprefixed`);
    }

    for (const link of extractLinks(source)) {
      if (/^\/en(?:\/|$)/.test(link)) {
        errors.push(`${label}: internal links must omit the default /en prefix (${link})`);
      }
      const target = routeFromLink(link, page.locale);
      if (!target) continue;

      if (
        target.collection === "blog" &&
        LEGACY_DOC_SLUGS.has(target.slug)
      ) {
        errors.push(`${label}: links to legacy docs route ${link}`);
        continue;
      }

      const available = known.get(`${target.collection}:${target.locale}`);
      if (!available?.has(target.slug)) {
        errors.push(`${label}: broken internal content link ${link}`);
      }
    }
  }

  return { errors, pageCount: pages.length };
}

function main() {
  const { errors, pageCount } = checkContent();
  if (errors.length > 0) {
    console.error(`Content check failed with ${errors.length} issue(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Content check passed for ${pageCount} localized pages.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
