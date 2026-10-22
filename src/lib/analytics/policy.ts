/** This catalog is the entire analytics contract; caller-supplied text is never sent. */
export const adoptionEvents = {
  pageview: {},
  tour_viewed: {},
  tour_tab_selected: { tab: ["workspace", "billing", "credits", "jobs", "admin"] },
  quickstart_opened: { source: ["hero", "header", "footer", "tour", "quickstart", "closing", "docs", "article"] },
  setup_command_copied: { profile: ["core", "operations", "publishing"] },
  github_opened: { source: ["hero", "header", "footer", "tour", "quickstart", "closing", "docs", "article"] }
} as const;

export type AdoptionEvent = keyof typeof adoptionEvents;
export type AnalyticsConsent = "accepted" | "declined" | "unknown";
export type AnalyticsConfig = { provider: "plausible"; domain: string };
export const CONSENT_STORAGE_KEY = "sushi:analytics-consent:v1";
export const ANALYTICS_ENDPOINT = "https://plausible.io/api/event";

const campaigns = ["launch", "billing-recovery", "core-quickstart", "dojoclip-case-study"] as const;
const campaignSources = ["github", "hacker-news", "devto", "reddit", "linkedin"] as const;

export function analyticsCampaign(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  for (const [query, property, allowed] of [
    ["utm_campaign", "campaign", campaigns],
    ["utm_source", "campaign_source", campaignSources]
  ] as const) {
    const values = params.getAll(query);
    if (values.length === 1 && (allowed as readonly string[]).includes(values[0])) result[property] = values[0];
  }
  return result;
}

export function parseAnalyticsConfig(provider: string | undefined, domain: string | undefined): AnalyticsConfig | null {
  if (provider !== "plausible" || !domain) return null;
  const normalized = domain.trim().toLowerCase();
  // A domain is public configuration, never a URL, credential, path or query.
  if (normalized.length > 253 || !/^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63})$/.test(normalized)) return null;
  return { provider, domain: normalized };
}

export function analyticsConnectSrc(provider: string | undefined, domain: string | undefined): string {
  return parseAnalyticsConfig(provider, domain) ? "connect-src 'self' https://plausible.io" : "connect-src 'self'";
}

export function parseConsent(value: string | null): AnalyticsConsent {
  return value === "accepted" || value === "declined" ? value : "unknown";
}

export function privacySignalBlocksAnalytics(signals: {
  doNotTrack?: string | null;
  windowDoNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}): boolean {
  return signals.globalPrivacyControl === true ||
    [signals.doNotTrack, signals.windowDoNotTrack].some((value) => value === "1" || value === "yes");
}

export function mayTrack(config: AnalyticsConfig | null, consent: AnalyticsConsent, blocked: boolean): boolean {
  return config !== null && consent === "accepted" && !blocked;
}

export function isAnalyticsHost(config: AnalyticsConfig | null, hostname: string): boolean {
  return config !== null && hostname === config.domain;
}

/** Keep only public route categories. Never transmit arbitrary slugs, queries or fragments. */
export function analyticsPage(pathname: string): { path: string; locale: string } | null {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return null;
  const pathOnly = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  const segments = pathOnly.slice(1).split("/");
  const locale = ["zh", "es", "fr", "ja"].includes(segments[0]) ? segments.shift()! : "en";
  const prefix = locale === "en" ? "" : `/${locale}`;
  const path = segments.join("/");
  if (path === "") return { path: prefix || "/", locale };
  if (path === "docs/quick-start") return { path: `${prefix}/docs/quick-start`, locale };
  if (path === "docs" || path.startsWith("docs/")) return { path: `${prefix}/docs`, locale };
  if (path === "blogs" || path.startsWith("blogs/")) return { path: `${prefix}/blogs`, locale };
  if (path === "privacy" || path === "terms") return { path: `${prefix}/${path}`, locale };
  return null;
}

export function createAnalyticsPayload(
  config: AnalyticsConfig,
  pathname: string,
  event: string,
  properties: Record<string, unknown> = {},
  search = ""
): { name: string; domain: string; url: string; props: Record<string, string> } | null {
  if (!Object.prototype.hasOwnProperty.call(adoptionEvents, event)) return null;
  const page = analyticsPage(pathname);
  if (!page) return null;
  const allowed = adoptionEvents[event as AdoptionEvent] as Record<string, readonly string[]>;
  const props: Record<string, string> = { locale: page.locale, ...analyticsCampaign(search) };
  for (const [key, values] of Object.entries(allowed)) {
    const value = properties[key];
    // Missing or invalid catalog properties drop the event rather than mislabel it.
    if (typeof value !== "string" || !values.includes(value)) return null;
    props[key] = value;
  }
  return { name: event, domain: config.domain, url: `https://${config.domain}${page.path}`, props };
}
