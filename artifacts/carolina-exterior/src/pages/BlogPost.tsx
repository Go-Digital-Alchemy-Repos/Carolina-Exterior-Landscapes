import { getBlogPost } from "@/content";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { useParams, Link } from "wouter";
import NotFound from "@/pages/not-found";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { BRAND } from "@/content/site";

export default function BlogPost() {
  const { slug } = useParams();
  const post = getBlogPost(slug || "");

  if (!post) {
    return <NotFound />;
  }

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.h1,
    description: post.metaDescription,
    datePublished: post.date,
    dateModified: post.date,
    articleSection: post.category,
    author: { "@type": "Organization", name: BRAND.name },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: BRAND.domain,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BRAND.domain}/blog/${post.slug}`,
    },
  };

  return (
    <div className="w-full bg-background min-h-screen pb-24 pt-8">
      <Seo
        title={post.titleTag}
        description={post.metaDescription}
        type="article"
        jsonLd={blogJsonLd}
      />
      
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-12">
          <ArrowLeft className="h-4 w-4" /> Back to Journal
        </Link>
        
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Badge variant={post.category === 'commercial' ? "secondary" : "default"} className="uppercase tracking-widest">
              {post.category}
            </Badge>
            <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {post.readMinutes} min read</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight mb-6">
            {post.h1}
          </h1>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed">
            {post.excerpt}
          </p>
        </header>

        <div className="h-px w-full bg-border mb-12" />

        <article className="pb-16">
          <BlockRenderer blocks={post.blocks} />
        </article>
      </div>
    </div>
  );
}
