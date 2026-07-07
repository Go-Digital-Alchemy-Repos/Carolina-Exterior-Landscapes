import { getBlogPosts, getBlogImage } from "@/features/landscape-site/content";
import { useLandscapeCmsBlogPosts } from "@/features/landscape-site/use-landscape-cms";
import { Seo } from "@/features/landscape-site/components/Seo";
import { Link } from "wouter";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";

export default function BlogIndex() {
  const posts = useLandscapeCmsBlogPosts(getBlogPosts());
  const [filter, setFilter] = useState<"all" | "residential" | "commercial">("all");

  const filteredPosts = posts.filter(p => filter === "all" || p.category === filter);

  return (
    <div className="w-full bg-background min-h-screen pb-24">
      <Seo 
        title="Landscaping & Lawn Care Blog | Carolina Exterior" 
        description="Expert advice, tips, and news about landscaping, lawn maintenance, and hardscaping in the Carolina Piedmont region." 
      />
      
      <div className="bg-foreground py-20 px-4 text-center mb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-topo-light opacity-50 pointer-events-none"></div>
        <BotanicalAccent variant="fern" className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 h-56 w-auto text-primary/15" />
        <BotanicalAccent variant="fern" className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 h-56 w-auto text-primary/15 scale-x-[-1]" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">The Landscape Journal</h1>
          <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
            Expert insights, seasonal tips, and guides for properties in the Carolina Piedmont.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <button 
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors border ${filter === "all" ? "bg-primary text-white border-primary" : "bg-transparent text-foreground border-border hover:border-primary"}`}
          >
            All Articles
          </button>
          <button 
            onClick={() => setFilter("residential")}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors border ${filter === "residential" ? "bg-primary text-white border-primary" : "bg-transparent text-foreground border-border hover:border-primary"}`}
          >
            Residential
          </button>
          <button 
            onClick={() => setFilter("commercial")}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors border ${filter === "commercial" ? "bg-primary text-white border-primary" : "bg-transparent text-foreground border-border hover:border-primary"}`}
          >
            Commercial
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full shadow-natural hover:shadow-natural-lg hover:-translate-y-1 hover:border-muted-foreground/40 transition-all duration-500 cursor-pointer group flex flex-col overflow-hidden">
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  <img
                    src={getBlogImage(post.image)}
                    alt={post.h1}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <div className="mb-4">
                    <Badge variant={post.category === 'commercial' ? "secondary" : "default"} className="uppercase tracking-widest text-[0.65rem]">
                      {post.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-extrabold leading-tight group-hover:text-primary transition-colors">
                    {post.h1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground font-medium line-clamp-3">
                    {post.excerpt}
                  </p>
                </CardContent>
                <CardFooter className="text-xs font-bold text-muted-foreground flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {post.readMinutes} min read
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground font-medium">
            No articles found for this category.
          </div>
        )}
      </div>
    </div>
  );
}
