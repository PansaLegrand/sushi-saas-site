# Repository Guidelines

This repository owns the public Sushi SaaS website, documentation, and editorial
content. It deliberately contains no application backend, authentication,
billing, database, storage, or admin code.

## Structure

- `src/app/[locale]/` contains the localized landing, docs, blog, and legal
  routes.
- `content/docs/<locale>/` contains starter guides.
- `content/blog/<locale>/` contains editorial articles.
- `messages/` contains site UI translations. Keep all five catalogs aligned.
- `src/lib/source.ts` is the only Fumadocs collection loader.
- `src/lib/seo.ts` derives canonical and alternate URLs. Content frontmatter
  must not provide a `canonical` field.
- `.source/` is generated. Never edit or commit it.

## Content rules

Run `pnpm content:check` after editing content. Every English page must have the
same slug in `en`, `zh`, `es`, `fr`, and `ja`. Use ISO dates. Internal links
must target a page that exists in the selected locale.

The default English locale is unprefixed:

- English: `/docs/quick-start`
- French: `/fr/docs/quick-start`

Legacy starter guides once lived under `/blogs`; redirects remain for inbound
links, but new content must link to `/docs`.

Public guides describe a released version of the starter. When starter behavior
changes, update the guide in the same release window and link source examples to
the corresponding starter tag rather than an unstable line on `main`.

## Commands

- `pnpm dev` — generate MDX sources and run the local site.
- `pnpm content:check` — validate frontmatter, links, slugs, and locale parity.
- `pnpm lint` — lint the site.
- `pnpm typecheck` — regenerate MDX types and run TypeScript.
- `pnpm test` — run repository rule tests.
- `pnpm build` — content-check and build the production site.
- `pnpm check` — run every local gate.

Use Conventional Commits. Never add SaaS runtime dependencies here; those
belong in the starter repository.
