# Optional Google Analytics 4 adoption measurement

Analytics ships **disabled**. Use an existing GA4 web stream for this website;
do not reuse another product's property just because its ID is available.
This integration does not add installation telemetry, a server event proxy,
Google Ads, or a Google Tag Manager container.

Website actions measure evaluation interest. A GitHub click or copied command
does not prove a clone, star, successful installation, deployed product, or
retained developer.

## Configure the existing property before activation

1. In Google Analytics, verify that the web stream belongs to this website and
   copy its **G-… measurement ID**. Do not use a Universal Analytics UA-… ID,
   Tag Manager GTM-… container, another product's stream, or an API secret.
2. Review **Admin → Data streams → this web stream → Enhanced measurement**.
   Disable automatic measurement for this integration, including browser-history
   pageviews, outbound clicks, search, form interactions, downloads, scroll and
   video events. Also review the Google tag's **Manage automatic event detection**
   settings. Google's supported `send_page_view: false` setting suppresses the
   default config pageview; it is not a universal off-switch for all property-side
   enhanced events. This repository cannot inspect or assert those account settings.
3. Review linked Google tag destinations and advertising settings. This adapter
   targets one GA4 measurement ID, grants analytics storage only, and disables
   Google signals and advertising personalization. Do not attach Ads destinations
   or additional tags to this integration. Review the property's data retention
   and access settings independently; cookie expiry is not GA data retention.
4. Review the localized website privacy notice and consent wording. Then set both
   public build-time values and rebuild:

   ```dotenv
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YOURSTREAMID
   NEXT_PUBLIC_ANALYTICS_HOSTNAME=www.sushisaas.com
   ```

5. After deployment, use a consenting visit to verify the **correct** property's
   realtime reports. Browser request inspection and local tests do not prove
   ingestion into that property. Do not send automated test traffic to it.

Invalid/missing IDs or hostnames disable measurement. The browser hostname must
exactly match the configured hostname; previews show no analytics prompt or
settings and load no Google tag. A measurement ID is public configuration, not a
secret. Keep GA API credentials out of `NEXT_PUBLIC_` settings.

Official references: [basic consent mode](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic),
[GA4 configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config),
[Enhanced Measurement](https://support.google.com/analytics/answer/9216061),
and [Google tag settings](https://support.google.com/analytics/answer/12131703).

## Consent and withdrawal

The integration uses **basic consent mode**: no Google script, denied-consent
ping, or event is sent before explicit opt-in. Decline and allow have equal
prominence. Events that happened before permission are discarded, not replayed.
Only after opt-in does the adapter load `gtag.js` and configure this one stream.

Consent is stored as `accepted` or `declined` under
`sushi:analytics-consent:ga4:v1`. The key is specific to this provider: an earlier
Plausible choice does not authorize Google Analytics. If local storage is blocked,
the choice lasts only for the current document. Storage changes synchronize
between tabs; focus and visibility changes recheck browser privacy signals.
Do Not Track and Global Privacy Control override earlier permission.

The footer settings button allows withdrawal. On routes without a footer button,
the provider supplies a small fixed control with the same localized label. The
panel is non-modal and restores keyboard focus when closed.

Withdrawal first sets Google's documented `ga-disable-MEASUREMENT_ID` flag,
then denies analytics and advertising consent. It stops future manual events
and clears pending events if the script has not finished loading. A tag download
that began with permission may finish after withdrawal; the disable flag remains
set. Accessible host-only `sushi_ga` and `sushi_ga_*` cookies are expired. Cookies
belonging to unrelated integrations are left alone. A loaded script cannot be
unexecuted, and withdrawal cannot retract data already sent to Google. Removing
this adapter or changing providers requires reviewing any other tags separately.

The [Google privacy controls](https://developers.google.com/tag-platform/security/guides/privacy)
describe the disable flag and advertising settings.
Google's [cookie customization guide](https://developers.google.com/tag-platform/security/guides/customize-cookies)
documents that prefix `example` changes `_ga` to `example_ga`; applying that rule
to the [GA4 cookie names](https://support.google.com/analytics/answer/11397207)
produces the two `sushi` cookie families cleaned up here.

## Data boundary

The adapter uses one named data layer, `sushiAnalyticsLayer`. Do not add a second
GA snippet, GTM container, or tracking plugin to the website. All manual events
use fixed event/property catalogs; unrecognized properties are dropped.
Google's [data layer guide](https://developers.google.com/tag-platform/devguides/datalayer#rename_the_data_layer)
documents the matching `l` script parameter used by this adapter.

`page_location` contains only the configured hostname and a public route
category. Locale is retained; arbitrary documentation/article slugs collapse to
`/docs` and `/blogs`, with `/docs/quick-start` kept distinct. `page_title` is that
safe path, `page_referrer` is empty, and `ignore_referrer` is true. The script load
uses `referrerPolicy: no-referrer`. Neither form contents, email addresses, raw
outbound URLs, raw search/query strings, arbitrary slugs nor installation signals
are included in the adapter's events.
On a route-category change, the adapter updates the stream-level configuration
with `send_page_view: false`, then emits the explicit pageview. This keeps
automatic engagement context current without adding a second config pageview;
global `set` values alone would have lower precedence than the initial config.

Google still receives the visitor's IP address and browser headers over the
network. Its SDK also collects standard session/device information and creates
analytics identifiers after consent. Do not describe this as anonymous,
identifier-free, IP-free, or a guarantee about every behavior configured in the
Google account. Property-side automatic events must be reviewed as described
above before activation.

The adapter configures cookies with prefix `sushi`, host-only scope, path `/`,
`SameSite=Lax;Secure`, a 30-day lifetime and `cookie_update: false`. Advertising
storage, ad user data and ad personalization remain denied. `allow_google_signals`
and `allow_ad_personalization_signals` are false; advertising data redaction is on
and URL passthrough is off.

## Events and campaign labels

Every manual event includes a fixed `locale` property from the five supported
site languages. The client API name `pageview` maps to GA4's `page_view`.

| GA4 event | Required additional property | Meaning |
| --- | --- | --- |
| `page_view` | none | A permitted route seen after opt-in |
| `tour_viewed` | none | The product tour became visible |
| `tour_tab_selected` | `tab`: `workspace`, `billing`, `credits`, `jobs`, `admin` | An explicit preview selection |
| `quickstart_opened` | `source` | A Quick Start call to action was activated |
| `setup_command_copied` | `profile`: `core`, `operations`, `publishing` | A clipboard write succeeded |
| `github_opened` | `source` | A repository link was activated |

`source` is one of `hero`, `header`, `footer`, `tour`, `quickstart`, `closing`,
`docs`, or `article`. Unknown events or invalid required values drop the event.
Events explicitly use `send_to` for the configured measurement ID.

Optional attribution accepts only these exact query values:

- `utm_campaign`: `launch`, `billing-recovery`, `core-quickstart`, `dojoclip-case-study`
- `utm_source`: `github`, `hacker-news`, `devto`, `reddit`, `linkedin`

They become the custom properties `site_campaign` and `site_campaign_source`.
Every other value, duplicate parameter and ad click ID is discarded by the
adapter. The original query is not sent as `page_location`. Campaign labels are
read only for a consented event and are never persisted; navigation that removes
the query loses that attribution. This is deliberately limited campaign
measurement, not cross-session attribution.

In GA4, register useful event-scoped custom dimensions for `locale`, `source`,
`tab`, `profile`, `site_campaign` and `site_campaign_source` before relying on
those report breakdowns. Mark only meaningful actions as key events. A copied
command is still not a successful installation.

## CSP and browser behavior

The shipped Next.js policy adds the following **exact** origins only when both
configuration values are valid:

- `script-src`: `https://www.googletagmanager.com`
- `connect-src`: `https://www.googletagmanager.com`, `https://www.google-analytics.com`,
  `https://region1.google-analytics.com`

It does not add wildcard allowlists, Ads, DoubleClick, frames or Google Fonts.
Existing site policy directives remain unchanged. If the hosting platform adds
another CSP, its restrictions must also permit these origins. The exact list
supports the scoped GA4 integration; additional account-linked tags or future
Google endpoints may be blocked. Inspect a documented need before extending the
list; do not broaden it to work around an unexplained request. Google's broader
[CSP guide](https://developers.google.com/tag-platform/security/guides/csp)
also covers Ads and Tag Manager features that this website does not enable.

The script is asynchronous. Links and clipboard actions never wait for it, and
provider failures do not prevent navigation. Consented events can queue while
the script loads, but there is no durable queue or replay of pre-consent actions.
GA owns network delivery; ad blockers or navigation can drop measurements.

## Component integration

`AnalyticsProvider` is mounted under the localized provider with translated
`copy` and a localized privacy link. `AnalyticsSettingsButton` is in the footer;
its registration prevents duplicate floating controls on those routes.

Navigational links use catalogued data attributes:

```tsx
<Link href="/docs/quick-start" data-analytics-event="quickstart_opened" data-analytics-source="hero">
  Start locally
</Link>
```

Other interactions call `trackAdoptionEvent` after the action succeeds:

```tsx
await navigator.clipboard.writeText(command);
trackAdoptionEvent("setup_command_copied", { profile: "core" });
```

## Validation without contaminating the existing property

`pnpm test` checks GA config and CSP, route/property/campaign allowlists,
provider-specific consent, no tag load before opt-in, withdrawal during and after
script loading, owned-cookie cleanup, DNT/GPC, preview isolation and blocked
storage. These are local policy/runtime checks, not provider ingestion proof.

For browser validation, use a synthetic `G-TEST123456` and `localhost` hostname,
intercept the Google script and all collection requests, and inspect
`window.sushiAnalyticsLayer` without allowing events to reach Google. Verify:

1. Fresh storage, decline, DNT, GPC and wrong-host previews make no Google request.
2. Acceptance produces one asynchronous script load and only sanitized commands.
3. Withdrawal sets the disable flag, denies consent and stops new manual events.
4. Settings remain keyboard accessible on home, docs, guides and legal pages.
5. Quick Start/GitHub navigation still works when the script fails to load.

After the real property and its account-side settings are verified, a separate
consented production smoke can establish ingestion. Interpret analytics as an
incomplete sample due to opt-in and browser blocking. Combine it with repository
traffic and voluntary setup feedback rather than equating clicks with adoption.
