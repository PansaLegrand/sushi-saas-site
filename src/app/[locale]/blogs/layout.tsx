import "fumadocs-ui/css/style.css";
import { CollectionLayout } from "@/components/content/collection-layout";
import { blogSource } from "@/lib/source";

export default async function BlogLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <CollectionLayout locale={locale} source={blogSource}>
      {children}
    </CollectionLayout>
  );
}
