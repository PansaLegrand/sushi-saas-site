import createNextIntlPlugin from "next-intl/plugin";
import { createMDX } from "fumadocs-mdx/next";
import { defaultLocale, locales } from "./src/i18n/locale";

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

const nextConfig = {
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
              "connect-src 'self'",
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

    return [
      ...contentMoves,
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
