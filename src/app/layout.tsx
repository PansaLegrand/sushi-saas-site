import "@/app/globals.css";
import { getLocale } from "next-intl/server";
import { SiteConfig } from "@/config/site";

export const metadata = {
  metadataBase: new URL(SiteConfig.origin),
  title: {
    default: SiteConfig.name,
    template: `%s · ${SiteConfig.name}`
  },
  description: SiteConfig.description,
  icons: {
    icon: "/favicon.ico"
  }
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
