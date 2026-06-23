import { getPage } from "@/content";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { BRAND } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/hero-home.png";

export default function Home() {
  const page = getPage("home");

  if (!page) return null;

  return (
    <div className="w-full">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Carolina beautiful lawn" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full pt-20">
          <div className="max-w-3xl">
            <span className="inline-block py-1 px-3 rounded-sm bg-primary/20 text-primary font-bold tracking-widest text-sm mb-6 border border-primary/30 uppercase">
              {BRAND.tagline}
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
              {page.h1}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-medium mb-10 leading-relaxed max-w-2xl">
              We design, build, and maintain premium outdoor spaces for homes and businesses across {BRAND.county}. One company, complete outdoor care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/get-a-quote">
                <Button size="lg" className="h-14 px-8 text-lg font-bold w-full sm:w-auto">
                  REQUEST A QUOTE <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold w-full sm:w-auto bg-transparent border-white/30 text-white hover:bg-white/10">
                  OUR STORY
                </Button>
              </Link>
            </div>
            
            <div className="mt-16 flex items-center gap-8 text-white/70 text-sm font-bold tracking-wide">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-primary h-5 w-5" /> Licensed & Insured
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-primary h-5 w-5" /> Locally Owned
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-primary h-5 w-5" /> Reliable Schedules
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Blocks */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <BlockRenderer blocks={page.blocks} />
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-accent relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">Ready to transform your property?</h2>
          <p className="text-xl font-medium text-foreground/80 mb-10 max-w-2xl mx-auto">
            Contact {BRAND.name} today for a free estimate on your residential or commercial landscaping needs.
          </p>
          <Link href="/get-a-quote">
            <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20">
              START YOUR PROJECT
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
