# Technical SEO audit — 2026-10-05

## Scope and evidence

Reviewed the site's route metadata, locale/routing configuration, canonical URL
helper, robots and sitemap generators, article JSON-LD, legacy redirects, content
schema, and production build contracts. The deployed baseline corresponds to the
existing documentation snapshot, whose source links pin starter commit `2a1a04a`.
The accompanying documentation refresh owns the newer starter source pin.

A read-only HTTP crawl fetched **all 195 URLs** in the deployed sitemap: 170
localized content pages plus 25 landing, collection, and legal pages. Every URL
returned HTTP 200, every page had one H1, and every sitemap URL was linked from at
least one internal HTML anchor. The crawl also checked `/robots.txt`, host and
legacy-route redirects, a nonexistent guide, and the share-image response.
Separately, every original Japanese document and blog article was read in full:
**27 docs + 7 blogs**, including frontmatter, examples, and tables. This audit did
not access Search Console, account credentials, field performance data, or real
`.env` files.

The deployed site **already includes Content Studio documentation**, at
`/docs/content-studio-and-marketing` and its four translations. An absent feature
page is therefore not the explanation for low traffic. The snapshot and detailed
configuration instructions still need reconciliation with the newer starter code.

## Findings and patches

### Article structured data used a generic branding image

The live crawl found **165** TechArticle/BlogPosting entries declaring
`https://www.sushisaas.com/og.png` as their article image. That file is a Sushi SaaS
brand/share card, rather than an illustration specific to the marked-up article.
Google recommends images that represent the article, rather than logos or
captions. The shared card remains useful for link previews; Article JSON-LD now
includes `image` only when content supplies a distinct authored image. No images,
ratings, reviews, or offers are invented to fill optional schema fields.
[Google's Article image guidance](https://developers.google.com/search/docs/appearance/structured-data/article).

Article JSON-LD is now assembled by a pure helper that retains the current
TechArticle/BlogPosting/AboutPage types, real dates, visible authors, localized
breadcrumbs, and self-referential page identity. It also exposes `url` explicitly.
A personal author without an actual profile is no longer assigned the generic
project About page as if it uniquely identified that person.

### Open Graph locale and author fields did not follow the protocol

Deployed pages use bare locale codes such as `en` and `fr`, and
`article:author="Sushi SaaS"`. The protocol specifies language/territory locale
values and a profile identifier for article authors. Metadata now emits `en_US`,
`zh_CN`, `es_ES`, `fr_FR`, or `ja_JP`, the other available Open Graph locales, and
the actual organization URL for the shared byline. Browser metadata retains the
visible author name. The branding card's alternative text describes the card;
custom images can provide `imageAlt`, and no longer inherit unverified 1200×630
dimensions. The actual existing local and live brand images are both 1200×630;
there was no dimension defect in that existing asset.
[Open Graph protocol](https://ogp.me/).

### The noindex feature produced inconsistent language clusters

The previous sitemap omitted a locale's `noindex` page but still linked to that
same URL in the hreflang alternates on its siblings. Route metadata also always
advertised all five locales. Current published content does not exercise this
flag, so this is a latent defect in the supported publishing contract, rather
than an observed live indexing failure. Sitemap and article metadata now include
only existing, indexable translations in their language clusters; the English
version remains x-default when available. A noindex page retains its own
canonical but does not advertise an indexable language cluster. This also avoids
linking to nonexistent translations if the collection contract later changes.
[Google's localized-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions).

### About-page metadata contradicted its structured-data type

`/blogs/about` already used AboutPage JSON-LD and hid the article byline/date, but
its Open Graph metadata still identified it as a dated article. Its metadata now
uses `website`, matching the actual page purpose, without article publication or
modification fields.

### Critical metadata depended on the streaming path

Next.js 15 streams Metadata API output into the response body for clients it
considers capable of consuming that stream. The live raw-HTML crawl observed this
for Googlebot: canonical/hreflang/description from Metadata API were not in the
initial head, although the tags existed in the full response. The manually emitted
homepage canonical/hreflang tags **were correctly hoisted into the head**. This is
supported Next.js behavior; it is not evidence that Google failed to index these
pages, and the homepage canonical implementation did not need replacement.

Because this site's metadata is derived from checked-in content and translations,
`htmlLimitedBots: /.*/` now emits all metadata in the initial head for every
client. This makes the HTTP response's canonical, language cluster, and description
independently inspectable without relying on streamed insertion. The tradeoff is
waiting for metadata resolution before the first response; the metadata here does
not require a remote API. This is crawl robustness and verification work, not a
claim of ranking improvement.
[Next.js metadata streaming and crawler configuration](https://nextjs.org/docs/app/getting-started/metadata-and-og-images).

### Hidden documentation search opened an unavailable feature

The documentation layout disabled its visible search control, but left the
Fumadocs RootProvider's default search provider enabled. In the built browser,
Cmd+K opened its Search dialog; entering a query targeted the default
`/api/search`, which returned 404 because this public site does not ship a search
route. Guides already disabled the provider as well as the control. The Docs
RootProvider now sets `search={{ enabled: false }}` to match that intended
behavior. No unpublished content or SaaS backend is added to a public index.

## Existing behavior retained

- The canonical host is `https://www.sushisaas.com`; HTTP apex redirects to HTTPS
  apex, then HTTPS apex redirects to HTTPS www, both with 308 responses. Combining
  those hops is an optional hosting configuration improvement.
- English is unprefixed. `/en/docs/quick-start` redirects permanently to
  `/docs/quick-start`, and moved `/blogs` starter-guide URLs redirect directly to
  their `/docs` equivalents, including localized variants.
- The sitemap has no duplicate URLs or query URLs, and exposes every locale plus
  x-default. Dates come from authored `updatedAt` or `publishedAt`, never the
  current build time. The deployed latest content modification is
  `2026-08-24T00:00:00.000Z`. Meaningful content changes must update their real
  modification dates in the content refresh.
- Robots allows public pages and advertises the correct sitemap. It restricts
  search-query URLs, rather than blocking docs, articles, or assets.
- A nonexistent guide returned a real 404. Collections contain crawlable links to
  their articles, so the current collection size does not require pagination to
  make pages discoverable.
- Article dates and organization bylines agree with the rendered content. The
  website uses SoftwareSourceCode for the starter, rather than fictitious product
  ratings or offers.

Google treats sitemap URLs as canonical suggestions and uses lastmod when it
reflects a verifiable substantive change; it does not use sitemap priority or
changefreq to improve rankings. No such fields were added.
[Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Japanese content review

All 34 original Japanese pages were read in full. This is the personal-reading
inventory, rather than an automated filename or frontmatter check:

| Collection | Read pages |
| --- | --- |
| Start here | architecture-and-errors; customize-your-product; quick-start |
| Build the product | account-ledger; authentication-and-admin; content-studio-and-marketing; database-setup; organizations-and-teams; plans-and-entitlements; storage-uploads; stripe-setup |
| Operate and launch | account-data-lifecycle; analytics-and-consent; backups-retention-and-restore; containers-and-launch-readiness; deployment-and-security; email-service; jobs-and-readiness; logging; notifications-slack; testing-and-ci |
| Optional examples | image-generation-workflow; referrals; reservations-feature; text-to-video-tasks |
| Admin | admin-console-operations; admin-console-setup |
| Blog | affiliate-and-reward; anatomy-of-modern-saas; five-credit-task-tests-the-whole-saas; web-authentication-deep-dive; what-is-middleware; why-use-a-saas-template; about |

Specific findings passed to the content refresh:

1. The fit-evaluation article still tells readers to open **two applications**;
   Quick Start and About correctly describe three applications plus a worker.
2. The Content Studio page already documents database and authentication isolation,
   gateway sharing, unsubscribe separation, and consent rechecks. Its operational
   bootstrap/configuration detail must follow the new source audit, rather than
   describing Content Studio as a newly absent feature.
3. Several August additions have substantial mixed-language engineering prose.
   Examples include the five-credit article's title and failure explanation, the
   logging page's description, and the image-workflow walkthrough. Keep real
   identifiers and command names, but translate surrounding sentences so Japanese
   readers can follow them naturally.
4. All original content points to `2a1a04a`; source claims must be verified before
   changing that pin. No broken Japanese content links were found during reading.

## Validation

At the technical patch boundary:

- `pnpm lint` passed with zero warnings.
- `pnpm typecheck` passed after regenerating MDX types.
- All **20** then-existing executed repository tests passed.
- New behavioral tests cover canonical/hreflang policy, supported Open Graph
  locales, byline URL semantics, Article/AboutPage schema, real versus generic
  images, and noindex/partial-translation sitemap fixtures.
- `tests/rendered-seo.test.mjs` adds production HTTP checks for five locales and
  browser/Googlebot/Twitterbot user agents. It runs when `SEO_TEST_BASE_URL` points
  to a built server, and explicitly skips otherwise. Run the integrated production
  build and HTTP check after the concurrent localized content refresh completes.

```bash
pnpm build
pnpm exec next start --port 3004
# In another terminal:
SEO_TEST_BASE_URL=http://localhost:3004 pnpm test
```

The parent task owns the final combined build, rendered-server verification, and
release commits. These are source changes until the website is deployed.

## Combined production verification

After the coordinated content refresh, the production build passed and
`SEO_TEST_BASE_URL=http://localhost:3004 pnpm test` passed **all 25 tests with zero
skips**, including 45 homepage/guide/About requests across five locales and three
user agents, sitemap checks, a permanent legacy redirect, and a real noindex 404.

The built sitemap now contains **205 URLs**: 180 localized content pages and 25
landing, collection, and legal pages. All 205 returned HTTP 200. A complete
Googlebot HTTP crawl found zero canonical, reciprocal hreflang, title,
description, or H1 defects in the initial head; zero orphan sitemap URLs; and
zero generic-branding-image Article claims. The live baseline remains the earlier
195-URL deployment until these changes are published.

The English homepage H1 was visually inspected at desktop and narrow widths. Both
the homepage and DojoClip case were checked at a real 390-pixel mobile layout using
documented CDP emulation: document clientWidth and scrollWidth were both 390, and
each H1 stayed inside its 358-pixel content column. The normal browser viewport control clamps
below 500 in this in-app browser, so the actual 390-pixel check used device emulation;
all temporary viewport/device overrides were reset.

The hidden search dialog was reproduced before the one-line provider guard. After
a fresh production rebuild and server restart, Cmd+K left the Docs page intact:
zero dialogs appeared and CDP recorded zero requests to `/api/search`. Production
Next.js does not hot-reload source changes, so this verification used the rebuilt
server.

All 36 current Japanese MDX pages were read: the original 34 plus the new
environment guide and DojoClip case. All five new case translations were also
independently reviewed for claims and clarity.

## Operational evidence still needed

Low clicks alone cannot distinguish insufficient impressions, low ranking, poor
snippet click-through, non-indexing, or low demand. Use Search Console's domain
property to compare the last 28 days with the prior 28 days, split branded and
non-branded queries, and inspect landing pages by language. Check submitted sitemap
status, Google's selected canonical for representative URLs, and indexing reasons.
No Search Console figures or backlinks were available in this audit.

Measure field Core Web Vitals rather than treating a successful build as a
performance measurement. After deployment, inspect representative URLs and their
rich-result eligibility; structured data is not a guarantee of a search feature.
The most useful content work is accurate long-tail setup/failure guides and a real
DojoClip example connected to relevant docs, followed by demand and query evidence.

Adding more `keywords` frontmatter is not a Google SEO fix: Google explicitly
ignores the meta-keyword tag. Titles, descriptions, body content, internal links,
accurate source examples, and useful product evidence need to answer an actual
reader's question.
[Google's supported meta-tag guidance](https://developers.google.com/search/docs/crawling-indexing/special-tags).

## Independent review of the added use case

Read all five new DojoClip case translations and the updated homepage hero and
case copy. The public product currently advertises video editing, image, music,
and voice tools; the article maps that product example to the starter's contracts
without claiming access to DojoClip's private deployment or business metrics.
It explicitly distinguishes product extensions from shipped starter code and
explains the production gates around the mock image reference.
[DojoClip's public product](https://dojoclip.com/).

Small review patches localized the public-product source label in four
translations, shortened the English case title, made the English homepage title
lead with its search category, and replaced the Spanish title's unsupported
"ready for production" phrasing with an accurate open-source Next.js SaaS template
description. The new H1 introduces the category directly in every language.
