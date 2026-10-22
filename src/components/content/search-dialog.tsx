"use client";

import { useEffect, useMemo, useState } from "react";
import type { SortedResult } from "fumadocs-core/search";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps
} from "fumadocs-ui/components/dialog/search";
import { normalizeLocale } from "@/i18n/locale";
import { searchCopy } from "@/lib/search/copy";

type SearchState = { status: "idle" | "loading" | "ready" | "error"; items: SortedResult[] };

export function ContentSearchDialog({
  open,
  onOpenChange,
  links = []
}: SharedProps & { links?: [string, string][] }) {
  const { locale, text } = useI18n();
  const lang = normalizeLocale(locale);
  const copy = searchCopy[lang];
  const [search, setSearch] = useState("");
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<SearchState>({ status: "idle", items: [] });
  const defaults = useMemo(() => links.map(([content, url]) => ({
    id: url, type: "page" as const, content, url
  })), [links]);

  useEffect(() => {
    const query = search.trim();
    if (!open || !query) {
      setState({ status: "idle", items: [] });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading", items: [] });
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ query, locale: lang });
        const response = await fetch(`/api/search?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search unavailable");
        const items: SortedResult[] = await response.json();
        if (!controller.signal.aborted) setState({ status: "ready", items });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error", items: [] });
      }
    }, 180);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [lang, open, retry, search]);

  return (
    <SearchDialog
      open={open}
      onOpenChange={onOpenChange}
      search={search}
      onSearchChange={setSearch}
      isLoading={state.status === "loading"}
    >
      <SearchDialogOverlay />
      <SearchDialogContent
        onKeyDown={(event) => {
          // Fumadocs 15 handles result navigation on window. Let focused
          // buttons keep native Enter activation instead of opening the
          // highlighted result (which can be a different control).
          if (event.key === "Enter" && event.target instanceof Element && event.target.closest("button")) {
            event.stopPropagation();
          }
        }}
      >
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput aria-label={text.search} maxLength={160} autoComplete="off" />
          <SearchDialogClose aria-label={copy.close} />
        </SearchDialogHeader>
        {state.status === "error" ? (
          <div className="space-y-3 p-5 text-sm">
            <p role="alert">{copy.unavailable}</p>
            <button type="button" className="rounded-lg border px-3 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => setRetry((value) => value + 1)}>
              {copy.retry}
            </button>
          </div>
        ) : (
          <SearchDialogList
            items={state.status === "idle" ? defaults : state.status === "ready" ? state.items : null}
            Empty={() => <p role="status" className="py-10 text-center text-sm text-fd-muted-foreground">{text.searchNoResult}</p>}
          />
        )}
        <SearchDialogFooter>
          <p role="status" aria-live="polite" className="text-xs text-fd-muted-foreground">
            {state.status === "loading" ? copy.loading : copy.hint}
          </p>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
