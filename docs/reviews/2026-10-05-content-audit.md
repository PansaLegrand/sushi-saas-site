# Documentation and editorial audit — 2026-10-05

## Scope and evidence

The initial source inventory contains **135 documentation pages** (27 slugs in
each of `en`, `zh`, `es`, `fr`, and `ja`) and **35 editorial pages** (7 slugs in
each locale): **170 existing MDX pages**. This report describes that inventory
before the release synchronization patches and newly added pages.

The primary content reviewer read the **complete bodies of all 54 English and
Chinese documentation pages and all 14 English and Chinese editorial pages**.
For the assigned multilingual patches, the reviewer also read all 15 Spanish,
French, and Japanese versions of `image-generation-workflow`,
`text-to-video-tasks`, `organizations-and-teams`, `jobs-and-readiness`, and
`five-credit-task-tests-the-whole-saas`: **83 distinct complete pages personally
read**. The independent
[Spanish/French reviewer](2026-10-05-es-fr-content-audit.md) read all 68 pages in
those languages, and the
[technical SEO/Japanese reviewer](2026-10-05-technical-seo-audit.md#japanese-content-review)
read all 34 Japanese pages. The combined review therefore covers **all 170
original pages in full**: 68 EN/ZH, 68 ES/FR, and 34 JA. The additional 15 pages
read by the primary reviewer overlap those locale inventories and are not added
to the total.

Comparison source: Sushi SaaS starter commit
`d8b8508bbc3b6c8ba444d2d5bb1d3b80f32a00c1`, including the actual configuration,
route, service, worker, schema, and Payload ownership boundaries. Initial website
HEAD was `f5a0981`. Every existing page linked or named starter snapshot
`2a1a04a`; no page initially referred to the newer auth or Payload security
migrations. Initial `updatedAt` values were August 2 or August 24, 2026.

This is a source and content review. It does not establish that the public
deployment contains the checked-out source, execute the starter's production
flows, or measure search impressions, clicks, rankings, or conversions. The
user reported few search clicks; no Search Console export was available.

## Material findings

1. **Content Studio exists in the checked-out public documentation.**
   `content-studio-and-marketing`, `quick-start`, container, testing, and overview
   pages already describe it. The real gap is a deployable adoption guide:
   isolated database and sessions are described, but initial administrator
   provisioning, production media credentials, editor-origin CSRF configuration,
   public consumer/revalidation integration, serverless scheduling, API-key
   capture, and the current upgrade procedure are missing or too brief. Verify
   the deployed page separately before concluding the live site lacks Studio.
2. **The product customization guide contradicts its own working customizer.**
   It instructs readers to fill legal identity in `src/config/legal.ts`, while
   `LegalData` now reads identity from `saas.config.json.legal`. Reviewed policy
   text and `subProcessors` remain in the TypeScript file. Its final claim that
   the starter has no brand configurator is also misleading after introducing
   `pnpm customize`. Chinese additionally omits the two configuration gate
   commands included in English.
3. **Provider replacement advice cannot activate the production AI examples.**
   Both task pages, both API routes, and both task services independently test
   their development mock gate. `src/lib/demo-flags.ts` closes those gates in
   production. Replacing `src/services/ai/image.ts` or `video.ts` alone therefore
   still yields hidden pages/rejected requests. The image output type also
   restricts MIME, extension, and provider to SVG/`svg`/`mock`. Production
   adaptation must deliberately replace demo admission at each boundary,
   validate the real output type, and preserve auth, entitlement, credits,
   storage, retry, and compensation contracts.
4. **The organization role table implies an available delete workflow.**
   `org:delete` is part of the capability vocabulary, but
   `src/lib/auth.ts` sets `disableOrganizationDeletion: true`; no complete
   customer organization-deletion endpoint ships. Owner billing permission
   should not advertise deletion as an active customer action.
5. **A conditional provider checklist disagrees with current startup validation.**
   Deployment text describes Stripe and storage as required only when enabled.
   The shipped production validator currently always requires Stripe private
   and webhook keys, portal configuration, four primary Price mappings, Resend
   and sender, Redis/IP configuration, and storage credentials. Optional domains
   can be removed by a deliberate code/configuration change; blanking their
   credentials alone is not a deployable configuration.
6. **Recent upgrades require two independently applied migrations.**
   SaaS migration `0037_neat_excalibur.sql` adds Better Auth two-factor
   verification and lockout columns, preserving confirmed enrollments through
   `users.id`. Payload migration
   `20261005_024231_payload_security_fields` adds reset-throttling and storage
   fields. The Studio runbook also requires API-key capture at creation and
   recreating pending scheduled publish/unpublish events after the Payload 3.90
   upgrade. Public database/auth/Studio/deployment guidance should carry these
   exact release facts and retain independent migration commands.
7. **Locale parity currently proves file presence, not equivalent operating advice.**
   Chinese and the reviewed Spanish/French/Japanese job guides still recommend
   only an HTTP scheduler outside Vercel and suggest changing queue architecture
   for longer work, despite their own table listing the shipped portable worker.
   Their job-type summaries also omit marketing delivery and image generation.
   The real defaults remain 20-second handlers and 40-second drains; those
   numbers are correct and should not be copied from the companion-game fork.

## Existing documentation: page-by-page matrix

“Consistent” means no material contradiction was found in the inspected
ownership/configuration contract. It does not mean every described interaction
was run. Shared source-pin synchronization applies to every row.

| Slug | Existing coverage and source comparison | Correction or completeness work | Useful content/search intent |
| --- | --- | --- | --- |
| `architecture-and-errors` | Consistent horizontal layers, direct Server Component service calls, client wrappers, capability checks, translated error catalog. Checked `AGENTS.md`, `src/services/authz.ts`, `src/config/plans.ts`, error contracts. | Keep the exact exception for the Better Auth adapter; add a small runnable extension example rather than broadening architecture claims. | Adding a feature to a Next.js SaaS starter; user-safe API errors. |
| `customize-your-product` | Correctly introduces tracked config, presets, locales, customizer, public-env agreement. | Correct legal identity ownership; remove the contradictory absent-brand-configurator claim; Chinese must include `config:check` and `config:check:prod`; distinguish tracked support from public URL overrides. | Next.js SaaS branding, languages, theme and environment configuration. |
| `quick-start` | Current guided setup, Garage, three apps plus worker, isolated databases, doctor, seed/reset and E2E are represented. Checked setup/development runbooks and scripts. | Link canonical development profile and configuration reference; include browser installation prerequisite for a fresh Playwright setup; keep private Studio first-user setup explicit. | Run an open-source Next.js SaaS starter locally with Docker. |
| `account-ledger` | Consistent organization pool, FEFO allocation, append-only corrections, split-row presentation and deterministic replay keys. | Add one concrete charge/refund example with the existing service signature and state the expiry terms inherited by refunds. | SaaS credit ledger, idempotent usage billing, refunds. |
| `authentication-and-admin` | Consistent Better Auth/customer versus operator roles, Google opt-in, captcha, local auth-link policy, MFA and tenant identity. | Add current confirmed-enrollment/0037 migration guidance and links to shared-env/Admin origin setup. | Better Auth for Next.js SaaS; operator MFA setup. |
| `content-studio-and-marketing` | Studio and campaign ownership already covered; isolated Payload database, SaaS-owned recipients/consent and signed gateway are correct. | Expand initial private administrator setup, Studio-origin CORS/CSRF, media and revalidation config, scheduler distinction, scopes/API-key capture, upgrade migration and scheduled-event repair. No trusted bootstrap CLI exists in this starter. | Payload CMS for a Next.js SaaS; consent-aware marketing email. |
| `database-setup` | Correct explicit Drizzle migration release, expand/contract, advisory lock/checksum, integrity check and identity-versus-artifact relationships. | Include current auth migration and separate Payload migration references; name direct migration URL/profile rather than leaving it implicit. | Drizzle PostgreSQL migrations on Vercel; separate CMS database. |
| `organizations-and-teams` | Correct organization-first ownership, query transport, 72-hour invitations, seat caps, advisory lock and last-owner invariants. | Remove deletion from the list of active owner actions; explain disabled generic deletion versus future lifecycle work. | Organization tenancy and team invitations with Better Auth. |
| `plans-and-entitlements` | Catalog numbers, seven-day past-due grace, additive grants, highest tier, stacked subscriptions and manual overrides match configuration/resolver. | Add explicit distinction between cancellation at period end and a subscription whose status is already canceled; link env guide for server-only Prices. | SaaS feature gating, usage limits and Stripe plan mapping. |
| `storage-uploads` | Consistent private delivery, Garage default, named policies, minimum size cap, quota reservation, presigned flow and durable deletion. | Provide copied provider CORS examples or link exact pinned runbook; enumerate required browser headers/checksum behavior; test public-object rejection. Do not import companion-game object-tombstone behavior. | Private Cloudflare R2/S3 uploads in Next.js with quota and checksums. |
| `stripe-setup` | Correct independent subscriptions, owner-only checkout, idempotency, verified deduplicated events, yearly grants, reconciliation and unsafe portal fail-closed. | Enumerate exact event names and portal/Price environment keys in actionable setup; retain explicit absence of in-place plan/quantity updates. | Stripe subscriptions and webhook retries in a SaaS starter. |
| `account-data-lifecycle` | Correct API-only export/erasure, fresh session, grace period, ownership blockers, private JSON manifest, external deletion and pseudonymization. | Use “JSON manifest and linked files” rather than implying a downloadable ZIP/archive; retain explicit absent finished settings UI. | Account data export and deletion APIs in Next.js. |
| `analytics-and-consent` | Consent categories, production-only script mounting, versioned deny-default cookie, 182-day lifespan and Admin exclusion match source. | Keep vendor enablement separate from measurement plan; label linked public site privacy page as site policy, not the adopter product's policy. | GA4/AdSense consent in Next.js without early script requests. |
| `backups-retention-and-restore` | Backup manifest, restricted permissions, guarded scratch restore, current retention periods and financial exclusions match runbook. | Chinese omits optional `BACKUP_DATABASE_URL` and automatic versus manual retention distinction; add explicit scheduling/ownership examples where useful. | PostgreSQL backup/restore drills for a SaaS. |
| `containers-and-launch-readiness` | Four production images, runtime-only secrets, separate migrations, readiness and composed launch check are represented. | Distinguish optional Studio image from SaaS-only profiles; link exact profile import/build arguments; include separately applied Studio migration when deployed. | Docker deployment of Next.js web, Admin, worker and Payload CMS. |
| `deployment-and-security` | Origins, serverless pooling, trusted rate-limit identity, cron, readiness, security headers, restore and smoke testing are represented. | Correct unconditional current production requirements; include separate worker and optional Studio launch paths; add canonical profile/import recipe and current migrations. | Deploy a Next.js SaaS to Vercel with worker, PostgreSQL and Redis. |
| `email-service` | Resend/React Email, synchronous auth email, queued product mail, local-link restrictions and provider idempotency match source. | Link shared sender/gateway settings and make provider-boundary replay limitation clear where a real adapter cannot guarantee dedupe. | Resend transactional email in Next.js SaaS. |
| `jobs-and-readiness` | PostgreSQL claims, five-minute leases, 20/40-second defaults, retries, retention, protected GET route and read-only readiness are consistent. | Bring every locale's runner advice and job inventory into agreement; describe configurable worker budgets below the lease without requiring a queue-storage change. | PostgreSQL background jobs, Vercel cron and a dedicated Node worker. |
| `logging` | Redacted JSON logging, optional OTLP request/job spans, trace IDs, readiness threshold and actionable alerts are represented. | Include concrete redacted log/trace example and exact env/profile link; avoid claiming a shipped collector/dashboard. | OpenTelemetry and Pino observability for Next.js/background workers. |
| `notifications-slack` | Correct distinction between durable Stripe alerts and best-effort legacy storage/subscription helpers. | Keep limitations explicit; add a deterministic queued-notification example rather than promising all alerts are durable. | Reliable Slack alerts with a PostgreSQL job queue. |
| `testing-and-ci` | Test-tier boundaries, auth-before-data, money replay, real DB/Redis and E2E flow described. | Update opt-in infrastructure collection: no URLs means project omitted before imports; Redis-only avoids Postgres/auth imports; CI requires both. Include browser install step and current MFA migration regression scope. | Testing auth, Stripe retries, storage and workers in a Next.js SaaS. |
| `image-generation-workflow` | Correct five-credit task/spend/job identity, bounded provider/compensation attempts and private output chain. | Correct adapter-only production claim and SVG-specific DTO; English default path is `/tasks/image-generation`. | Building idempotent paid AI tasks with credits, jobs and private storage. |
| `referrals` | Detailed first-touch, eligibility gaps, commission mode, cash-only accounting, missing payouts/localization and source boundaries match source. | Maintain as an opt-in foundation; clarify that every enabled referral route still needs operational eligibility/abuse choices. | Implementing referral attribution and affiliate reward accounting. |
| `reservations-feature` | Default-disabled 35-minute hold, Stripe confirmation, PostgreSQL exclusion/advisory locking, timezone and service-catalog gaps match source. | Add exact catalog bootstrap example and hosted testing procedure; do not advertise a production catalog manager. | Stripe booking reservations that prevent overlapping time slots. |
| `text-to-video-tasks` | Correct local synchronous demo, one-credit-per-second example, quotas, credits and need for async real provider. | Correct adapter-only production claim; document page/API/service admission work and provider erasure adapter when remote artifacts persist. | Metered text-to-video feature architecture and durable provider integration. |
| `admin-console-operations` | Operators, organization evidence, fulfillment/reconciliation, moderation, audit and job recovery are covered. | “Write tools are limited to…” omits job retry/cancel although the final section describes them; make list internally consistent; link Publishing/Studio where configured. | SaaS Admin operations for billing, credit recovery and jobs. |
| `admin-console-setup` | Roles versus membership, exact-account promotion, MFA, dedicated origin, explicit shell-value precedence and full production validator are covered. | Canonical local profile is `.env.development.local`, not the legacy `.env`; explicitly replace auth URLs when importing Web variables into Admin; add current enrollment migration. | Deploying a secure Next.js Admin console with Better Auth MFA. |

## Existing editorial: page-by-page matrix

| Slug | Intent and relationship to docs | Source/content corrections | Recommendation |
| --- | --- | --- | --- |
| `about` | Product inventory and evaluation overview; overlaps landing page and fit-check article. | Three apps plus worker share one starter repository; public site is a separate repository, not a “fourth repository.” Studio is already listed. | Keep a concise inventory hub and route concrete task questions to docs; add the verified DojoClip use case. |
| `affiliate-and-reward` | Business/program choice, distinct from setup guide despite overlapping defaults. | First-touch/manual rewards/no payouts are accurately scoped. | Lead with the decision tree and an example refund/fraud policy; link one canonical configuration guide rather than repeat its setup. |
| `anatomy-of-modern-saas` | Architecture tradeoffs and adoption strategy; substantial overlap with architecture contract. | No material boundary contradiction found. | Keep reasoning/tradeoffs here and exact commands/contracts in docs; add a concrete paid feature trace. |
| `five-credit-task-tests-the-whole-saas` | Strongest distinctive engineering story: failure recovery across paid tasks, worker, storage and compensation. | Correct adapter-only production advice and narrow output DTO. | Preserve as an evidence-led article; show request identity and crash recovery instead of expanding into generic AI marketing. |
| `web-authentication-deep-dive` | Product auth choices and onboarding journey versus exact configuration doc. | Add confirmed MFA enrollment/current migration information; current signup guards preserve translated blocked responses after auth upgrade. | Answer a specific Better Auth/multi-tenant question and point to executable setup tests. |
| `what-is-middleware` | Source-specific routing mechanics and tab-local tenancy; body already more useful than a generic middleware explainer. | No material contradiction found in middleware ownership. | Preserve the legacy slug for links; make title/description explicit about Next.js locale routing, workspace query context and request IDs. |
| `why-use-a-saas-template` | Fit/avoid/adoption decision; overlaps about and homepage. | Fit check still says “both applications” after adding Studio; adapter-only assumptions should not return; clarify optional domains still affect shared production validation. | Focus on tradeoffs and inspectable use cases; avoid a second generic feature catalog. |

## Locale anomalies observed directly

- Chinese `customize-your-product` lacks `pnpm config:check` and
  `pnpm config:check:prod` in the verification commands, even though English
  includes them. Its outdated legal identity and absent-configurator claims
  repeat the English problem.
- Chinese `content-studio-and-marketing` omits the English automation/service
  account explanation and final related links. It compresses migration commands
  into prose. This is a completeness difference, not evidence that Studio is
  absent from the locale.
- Chinese `backups-retention-and-restore` leaves out `BACKUP_DATABASE_URL` and
  does not distinguish automatic job/provider-receipt pruning from explicit
  auth/audit report/apply. Readers cannot infer those operational choices from
  a list of retention durations alone.
- Chinese `testing-and-ci` leaves out the infrastructure opt-in detail and the
  explicit disposable external-E2E safeguards present in English. Keep these
  controls available in the localized body, not only an English runbook.
- Chinese, Spanish, French, and Japanese job-guide introductions disagree with
  their own portable-worker tables and omit marketing/image job types.
- Every reviewed language of the two AI docs and five-credit editorial article
  incorrectly presents adapter replacement alone as sufficient for production.
  Every organization guide's role table lists deletion as an active owner
  action. These were common-source mistakes, not translation errors.
- Shorter localized pages are not automatically lower quality. Preserve
  concise native wording, but keep executable commands, credential boundaries,
  safety gates, migration actions and limitations equivalent across locales.

## Content SEO recommendations, separate from measured facts

The existing body content is mostly an adopter manual: it is useful after a
reader has selected Sushi, and comparatively little helps someone discover it
while searching for a concrete stack/problem. Many titles are generic nouns
(“Quick Start,” “Stripe Billing,” “Transactional Email”). A useful next step is
to make the stack and task clear where natural and strengthen evidence in the
body; changing keyword arrays alone does not supply that evidence.

1. **Establish a clear entry query and connected feature clusters.** Use an
   open-source Next.js SaaS starter overview as the entry page. Link directly to
   Better Auth organizations/MFA, Stripe subscriptions and replay, a credit
   ledger, private R2/S3 upload, PostgreSQL jobs, and Payload CMS. Keep one
   primary page for each task and let editorial articles explain its tradeoffs.
2. **Publish the missing configuration guide first.** Explain tracked
   `saas.config.json` versus deployment variables, exact profile loading,
   generated independent secrets, Web/Admin values that must agree, distinct
   auth URLs, direct migration URL, Studio isolation, and genuinely optional
   providers. This answers a real adoption blocker discovered during review.
3. **Use DojoClip as concrete evidence.** Describe only verifiable product
   behavior and the actual shared foundation; link `https://dojoclip.com/`.
   Explain what the adopter added and what the starter supplied. Do not infer
   revenue, traffic, customer counts, release quality, or provider workflows
   from the mere fact that it is a use case.
4. **Show outputs readers can inspect.** Add screenshots of the actual local
   UI, a request/response example, a task state trace, or a redacted failure
   recovery log to the most distinctive guides. Prefer these over lists of
   technologies already repeated on the homepage.
5. **Give overlapping content distinct jobs.** About inventories the product;
   fit-check helps choose it; architecture article explains tradeoffs; docs
   provide steps. Avoid writing multiple pages whose principal value is the
   same feature list, and avoid making translated variants compete with an
   English fallback body.
6. **Choose expansion from observed queries after collecting evidence.**
   Search Console can separate discovery, index coverage, impressions, clicks,
   countries, queries and pages. Compare the periods before and after release,
   annotate substantive changes, and inspect pages with impressions but weak
   click response. No ranking or traffic uplift is promised by this audit.
7. **Treat synchronization as a release contract.** Maintain a single immutable
   source revision for generated source links; update public instructions and
   all locales when migration/configuration ownership changes; run content
   checks and verify the live deployed revision. Do not bump every page date
   merely to imply freshness.

## Focused patches made by the content reviewer

Five existing slugs were updated in **all five locales** (25 MDX files):

- `image-generation-workflow`: production admission, real output type/file
  metadata requirements, and correct default English route.
- `text-to-video-tasks`: explicit production page/API/service admission work.
- `organizations-and-teams`: owner billing permission versus unavailable
  organization-deletion workflow.
- `jobs-and-readiness`: portable-worker recommendation, configurable budgets
  that remain below the lease, and complete localized job inventory.
- `five-credit-task-tests-the-whole-saas`: correct production provider-adoption
  explanation while preserving recovery contracts.

Only materially changed pages received `updatedAt: 2026-10-05T00:00:00.000Z`.
No application runtime, migrations, credentials, or repository history were
changed by this reviewer. Source-pin replacement and the other content patches
belong to the parent release work.

Scoped `git diff --check` passed for these 25 files. The first global
`pnpm content:check` reached all locale inventories and failed only on five new
deployment links to `environment-configuration` before the parent had created
that page. The final combined release must rerun content checks, types, tests,
lint, and build after all new pages and global source links are present.

## Final semantic cleanup of the combined patches

The content reviewer subsequently checked the root-edited customization,
authentication, database, deployment, testing, Admin setup, About, and fit-check
pages across all five locales. This cleanup changed 33 files and preserved the
source pins for the parent release's final synchronization:

- Production deployment selects one queue runner and still supplies
  `CRON_SECRET`; HTTP cron and the dedicated worker are alternatives.
- The required Stripe/private-storage controls and CSP guidance remain visible
  in the checklist. Conditional provider wording no longer contradicts the
  shared startup validator.
- Migration application precedes the strict final check. A pending migration is
  not a successful promotion gate; backups, staging proof and compatible old/new
  code remain part of release readiness.
- Every testing locale explains pre-collection infrastructure opt-in, the safe
  test database name, exact coverage scope, Chromium installation and disposable
  external E2E controls. The new opt-in explanation does not erase the existing
  test/coverage commands.
- Imported Admin variables explicitly set both auth URLs to the Admin origin
  while keeping the customer origin in `NEXT_PUBLIC_WEB_URL`; the MFA migration
  is linked to operator deployment.
- The fit-check articles mention production admission/output validation when
  replacing AI mocks. Japanese now opens the three-app evaluation and describes
  the two repositories correctly. Spanish/French overview prose no longer
  repeats the independence wording.
- Product customization accurately states that the production configuration
  gate requires a real support email.

Scoped whitespace checks passed after cleanup. A subsequent global content check
was still blocked by the parent's intentionally pending source-pin replacement
and the unfinished ES/FR/JA environment-guide translations. These are release
assembly dependencies, not validation passes; rerun the full gate once that
assembly is complete.
