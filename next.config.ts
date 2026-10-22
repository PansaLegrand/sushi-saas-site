import createNextIntlPlugin from "next-intl/plugin";
import { createMDX } from "fumadocs-mdx/next";
import { defaultLocale, locales } from "./src/i18n/locale";
import { analyticsConnectSrc } from "./src/lib/analytics/policy";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withMDX = createMDX();

const MOVED_TO_DOCS = [
  "quick-start",
  "database-setup",
  "authentication-and-admin",
  "stripe-setup",
  "notifications-slack",
  "storage-uploads",
  "logging",
  "email-service",
  "account-ledger",
  "text-to-video-tasks",
  "reservations-feature"
];

const MERGED_GUIDES = [
  ["frontend-vs-backend-vs-fullstack-saas", "anatomy-of-modern-saas"],
  ["social-sign-in", "web-authentication-deep-dive"],
  ["affiliates-and-referrals-for-beginners", "affiliate-and-reward"],
  [
    "why-sushi-templates-beats-minimal-starters-for-real-saas-projects",
    "why-use-a-saas-template"
  ]
];

const nextConfig = {
  // Metadata comes from checked-in content and translations. Emit it in the
  // initial head for every client instead of requiring streamed body insertion.
  htmlLimitedBots: /.*/,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "object-src 'none'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              analyticsConnectSrc(process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER, process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
              "upgrade-insecure-requests"
            ].join("; ")
          }
        ]
      }
    ];
  },
  async redirects() {
    const contentMoves = MOVED_TO_DOCS.flatMap((slug) => [
      ...locales.map((locale) => ({
        source: `/${locale}/blogs/${slug}`,
        destination:
          locale === defaultLocale ? `/docs/${slug}` : `/${locale}/docs/${slug}`,
        permanent: true
      })),
      {
        source: `/blogs/${slug}`,
        destination: `/docs/${slug}`,
        permanent: true
      }
    ]);

    const guideMerges = MERGED_GUIDES.flatMap(([sourceSlug, destinationSlug]) => [
      ...locales.map((locale) => ({
        source: `/${locale}/blogs/${sourceSlug}`,
        destination:
          locale === defaultLocale
            ? `/blogs/${destinationSlug}`
            : `/${locale}/blogs/${destinationSlug}`,
        permanent: true
      })),
      {
        source: `/blogs/${sourceSlug}`,
        destination: `/blogs/${destinationSlug}`,
        permanent: true
      }
    ]);

    const databaseGuideMove = [
      ...locales.map((locale) => ({
        source: `/${locale}/blogs/databases-for-saas-postgres-drizzle`,
        destination:
          locale === defaultLocale
            ? "/docs/database-setup"
            : `/${locale}/docs/database-setup`,
        permanent: true
      })),
      {
        source: "/blogs/databases-for-saas-postgres-drizzle",
        destination: "/docs/database-setup",
        permanent: true
      }
    ];

    return [
      ...contentMoves,
      ...guideMerges,
      ...databaseGuideMove,
      {
        source: `/${defaultLocale}`,
        destination: "/",
        permanent: true
      },
      {
        source: `/${defaultLocale}/:path*`,
        destination: "/:path*",
        permanent: true
      }
    ];
  }
};

export default withMDX(withNextIntl(nextConfig));
