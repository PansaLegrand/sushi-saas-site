import type { Metadata } from "next";
import { Article, getArticleMetadata } from "@/components/content/article";
import { blogSource } from "@/lib/source";

type Params = { locale: string; slug?: string[] };

export default async function BlogArticle({
  params
}: {
  params: Promise<Params>;
}) {
  return <Article source={blogSource} kind="blogs" params={await params} />;
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  return getArticleMetadata({
    source: blogSource,
    kind: "blogs",
    params: await params
  });
}

export function generateStaticParams() {
  return blogSource.generateParams("slug", "locale");
}
