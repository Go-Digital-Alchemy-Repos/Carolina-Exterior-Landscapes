import blogData from "./blog.json";
import { LANDSCAPE_IMAGE_BASE, type BlogPost } from "./base";

const blog = (blogData as BlogPost[])
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getBlogImage(filename: string): string | undefined {
  return filename ? `${LANDSCAPE_IMAGE_BASE}/blog/${filename}` : undefined;
}

export function getBlogPosts(): BlogPost[] {
  return blog;
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blog.find((post) => post.slug === slug);
}

export { blog };
