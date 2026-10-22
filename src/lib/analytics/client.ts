"use client";

import {
  ANALYTICS_ENDPOINT,
  CONSENT_STORAGE_KEY,
  createAnalyticsPayload,
  isAnalyticsHost,
  mayTrack,
  parseAnalyticsConfig,
  parseConsent,
  privacySignalBlocksAnalytics,
  type AdoptionEvent,
  type AnalyticsConsent
} from "./policy";

export const analyticsConfig = parseAnalyticsConfig(
  process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER,
  process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
);

let volatileConsent: AnalyticsConsent = "unknown";
let useVolatileConsent = false;

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
}

export function resetVolatileConsent(): void {
  useVolatileConsent = false;
  volatileConsent = "unknown";
}

/** No queue, replay, third-party script or navigation delay. Events before opt-in are discarded. */
export function trackAdoptionEvent(event: AdoptionEvent, properties: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !mayTrack(analyticsConfig, readAnalyticsConsent(), privacySignalEnabled())) return;
  const config = analyticsConfig!;
  // Preview deployments must not contaminate the production property's measurements.
  if (!isAnalyticsHost(config, window.location.hostname)) return;
  const payload = createAnalyticsPayload(config, window.location.pathname, event, properties, window.location.search);
  if (!payload) return;
  void fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain" },
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true
  }).catch(() => {
    // Analytics must never interrupt reading, clipboard actions or navigation.
  });
}
