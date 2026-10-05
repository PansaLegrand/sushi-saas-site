# Search and content plan — 2026-10-05

## What the evidence establishes

The owner reports almost no search clicks. No impressions, query report,
average positions, country/device split, indexed-page report, or conversion
data was available. The HTTP crawl found 195 sitemap URLs returning 200 with
one H1 and internal links. The live site already exposes Content Studio.
Canonical URLs, locale URLs, redirects, and robots are broadly working. These
facts establish public accessibility, not Google's indexed coverage or ranking.

The review read all 170 existing localized MDX pages. The audit artifacts have
the complete slug ledger and source references. Several instructions lagged
the starter: product/legal configuration, production provider requirements,
environment profiles, Better Auth/Studio migrations, mock AI activation, and
portable worker guidance. Incorrect setup advice weakens usefulness even when
the page is technically crawlable.

The current traffic hypothesis is that the site is better at helping an
existing adopter than earning discovery for specific engineering problems.
That is an inference from the content, not a measured attribution of low
clicks. Index coverage and query data may reveal a different limiting factor.

## Implemented content changes

- The homepage now names the category in its main heading: an open-source
  Next.js SaaS starter. It keeps one clear purpose and a direct setup path.
- DojoClip appears as a real use case in the starter README, homepage, and
  a dedicated guide in all five languages. The guide separates the public
  product from the starter's example adapters and avoids invented metrics.
- A full environment guide answers profile loading, generated secrets,
  required provider fields, shared values, distinct auth origins, Studio
  isolation, and production process injection. This fills an observed adoption
  gap rather than creating a generic SEO article.
- Content Studio now has concrete editor, media, API, migration, scheduling,
  and marketing setup instructions. Existing docs correct the source-confirmed
  defects across all five languages.
- Important instructions link directly to their next action. Existing route
  slugs remain stable, preserving inbound links and avoiding a new migration.
- A reviewed source manifest and an optional cross-repository checker flag
  future code drift and broken pinned code links. Dates change for meaningful
  content edits, not merely because a build or source-pin update occurred.

These are useful product/content changes. They are not a promise of search
traffic or an assertion that metadata was the main cause of low clicks.

## Search intents and primary pages

The phrases below are candidate reader needs, **not researched search volumes**.
Use Search Console impressions and relevant search results to choose follow-up
work. Keep a primary page for a task; editorial material should explain choices
and link to the recipe rather than duplicate it.

| Reader need | Primary page | Evidence that makes the page worth visiting |
| --- | --- | --- |
| Open-source Next.js SaaS starter | Homepage and `why-use-a-saas-template` | Exact included stack, fit decisions, runnable setup, real product use case |
| Configure SaaS environment variables across web/Admin/worker | `environment-configuration` | Actual profile filenames/loaders, secret commands, complete sharing matrix |
| Add Payload CMS to a Next.js SaaS | `content-studio-and-marketing` | Separate DB/auth, initial editor setup, private media, signed gateway, migrations |
| Better Auth MFA and an operator console | `authentication-and-admin`, `admin-console-setup` | Actual roles, tenant vs platform authority, origin rules, schema-first upgrade |
| Stripe subscriptions and credits without duplicate charges | `stripe-setup`, `account-ledger` | Replay identity, portal policy, ledger source, failure/reconciliation behavior |
| Private R2/S3 upload in a multi-tenant app | `storage-uploads` | Presign/complete/download/delete recipe, checksum/quota and owner boundaries |
| PostgreSQL jobs for a Next.js SaaS | `jobs-and-readiness` | Claim/lease/retry rules, worker vs cron choices, readiness and recovery |
| Build an AI SaaS with Next.js | `dojoclip-ai-saas-use-case`, `image-generation-workflow` | Real product scope, runnable paid-task chain, explicit production adaptation work |

## Release and measurement sequence

1. Release both repository changes so official README links, pinned source,
   updated guides, metadata and sitemap agree. Run the production HTML checks
   against the release and confirm key paths in every language.
2. In the existing Search Console property, submit or confirm
   `https://www.sushisaas.com/sitemap.xml`. Inspect the homepage, environment
   guide, Studio guide, DojoClip case, and one non-English variant. Check crawl
   availability, index status, and Google's selected canonical. Request
   indexing for the new/meaningfully updated pages as appropriate; repeated
   requests are not a growth strategy.
3. Retain a baseline using the last 28 days and the preceding 28 days. Record
   clicks, impressions, CTR, average position, and indexed pages. Split branded
   queries (`Sushi SaaS`, `sushisaas`) from non-branded needs; inspect page and
   locale groups rather than averaging unrelated topics together.
4. If impressions are scarce, check exclusions and relevance to actual queries.
   If pages are indexed and impressions exist at low positions, deepen the
   best-matching guide with original examples and failure evidence. If a useful
   page is shown in strong positions but CTR is low, revise its title and
   description to describe the exact answer, then compare equivalent periods.
5. Review the next data window after indexing has had time to occur. Assess
   useful non-branded impressions and visits to setup/source links, not only
   total clicks. Track signup/repository-use outcomes only through an agreed
   measurement implementation; none was installed in this change.

Field Core Web Vitals and page experience remain unmeasured; a successful
build is not a performance score. Use Search Console field data when available
and a reproducible lab profile for representative mobile/desktop pages.

## Editorial and distribution rules

Maintain original examples and native-language explanations. Japanese additions
in particular had English engineering fragments; preserve identifiers but
translate prose. Publish a follow-up only when it answers a real missing
question and has source evidence. Do not produce large batches of similar
landing pages or change publication dates to imply freshness.

Use accurate titles and descriptive internal links. Avoid meta-keyword work as
a traffic strategy: Google ignores that tag. A shared branding card can serve
Open Graph previews, but article structured data should use a real
representative image when one exists. Do not invent ratings or business results.

Promote the useful guides through the public GitHub README and real product
case. Future announcements or community posts should target places where the
engineering problem matters and disclose the project's relationship. No
messages or announcements were sent as part of this audit.

## Primary guidance

- [Google: helpful, reliable content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: Search Console monitoring](https://developers.google.com/search/docs/monitor-debug/search-console-start)
- [Google: descriptive title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: canonical sitemaps and meaningful lastmod](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags)

## Final local acceptance

- Starter README and co-versioned runbooks updated in focused commits
  `2b20700` and `b16b416`; their commit gates passed all lint and 858 hermetic tests.
- All 180 current localized content pages pass the content validator.
- The reviewed snapshot checker passes 255 immutable source links against
  `b16b416d3ac2f50d2e6f2c25ce5736b91f6740b9`.
- Website lint and type checking pass. The final production build emits 210
  static pages, including framework paths; its public sitemap contains 205 URLs.
- All 25 website tests executed successfully with the built server, including
  initial-head metadata across five locales and three browser/crawler agents.
- A full crawl of the 205 public sitemap URLs found HTTP 200, one H1, matching
  canonical/language metadata, and internal discoverability for every URL.
- The five Studio draft examples were accepted by the actual starter
  `portableDraftSchema`, without database or provider calls.

This verifies repository content and locally built HTML. The live site still
requires release of both repositories; Search Console outcomes and field
performance remain post-release measurements.
