const fallbackOrigin = "http://localhost:3000";

function normalizeOrigin(value: string | undefined): string {
  const candidate = value?.trim() || fallbackOrigin;

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    return fallbackOrigin;
  }
}

export const SiteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Sushi SaaS",
  description:
    "A production-minded, open-source Next.js SaaS starter with authentication, billing, organizations, credits, storage, and an operator-ready admin console.",
  origin: normalizeOrigin(process.env.NEXT_PUBLIC_WEB_URL),
  repositoryUrl:
    process.env.NEXT_PUBLIC_REPOSITORY_URL?.trim() ||
    "https://github.com/PansaLegrand/sushi-saas-template"
} as const;
