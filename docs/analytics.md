# Optional adoption measurement

The site ships with analytics **disabled**. It has no installation telemetry,
analytics account, third-party tracker script, server event proxy, or event queue.
Website events describe evaluation actions; they do not prove a clone, successful
installation, GitHub star, active deployment, or retained developer.

## Enable deliberately

1. Create or use your own Plausible property for the exact production hostname.
2. Review the site's privacy notice and consent wording for that deployment.
3. Set these public build-time values and rebuild:

   ```dotenv
   NEXT_PUBLIC_ANALYTICS_PROVIDER=plausible
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=www.sushisaas.com
   ```

4. The shipped Next.js Content Security Policy adds `https://plausible.io` to
   **connect-src** only when both configuration values are valid. If your host
   also supplies a policy, allow that same origin there, preserving its existing
   restrictions. No analytics `script-src`, image, frame, cookie, or proxy
   allowance is needed.
5. Create custom event goals matching the names below in Plausible. Verify a
   consenting visit in the dashboard before relying on reports.

Both configuration values are required; an unsupported provider or invalid
hostname disables measurement. The browser hostname must exactly equal the
configured domain. Preview hosts stay silent and show no analytics controls or
consent prompt. These are public values,
not API keys; never place a Plausible Stats API credential in a `NEXT_PUBLIC_` value.

The adapter follows the [Plausible Events API](https://plausible.io/docs/events-api):
it posts JSON as `text/plain` directly from the visitor's browser. A read-only
OPTIONS check on 2026-10-22 returned 204 with wildcard CORS origin and POST support.
The request omits credentials and HTTP referrer, uses `keepalive`, and never
delays navigation. Provider or network failures are ignored; there are no retries.
A 202 response can still represent a dropped event. Dashboard verification remains
necessary; this repository's tests do not prove provider-side ingestion.

## Consent and data boundary

Nothing is sent before the visitor explicitly chooses **Allow analytics**.
Declining has equal prominence. A footer settings control lets the visitor
withdraw consent, and withdrawal stops subsequent events. Pages without that
footer automatically receive a small fixed settings button. It opens the same
non-modal settings panel and returns keyboard focus when closed. It cannot retract
requests already sent. Do Not Track and Global Privacy Control override an
earlier opt-in. Choices synchronize across tabs via the browser storage event.

Only `accepted` or `declined` is stored in local storage under
`sushi:analytics-consent:v1`, after a choice. There is no visitor ID or timestamp.
If storage is unavailable, the choice lasts for the current document only.
Removing this value asks again. No events from before consent are buffered or
replayed after consent.

Payloads have fixed event names and allowlisted properties. URLs contain only a
public route category, locale, and the configured hostname. Article/doc slugs are
collapsed to `/blogs` and `/docs`; `/docs/quick-start` remains distinct. No email,
free text, raw outbound URL, arbitrary slug, full referrer, query string,
fragment, or setup command text is transmitted. The network connection still
reveals the visitor's IP address and browser headers to Plausible. Do not describe
this integration as transmitting no personal data.

## Events and properties

Every event includes `locale` from the five supported site languages.

| Event | Required additional property | Meaning |
| --- | --- | --- |
| `pageview` | none | A permitted route seen after opt-in |
| `tour_viewed` | none | The product tour became visible |
| `tour_tab_selected` | `tab`: `workspace`, `billing`, `credits`, `jobs`, `admin` | An explicit preview selection |
| `quickstart_opened` | `source` | A Quick Start call to action was activated |
| `setup_command_copied` | `profile`: `core`, `operations`, `publishing` | A clipboard write succeeded |
| `github_opened` | `source` | A repository link was activated |

`source` is one of `hero`, `header`, `footer`, `tour`, `quickstart`, `closing`,
`docs`, or `article`. Unknown event names or invalid required properties drop
the event. Extra properties are discarded.

Optional campaign attribution accepts only these exact query values:

- `utm_campaign`: `launch`, `billing-recovery`, `core-quickstart`, `dojoclip-case-study`
- `utm_source`: `github`, `hacker-news`, `devto`, `reddit`, `linkedin`

They become `campaign` and `campaign_source` properties. All other values,
duplicate parameters, ad click IDs, and other query parameters are discarded.
Campaigns are read only when a consented event is sent and are never persisted.
They disappear when navigation removes the query; this intentionally provides
limited campaign attribution rather than a cross-session visitor history.
Adding a campaign means reviewing the catalog in `src/lib/analytics/policy.ts`.

## Component integration

Mount `AnalyticsProvider` once under the localized provider with localized
`copy` and `privacyHref`. Place `AnalyticsSettingsButton` in the persistent
footer. It renders nothing on deployments where analytics is disabled or the host
does not match. The provider detects registered settings buttons and supplies its
own fixed control on routes without one, including the documentation and guides.

For navigational links, use catalogued data attributes. The provider listens
without preventing the link's normal behavior:

```tsx
<Link href="/docs/quick-start" data-analytics-event="quickstart_opened" data-analytics-source="hero">
  Start locally
</Link>
```

For interactions, call `trackAdoptionEvent` only after the action occurs:

```tsx
await navigator.clipboard.writeText(command);
trackAdoptionEvent("setup_command_copied", { profile: "core" });
```

Do not use this API for forms, search terms, URLs, user records or installation
signals. A GitHub click is interest, not a verified star or installation.

## Validation

`pnpm test` checks the config, route/property/campaign allowlists, no pre-consent
network or storage, withdrawal, disabled deployments, hostname isolation,
DNT/GPC, blocked storage, and credential/referrer exclusion.

Before enabling a deployment, use browser request interception to verify:

1. Fresh storage, decline, DNT, and GPC produce no analytics requests.
2. Opt-in sends only the documented payload after the action occurs.
3. Quick Start and GitHub links navigate even when the provider is unavailable.
4. Footer settings are keyboard reachable; withdrawal stops new events.
5. Translated consent controls fit narrow screens.

Use interception for automated tests so fixtures never populate a real property.
Track changes in consented evaluation steps over time; opt-in and browser
blocking make the sample incomplete. Combine it with GitHub repository traffic
and voluntary setup feedback, without interpreting clicks as completed adoption.
