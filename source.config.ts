import { defineDocs, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

const contentFrontmatter = frontmatterSchema.extend({
  keywords: z.union([z.array(z.string()), z.string()]).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  author: z.union([z.string(), z.array(z.string())]).optional(),
  authors: z.array(z.string()).optional(),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  image: z.string().optional(),
  noindex: z.boolean().optional()
});

export const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: contentFrontmatter }
});

export const blog = defineDocs({
  dir: "content/blog",
  docs: {
    files: ["**/*.mdx"],
    schema: contentFrontmatter
  }
});
