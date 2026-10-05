# Spanish and French content audit — 2026-10-05

## Evidence and reading coverage

Read the complete frontmatter and body of all **68 Spanish and French pages**:
27 documentation pages and seven blog pages in each language. No page was
counted from a title, search match, or frontmatter-only scan. One truncated
French text-to-video output was reread in full before it was counted.

The reviewed documentation initially cited starter `2a1a04a`. The current
source of truth is immutable starter commit
[`d8b8508`](https://github.com/PansaLegrand/sushi-saas-template/tree/d8b8508).
This audit records the initial passages and required corrections; the parent
documentation update owns the actual translated content patches. Line numbers
below describe the initial files and may move after those patches.

Source review included the starter's root README, AGENTS, scripts, canonical
environment examples, `saas.config.json`, Admin/Content Studio READMEs, deployment
guide, co-versioned development/customization, jobs, database, storage, plans,
containers, backups, release and marketing contracts, and changes since the old
source pin. No real environment values were read.

## Corrections shared by both languages

### 1. Product identity and legal configuration contradict the customizer

`customize-your-product.mdx:56` tells readers to fill legal identity directly in
the runtime projection:

- Spanish: “Rellena `LegalData` en `src/config/legal.ts`”.
- French: “Complétez `LegalData` dans `src/config/legal.ts`”.

The legal entity, address, contacts, governing law, and effective date belong in
the tracked `legal` section of `saas.config.json`, populated through
`pnpm customize`. Provider/policy text still requires product-specific review in
`src/config/legal.ts` and the legal pages. Do not collapse identity and policy
text into one configuration instruction.

At line 83 the same pages say the starter has no brand configurator:

- Spanish: “El starter no incluye configurador de marca”.
- French: “Le starter ne fournit ni configurateur de marque”.

Those statements contradict the earlier working `pnpm customize` recipe.
Remove that limitation. Keep the real limits: no user runtime preset picker,
reviewed legal policy, or environment-controlled support address. Support is a
tracked `product.supportEmail` value; it is not an environment override.

The verification blocks also omit `pnpm config:check` and
`pnpm config:check:prod`, already present in the English guide. Add both so
localized readers can validate tracked identity and launch placeholders.

Sources: [`docs/customization.md`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/docs/customization.md),
[`src/config/product.ts`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/src/config/product.ts),
[`src/config/site.ts`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/src/config/site.ts).

### 2. Production setup implies required providers can be omitted

`deployment-and-security.mdx:33–34` describes Stripe and storage as conditional:

- Spanish: “Price IDs si hay facturación” and “URLs breves si hay storage”.
- French: “Price IDs si facturation” and “URL courtes si stockage”.

The shipped production validator requires Stripe private/webhook keys, a safe
Billing Portal ID, all four primary recurring Price IDs, Resend and `EMAIL_FROM`,
private-storage bucket/credentials, and Redis. An empty credential does not
disable one of those systems. A product that removes a domain must remove its
validation and runtime consumers together.

The localized deployment pages also require a five-minute cron unconditionally,
while the jobs/containers pages document a portable worker as an alternative.
Explain the deployment choice consistently: configure at least one default
queue runner, using authenticated HTTP cron, a bounded scheduled process, or the
dedicated production worker. Preserve `CRON_SECRET` because the shared validator
requires it even when the worker is selected.

Add the explicit environment-profile workflow from the current starter:
`.env.development.local`, `.env.production.local`,
`pnpm env:setup:prod`, `pnpm env:check:prod`, and
`pnpm env:check:prod -- --process` for exported platform values. The current
localized quick start mentions profiles but does not name them or provide the
production configuration commands.

Sources: [`src/lib/env.ts`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/src/lib/env.ts),
[`DEPLOYMENT.md`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/DEPLOYMENT.md),
[`docs/background-jobs.md`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/docs/background-jobs.md).

### 3. Local Admin setup still teaches the legacy profile

`admin-console-setup.mdx:37` says:

- Spanish: “Define el origen local de administración en `.env`”.
- French: “Définissez l’origine locale de la console dans `.env`”.

Use `.env.development.local` for a fresh clone and explain `.env` as a supported
legacy profile. Keep the current warning that an explicitly exported
`BETTER_AUTH_URL` or `NEXT_PUBLIC_AUTH_BASE_URL` overrides the inferred admin
origin. Copying web variables into a hosting project must not leave the Admin
auth URL pointing at the customer origin.

Source: [`apps/admin/next.config.ts`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/apps/admin/next.config.ts).

### 4. Database and auth deployment omit the new MFA migration

The Spanish/French auth, Admin, database, and deployment guides omit migration
`0037_neat_excalibur.sql`, required by the current Better Auth adapter. Apply
this expand migration before deploying the updated adapter. It adds `verified`
(false by default), `failed_verification_count` (zero), and nullable
`locked_until`. Only already confirmed enrollments tied through Better Auth's
`users.id` become verified; pending or orphaned secrets stay unverified.

In both database guides the production code block uses plain
`pnpm db:integrity`; use `pnpm db:integrity -- --production` to load the
production profile. Describe relationship **and value/nullability** findings,
not only orphan checks.

The Spanish launch sentence says `db:check:prod` should show the expected pending
set; the French equivalent only says expected migrations. Clarify the sequence:
the preflight identifies pending work and fails, the separate apply runs, and
the final check must exit zero with no pending/drifted/unexpected migrations.

Sources: [`0037_neat_excalibur.sql`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/src/db/migrations/0037_neat_excalibur.sql),
[`docs/database.md`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/docs/database.md),
[`scripts/check-data-integrity.ts`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/scripts/check-data-integrity.ts).

### 5. Content Studio exists, but its operator recipe is incomplete

Both localized `content-studio-and-marketing.mdx` pages are 36 lines and describe
the correct separate database/auth/customer-data boundary. The feature is
already covered; claiming it is entirely absent would be inaccurate.

Expand the guide with usable examples rather than only feature descriptions:

- Name the separate development/production Studio profiles, `PAYLOAD_SECRET`,
  `CONTENT_STUDIO_URL`, CORS origins, marketing gateway URL, shared gateway
  secret, optional website-revalidation secret, Studio job scheduler secret,
  and production `CONTENT_STORAGE_*` block. Local disk is unsuitable for a
  read-only or ephemeral production container.
- Explain the service-account header
  `Authorization: service-accounts API-Key <key>`, scoped access and mutation
  `Idempotency-Key`, and that API keys must be captured when generated.
- Apply `20261005_024231_payload_security_fields` through
  `pnpm studio:migrate` before deploying Payload 3.90.2. Nullable password-reset
  and media-key fields preserve existing rows; the migration does not move
  uploaded objects.
- Re-create pending scheduled publish/unpublish events after the Payload
  upgrade because their user reference now includes its authentication
  collection.
- Keep Resend endpoint signing secrets provider-issued; they are not arbitrary
  generated gateway credentials. The SaaS retains authoritative recipients,
  consent, suppression, unsubscribe and provider-delivery records.

Sources: [`docs/content-platform.md`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/docs/content-platform.md),
[`apps/content-studio/.env.example`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/apps/content-studio/.env.example),
[`docs/marketing-email.md`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/docs/marketing-email.md).

### 6. Jobs advice and type inventory lag the complete runner table

`jobs-and-readiness.mdx:18` still suggests HTTP scheduling on every non-Vercel
host:

- Spanish: “En otro proveedor, llama al mismo endpoint autenticado desde su
  programador”.
- French: “Ailleurs, appelez le même endpoint authentifié depuis le planificateur
  de la plateforme”.

Prefer the dedicated worker for VM/container/Kubernetes, retain HTTP cron as an
explicit scheduler alternative, and require `--production` for the portable
runner. Explain that it enforces the same production validator as web/Admin.

The type lists at line 28 omit marketing delivery and the current five-credit
image workflow. Add both to match the English guide and actual handlers.

The storage, email, Slack, and lifecycle pages also use cron as shorthand for
all durable execution. Readers using the portable worker should understand that
it drains those jobs and performs the shared maintenance work too.

Source: [`docs/background-jobs.md`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/docs/background-jobs.md).

### 7. Test instructions omit infrastructure collection boundaries

Both `testing-and-ci.mdx` pages correctly describe six tiers, actual local
Garage/Playwright coverage, and immutable coverage thresholds. Add the current
opt-in behavior: without `TEST_DATABASE_URL` and `TEST_REDIS_URL`, Vitest omits
infrastructure suites before module collection. Redis-only configuration
collects only its own test; CI collects all infrastructure and rejects missing
service URLs. Keep test URLs absent from production deployments.

Source: [`tests/README.md`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/tests/README.md),
[`vitest.config.mts`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/vitest.config.mts).

### 8. About confuses independent applications with repositories

`content/blog/<locale>/about.mdx:40` says:

- Spanish: “El sitio público es un cuarto repositorio desacoplado”.
- French: “Le site public est un quatrième dépôt indépendant”.

The customer app, Admin, Content Studio, and worker are in one starter
repository. The website is a separate repository, not a fourth repository.
Use “un repositorio independiente” / “un dépôt indépendant” without a count.

Source: [`README.md`](https://github.com/PansaLegrand/sushi-saas-template/blob/d8b8508/README.md).

## Page-by-page reading ledger

Every row below was read in full in **both** Spanish and French. “Aligned” means
no additional factual drift was found in its reviewed body; it does not certify
the deploying product or prove search performance.

| Collection | Slug | Result of full ES and FR reading |
| --- | --- | --- |
| Docs | quick-start | Current stack aligned; name environment profiles and keep production setup discoverable |
| Docs | architecture-and-errors | Aligned; route writes already described as service-owned |
| Docs | customize-your-product | Correct legal identity, brand-configurator contradiction and missing config gates |
| Docs | account-ledger | Aligned: pooled immutable ledger, expiry, locking and replay |
| Docs | authentication-and-admin | Add schema-first MFA upgrade note |
| Docs | content-studio-and-marketing | Correct boundary present; add configuration, automation and upgrade instructions |
| Docs | database-setup | Correct production profile, integrity scope, MFA migration and final migration-check result |
| Docs | organizations-and-teams | Aligned: query switcher, roles, seats and last-owner guards |
| Docs | plans-and-entitlements | Aligned; French omits English legacy Stripe aliases detail, which remains useful for existing deployments |
| Docs | storage-uploads | Aligned behavior; portable worker should be accepted for cleanup and service ownership can be named |
| Docs | stripe-setup | Aligned behavior; name service dispatcher when explaining extensions |
| Docs | account-data-lifecycle | Aligned; worker/cron wording should allow either runner |
| Docs | analytics-and-consent | Aligned; subprocessor/policy editing remains in legal runtime config, unlike tracked identity fields |
| Docs | backups-retention-and-restore | Aligned: guarded scratch restore and explicit retention |
| Docs | containers-and-launch-readiness | Aligned topology; “worker and scheduler active” should allow the selected runner mode |
| Docs | deployment-and-security | Fix conditional required providers, add profiles and schema-first upgrade steps |
| Docs | email-service | Aligned, with cron shorthand to clarify |
| Docs | jobs-and-readiness | Fix non-Vercel advice, expand type list and document production-profile enforcement |
| Docs | logging | Aligned: optional OTLP, stdout, redaction and queue degradation |
| Docs | notifications-slack | Aligned: durable required alerts versus legacy best effort; clarify runner alternatives |
| Docs | testing-and-ci | Add current infrastructure collection and CI opt-in contract |
| Docs | image-generation-workflow | Aligned: deterministic five-credit task, private output and compensation budget |
| Docs | referrals | Aligned: disabled, first touch, pending cash records, no automatic payout |
| Docs | reservations-feature | Aligned: opt-in catalog, 35-minute holds, webhook confirmation and overlap constraint |
| Docs | text-to-video-tasks | Aligned: local synchronous mock and recommendation to use image workflow for durable implementation |
| Docs | admin-console-operations | Aligned actual surfaces; jobs recovery was appended and is present |
| Docs | admin-console-setup | Replace fresh-clone `.env` recipe; add MFA migration and correct explicit auth-origin overrides |
| Blog | about | Correct “fourth repository” statement; Content Studio and worker already represented |
| Blog | affiliate-and-reward | Aligned first-touch/pending commission and incomplete payout scope |
| Blog | anatomy-of-modern-saas | Aligned horizontal layers and current paid image reference |
| Blog | five-credit-task-tests-the-whole-saas | Aligned reliability example and provider-adapter boundary |
| Blog | web-authentication-deep-dive | Aligned behavior; link to MFA upgrade before deployment |
| Blog | what-is-middleware | Aligned locale/request-ID/organization transport and server authorization |
| Blog | why-use-a-saas-template | Aligned adopter tradeoffs; include all three apps in quick evaluation wording |

## Localization and search-content observations

The translations are readable and preserve the central ownership and safety
boundaries. Their operational additions are substantially shorter than English,
especially Content Studio, jobs, storage, and testing; route-specific commands
and configuration are more useful expansion targets than generic feature lists.

Several articles have broad titles about how Sushi SaaS works. A localized
reader searching for “Stripe idempotency Next.js”, “Payload CMS SaaS” or
“Better Auth MFA” needs a title, opening answer, working example and linked
source that explicitly address that task. Translate the user task and
explanation while keeping exact package, command and environment identifiers.
Do not add invented search-volume numbers, customer outcomes, or ranking
promises. This reading audit has no Search Console data and cannot determine
why existing pages receive few clicks.

Repin reviewed source links to `d8b8508` only alongside the relevant body
corrections. Update `updatedAt` for substantive changes and preserve original
publication dates. Future documentation review should treat the five locales as
one release unit, rather than updating only the English narrative.
