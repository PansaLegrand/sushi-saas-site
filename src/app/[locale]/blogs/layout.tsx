import "fumadocs-ui/css/style.css";
import { GuidesLayout } from "@/components/content/guides-layout";

export default async function BlogLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <GuidesLayout locale={locale}>{children}</GuidesLayout>;
}
