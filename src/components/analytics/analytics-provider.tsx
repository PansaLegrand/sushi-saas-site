"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  analyticsConfig,
  privacySignalEnabled,
  readAnalyticsConsent,
  resetVolatileConsent,
  trackAdoptionEvent,
  writeAnalyticsConsent
} from "@/lib/analytics/client";
import { CONSENT_STORAGE_KEY, isAnalyticsHost, type AnalyticsConsent } from "@/lib/analytics/policy";

export type AnalyticsCopy = {
  title: string;
  description: string;
  allow: string;
  decline: string;
  settings: string;
  enabled: string;
  disabled: string;
  privacySignal: string;
  close: string;
  policy: string;
};

const AnalyticsContext = createContext<{
  openSettings: () => void;
  registerSettingsTrigger: () => () => void;
  label: string;
} | null>(null);

export function AnalyticsProvider({ children, copy, privacyHref }: {
  children: React.ReactNode;
  copy: AnalyticsCopy;
  privacyHref: string;
}) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsent>("unknown");
  const [blocked, setBlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [hostEnabled, setHostEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [settingsTriggerCount, setSettingsTriggerCount] = useState(0);
  const lastPage = useRef<string | null>(null);
  const panelTitle = useRef<HTMLHeadingElement>(null);
  const settingsTrigger = useRef<HTMLElement | null>(null);
  const returnFocus = useRef(false);

  const registerSettingsTrigger = useCallback(() => {
    setSettingsTriggerCount((count) => count + 1);
    return () => setSettingsTriggerCount((count) => count - 1);
  }, []);

  useEffect(() => {
    if (!isAnalyticsHost(analyticsConfig, window.location.hostname)) return;
    setHostEnabled(true);
    const sync = () => {
      setConsent(readAnalyticsConsent());
      setBlocked(privacySignalEnabled());
      setReady(true);
    };
    const storage = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
        resetVolatileConsent();
        sync();
      }
    };
    sync();
    window.addEventListener("storage", storage);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", sync);
    };
  }, []);

  useEffect(() => {
    if (open) panelTitle.current?.focus();
    else if (returnFocus.current) {
      returnFocus.current = false;
      settingsTrigger.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!ready || consent !== "accepted" || blocked) {
      lastPage.current = null;
      return;
    }
    if (lastPage.current !== pathname) {
      trackAdoptionEvent("pageview");
      lastPage.current = pathname;
    }
  }, [pathname, ready, consent, blocked]);

  useEffect(() => {
    if (!hostEnabled) return;
    const clicked = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>("[data-analytics-event]");
      const name = control?.dataset.analyticsEvent;
      if (name !== "github_opened" && name !== "quickstart_opened") return;
      trackAdoptionEvent(name, { source: control?.dataset.analyticsSource });
    };
    document.addEventListener("click", clicked);
    return () => document.removeEventListener("click", clicked);
  }, [hostEnabled]);

  function choose(value: "accepted" | "declined") {
    writeAnalyticsConsent(value);
    setConsent(value);
    returnFocus.current = open;
    setOpen(false);
  }

  function closeSettings() {
    returnFocus.current = true;
    setOpen(false);
  }

  function openSettings() {
    settingsTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }

  const visible = hostEnabled && ready && (open || (consent === "unknown" && !blocked));
  return (
    <AnalyticsContext.Provider value={hostEnabled ? { openSettings, registerSettingsTrigger, label: copy.settings } : null}>
      {children}
      {hostEnabled && ready && settingsTriggerCount === 0 && (
        <button type="button" hidden={visible} onClick={openSettings} className="fixed bottom-3 right-3 z-40 min-h-11 rounded-full border bg-[var(--card)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] shadow-sm sm:bottom-6 sm:right-6" data-analytics-settings>
          {copy.settings}
        </button>
      )}
      {visible && (
        <section aria-label={copy.title} onKeyDown={(event) => { if (event.key === "Escape" && open) closeSettings(); }} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border bg-[var(--card)] p-5 text-[var(--foreground)] shadow-xl sm:inset-x-6 sm:bottom-6" data-analytics-consent>
          <h2 ref={panelTitle} tabIndex={-1} className="text-base font-semibold">{copy.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{copy.description}</p>
          <a href={privacyHref} className="mt-2 inline-block text-sm underline underline-offset-4">{copy.policy}</a>
          <p className="mt-2 text-sm" role="status">
            {blocked ? copy.privacySignal : consent === "accepted" ? copy.enabled : copy.disabled}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => choose("declined")} className="min-h-11 rounded-lg border px-4 py-2 text-sm font-medium">{copy.decline}</button>
            {!blocked && <button type="button" onClick={() => choose("accepted")} className="min-h-11 rounded-lg border px-4 py-2 text-sm font-medium">{copy.allow}</button>}
            {open && <button type="button" onClick={closeSettings} className="min-h-11 rounded-lg px-4 py-2 text-sm underline underline-offset-4">{copy.close}</button>}
          </div>
        </section>
      )}
    </AnalyticsContext.Provider>
  );
}

export function AnalyticsSettingsButton({ className }: { className?: string }) {
  const context = useContext(AnalyticsContext);
  const registerSettingsTrigger = context?.registerSettingsTrigger;
  useEffect(() => registerSettingsTrigger?.(), [registerSettingsTrigger]);
  if (!context) return null;
  return <button type="button" className={className} onClick={context.openSettings}>{context.label}</button>;
}
