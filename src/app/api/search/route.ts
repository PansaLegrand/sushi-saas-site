import { contentSearch } from "@/lib/search/indexes";
import { handleContentSearch } from "@/lib/search/handler";

export const runtime = "nodejs";

export function GET(request: Request) {
  return handleContentSearch(request, contentSearch);
}
