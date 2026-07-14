import { getBlogPost, getBlogPosts, getBlogImage } from "@/features/landscape-site/content";
import {
  useLandscapeCmsBlogPost,
  useLandscapeCmsBlogPosts,
} from "@/features/landscape-site/use-landscape-cms";
import { BlockRenderer } from "@/features/landscape-site/components/BlockRenderer";
import { Seo } from "@/features/landscape-site/components/Seo";
import { useParams, Link } from "wouter";
import NotFound from "@/features/landscape-site/pages/not-found";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar, Clock, ArrowLeft, Phone } from "lucide-react";
import { BRAND } from "@/features/landscape-site/content/site";
import { buildFaqPageLd } from "@/lib/structured-data";
import { normalizeBlogFaq, splitBlogFaqBlocks, type BlogFaq } from "@shared/blog-faq";

function BlogFaqSection({ faq }: { faq: BlogFaq }) {
  return (
    <section className="pb-8 pt-8" aria-labelledby="blog-faq-title" data-testid="blog-faq-section">
      <div className="mb-8">
        <h2
          id="blog-faq-title"
          className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl"
        >
          {faq.title}
        </h2>
        {faq.description ? (
          <div className="mt-4 space-y-3 text-lg font-medium leading-relaxed text-muted-foreground">
            {faq.description.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : null}
      </div>
      <Accordion
        type="single"
        collapsible
        className="w-full rounded-2xl border border-border/50 bg-card px-6 shadow-sm"
      >
        {faq.items.map((item, index) => (
          <AccordionItem
            key={index}
            value={`blog-faq-${index}`}
            className="border-border/50 last:border-0"
          >
            <AccordionTrigger className="py-5 text-left text-lg font-bold transition-colors hover:text-primary hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-6 text-base font-medium leading-relaxed text-muted-foreground">
              {item.answer.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = useLandscapeCmsBlogPost(slug || "", getBlogPost(slug || ""));

  if (!post) {
    return <NotFound />;
  }

  const allPosts = useLandscapeCmsBlogPosts(getBlogPosts());
  const recentPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 5);
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 4);
  const heroImage = post.imageUrl || getBlogImage(post.image);
  const splitFaq = splitBlogFaqBlocks(post.blocks);
  const faq = normalizeBlogFaq(post.faq) || splitFaq.faq;
  const faqJsonLd = faq ? buildFaqPageLd(faq.items) : null;

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
    ...(heroImage ? { image: heroImage } : {}),
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
        jsonLd={faqJsonLd ? [blogJsonLd, faqJsonLd] : blogJsonLd}
      />

      <div className="max-w-6xl mx-auto px-4">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Journal
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main column */}
          <div className="lg:col-span-8 min-w-0">
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Badge
                  variant={post.category === "commercial" ? "secondary" : "default"}
                  className="uppercase tracking-widest"
                >
                  {post.category}
                </Badge>
                <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />{" "}
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {post.readMinutes} min read
                  </span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight mb-6">
                {post.h1}
              </h1>
              <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                {post.excerpt}
              </p>
            </header>

            {heroImage && (
              <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted mb-12">
                <img
                  src={heroImage}
                  alt={post.h1}
                  width={1408}
                  height={768}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <article className="pb-8">
              <BlockRenderer blocks={splitFaq.blocks} />
            </article>
            {faq ? <BlogFaqSection faq={faq} /> : null}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-8">
              {/* CTA */}
              <div className="rounded-xl bg-foreground p-6 text-white shadow-natural relative overflow-hidden">
                <div className="absolute inset-0 bg-topo-light opacity-50 pointer-events-none"></div>
                <div className="relative">
                  <h3 className="text-lg font-extrabold mb-2">Get a Free Estimate</h3>
                  <p className="text-sm text-white/80 font-medium mb-5">
                    Serving Waxhaw, Union County, and the greater Charlotte region with residential
                    and commercial landscaping.
                  </p>
                  <Link
                    href="/get-a-quote"
                    className="block w-full text-center bg-primary text-white font-bold text-sm py-3 rounded-md hover:opacity-90 transition-opacity mb-3"
                  >
                    Request a Quote
                  </Link>
                  <a
                    href={`tel:${BRAND.phoneTel}`}
                    className="flex items-center justify-center gap-2 w-full text-center bg-white/10 text-white font-bold text-sm py-3 rounded-md hover:bg-white/20 transition-colors"
                  >
                    <Phone className="h-4 w-4" /> {BRAND.phoneDisplay}
                  </a>
                </div>
              </div>

              {/* Related articles */}
              {relatedPosts.length > 0 && (
                <div className="rounded-xl border border-border p-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-5">
                    Related Articles
                  </h3>
                  <div className="space-y-5">
                    {relatedPosts.map((p) => {
                      const relatedImage = p.imageUrl || getBlogImage(p.image);
                      return (
                        <Link key={p.slug} href={`/blog/${p.slug}`} className="flex gap-3 group">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            {relatedImage && (
                              <img
                                src={relatedImage}
                                alt={p.h1}
                                width={200}
                                height={112}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            )}
                          </div>
                          <span className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3">
                            {p.h1}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent posts */}
              <div className="rounded-xl border border-border p-6">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-5">
                  Recent Posts
                </h3>
                <div className="space-y-4">
                  {recentPosts.map((p) => (
                    <Link key={p.slug} href={`/blog/${p.slug}`} className="block group">
                      <span className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {p.h1}
                      </span>
                      <span className="mt-1 block text-xs font-bold text-muted-foreground">
                        {new Date(p.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
