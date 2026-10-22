import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, locales, localePath } from "@/i18n/locale";
import { AnalyticsProvider, type AnalyticsCopy } from "@/components/analytics/analytics-provider";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AnalyticsProvider copy={messages.analytics as AnalyticsCopy} privacyHref={localePath(locale, "/privacy")}>
        {children}
      </AnalyticsProvider>
    </NextIntlClientProvider>
  );
}
