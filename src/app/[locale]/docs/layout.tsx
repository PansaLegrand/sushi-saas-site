import "fumadocs-ui/css/style.css";
import { CollectionLayout } from "@/components/content/collection-layout";
import { docsSource } from "@/lib/source";

export default async function DocsLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <CollectionLayout locale={locale} source={docsSource}>
      {children}
    </CollectionLayout>
  );
}
