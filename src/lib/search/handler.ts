import type { SearchServer } from "fumadocs-core/search/server";
import { defaultLocale, isLocale } from "@/i18n/locale";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
export const MAX_SEARCH_LENGTH = 160;

export async function handleContentSearch(request: Request, server: Pick<SearchServer, "search">) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("query") ?? "").trim();
  const locale = params.get("locale") ?? defaultLocale;
  if (!isLocale(locale) || query.length > MAX_SEARCH_LENGTH) {
    return Response.json({ error: "INVALID_SEARCH" }, { status: 400, headers });
  }
  if (!query) return Response.json([], { headers });
  try {
    const results = await server.search(query, { locale: locale.toLowerCase() });
    return Response.json(results.slice(0, 24), { headers });
  } catch {
    return Response.json({ error: "SEARCH_UNAVAILABLE" }, { status: 503, headers });
  }
}
