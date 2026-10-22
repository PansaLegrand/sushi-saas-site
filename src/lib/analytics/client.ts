"use client";

import {
  CONSENT_STORAGE_KEY,
  GA_COOKIE_PREFIX,
  GA_DATA_LAYER,
  GOOGLE_TAG_ORIGIN,
  createAnalyticsPayload,
  googlePageParameters,
  googleTagConfiguration,
  isAnalyticsHost,
  mayTrack,
  parseAnalyticsConfig,
  parseConsent,
  privacySignalBlocksAnalytics,
  type AdoptionEvent,
  type AnalyticsConsent
} from "./policy";

export const analyticsConfig = parseAnalyticsConfig(
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  process.env.NEXT_PUBLIC_ANALYTICS_HOSTNAME
);

type AnalyticsWindow = Window & { sushiAnalyticsLayer?: IArguments[] };
const deniedConsent = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" } as const;
let volatileConsent: AnalyticsConsent = "unknown";
let useVolatileConsent = false;
let tagStatus: "absent" | "loading" | "loaded" | "failed" = "absent";
let loadGeneration = 0;
let tagEnabled = false;
let tagConfigured = false;
let configuredPageLocation: string | null = null;

// Google's documented command queue uses an Arguments object, not a custom event envelope.
const googleCommand: (...parameters: unknown[]) => void = function () {
  // eslint-disable-next-line prefer-rest-params
  (window as AnalyticsWindow).sushiAnalyticsLayer?.push(arguments);
};

export function privacySignalEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return privacySignalBlocksAnalytics({
    doNotTrack: navigator.doNotTrack,
    windowDoNotTrack: (window as Window & { doNotTrack?: string }).doNotTrack,
    globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
  });
}

export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return "unknown";
  if (useVolatileConsent) return volatileConsent;
  try {
    return parseConsent(localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return volatileConsent;
  }
}

export function writeAnalyticsConsent(consent: "accepted" | "declined"): void {
  volatileConsent = consent;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, consent);
    useVolatileConsent = false;
  } catch {
    // Privacy modes may disable storage. The choice then lasts for this document only.
    useVolatileConsent = true;
  }
  applyAnalyticsPrivacyPreference();
}

export function resetVolatileConsent(): void {
  useVolatileConsent = false;
  volatileConsent = "unknown";
}

function consentAllowsAnalytics(): boolean {
  return typeof window !== "undefined" && isAnalyticsHost(analyticsConfig, window.location.hostname) &&
    mayTrack(analyticsConfig, readAnalyticsConsent(), privacySignalEnabled());
}

function clearAnalyticsCookies(): void {
  // We configure host-only cookies at /. Do not remove another site's/default GA cookies.
  try {
    const cookieNames = document.cookie.split(";").map((cookie) => cookie.trim().split("=", 1)[0]);
    for (const name of cookieNames) {
      if (name === `${GA_COOKIE_PREFIX}_ga` || name.startsWith(`${GA_COOKIE_PREFIX}_ga_`)) {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
      }
    }
  } catch {
    // Blocking cookie access must not stop the visitor from withdrawing permission.
  }
}

/** Stop manual events and Google's collection flag before updating consent. Never loads a tag. */
export function applyAnalyticsPrivacyPreference(): void {
  if (typeof window === "undefined" || !analyticsConfig || consentAllowsAnalytics()) return;
  const browser = window as AnalyticsWindow;
  Reflect.set(browser, `ga-disable-${analyticsConfig.measurementId}`, true);
  if (tagStatus === "loading") {
    // Remove queued consented events if permission changes before the library arrives.
    browser.sushiAnalyticsLayer?.splice(0);
    googleCommand("consent", "default", deniedConsent);
    tagConfigured = false;
    configuredPageLocation = null;
  }
  if (tagEnabled) googleCommand("consent", "update", deniedConsent);
  tagEnabled = false;
  clearAnalyticsCookies();
}

function enableGoogleTag(payload: NonNullable<ReturnType<typeof createAnalyticsPayload>>): void {
  const config = analyticsConfig!;
  const browser = window as AnalyticsWindow;
  Reflect.set(browser, `ga-disable-${config.measurementId}`, false);
  browser.sushiAnalyticsLayer ??= [];
  if (!tagConfigured) {
    googleCommand("consent", "default", deniedConsent);
    googleCommand("set", { allow_google_signals: false, allow_ad_personalization_signals: false, ads_data_redaction: true, url_passthrough: false });
    googleCommand("js", new Date());
  }
  if (!tagEnabled) googleCommand("consent", "update", { ...deniedConsent, analytics_storage: "granted" });
  if (!tagConfigured || configuredPageLocation !== payload.url) {
    // Config fields outrank global set fields. Update this stream's context so
    // automatic engagement/session events also use the current sanitized route.
    googleCommand("config", config.measurementId, googleTagConfiguration(payload));
    configuredPageLocation = payload.url;
  }
  tagConfigured = true;
  tagEnabled = true;
  if (tagStatus === "loaded" || tagStatus === "loading") return;
  tagStatus = "loading";
  const generation = ++loadGeneration;
  const script = document.createElement("script");
  script.id = "sushi-google-analytics";
  script.async = true;
  script.referrerPolicy = "no-referrer";
  script.src = `${GOOGLE_TAG_ORIGIN}/gtag/js?id=${encodeURIComponent(config.measurementId)}&l=${GA_DATA_LAYER}`;
  script.onload = () => {
    if (generation !== loadGeneration) return;
    tagStatus = "loaded";
    applyAnalyticsPrivacyPreference();
  };
  script.onerror = () => {
    if (generation !== loadGeneration) return;
    tagStatus = "failed";
    tagConfigured = false;
    configuredPageLocation = null;
    tagEnabled = false;
    browser.sushiAnalyticsLayer?.splice(0);
    script.remove();
  };
  document.head.appendChild(script);
}

/** Basic consent mode: no Google script or events before opt-in; links never wait for analytics. */
export function trackAdoptionEvent(event: AdoptionEvent, properties: Record<string, unknown> = {}): void {
  if (!consentAllowsAnalytics()) {
    applyAnalyticsPrivacyPreference();
    return;
  }
  const config = analyticsConfig!;
  const payload = createAnalyticsPayload(config, window.location.pathname, event, properties, window.location.search);
  if (!payload) return;
  try {
    enableGoogleTag(payload);
    const page = googlePageParameters(payload);
    googleCommand("event", payload.name, { ...page, ...payload.props, send_to: config.measurementId });
  } catch {
    // Script or DOM failures must not interrupt clipboard actions or navigation.
  }
}
