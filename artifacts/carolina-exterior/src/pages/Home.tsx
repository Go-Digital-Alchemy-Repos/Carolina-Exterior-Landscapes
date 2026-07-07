import { getPage } from "@/content";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { BRAND, RESIDENTIAL_SERVICES, COMMERCIAL_SERVICES, VALUE_PROPS } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Leaf, Shield, Clock, MapPin } from "lucide-react";

import heroImg from "@/assets/hero-home.png";
import res1 from "@/assets/gallery-res-1.png";
import res2 from "@/assets/gallery-res-2.png";
import res3 from "@/assets/gallery-res-3.png";
import com1 from "@/assets/hero-commercial.png";
import com2 from "@/assets/hero-hardscape.png";
import comHoa from "@/assets/gallery-com-2.png";
import aboutStory from "@/assets/about-story.png";

export default function Home() {
  const page = getPage("home");

  if (!page) return null;

  return (
    <div className="w-full">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Carolina beautiful lawn" className="w-full h-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/55 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full pt-20 pb-16">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 text-primary font-bold tracking-widest text-xs mb-8 border border-primary/30 uppercase backdrop-blur-sm">
              <Leaf className="h-3 w-3" /> {BRAND.tagline}
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-extrabold text-white mb-8 leading-[1.05] tracking-tight">
              {page.h1}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-medium mb-12 leading-relaxed max-w-2xl">
              We design, build, and maintain premium outdoor spaces for homes and businesses across {BRAND.county}. One company, complete outdoor care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/get-a-quote">
                <Button size="lg" className="h-14 px-8 text-lg font-bold w-full sm:w-auto rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-1">
                  REQUEST A QUOTE <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold w-full sm:w-auto rounded-full bg-transparent border-white/30 text-white hover:bg-white hover:text-foreground transition-all">
                  OUR STORY
                </Button>
              </Link>
            </div>
            
            <div className="mt-20 flex flex-wrap items-center gap-8 text-white/70 text-sm font-bold tracking-wide">
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                <Shield className="text-primary h-5 w-5" /> Licensed & Insured
              </div>
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                <MapPin className="text-primary h-5 w-5" /> Locally Owned
              </div>
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                <Clock className="text-primary h-5 w-5" /> Reliable Schedules
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">Expertise for Every Property</h2>
            <p className="text-xl text-muted-foreground font-medium">Comprehensive landscaping services tailored to the Piedmont Carolina climate.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Residential Card */}
            <div className="group rounded-3xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="h-72 w-full relative overflow-hidden">
                <img src={res1} alt="Residential Landscaping" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent"></div>
                <h3 className="absolute bottom-6 left-8 text-3xl font-extrabold text-white">Residential</h3>
              </div>
              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {RESIDENTIAL_SERVICES.slice(0, 4).map(s => (
                    <li key={s.slug} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">{s.name}</strong>
                        <span className="text-muted-foreground text-sm font-medium">{s.short}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href="/residential-landscaping">
                  <Button className="w-full rounded-full h-12 font-bold group/btn">
                    Explore Residential Services <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Commercial Card */}
            <div className="group rounded-3xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="h-72 w-full relative overflow-hidden">
                <img src={com1} alt="Commercial Landscaping" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent"></div>
                <h3 className="absolute bottom-6 left-8 text-3xl font-extrabold text-white">Commercial</h3>
              </div>
              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {COMMERCIAL_SERVICES.slice(0, 4).map(s => (
                    <li key={s.slug} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block">{s.name}</strong>
                        <span className="text-muted-foreground text-sm font-medium">{s.short}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href="/commercial">
                  <Button className="w-full rounded-full h-12 font-bold group/btn">
                    Explore Commercial Services <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-primary font-extrabold text-sm tracking-widest uppercase mb-3">Proof In The Work</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">Recent Finished Projects</h2>
            </div>
            <Link href="/gallery">
              <Button variant="outline" className="rounded-full h-12 px-6 font-bold group/btn shrink-0">
                View Full Gallery <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: res2, alt: "Striped residential lawn with vibrant flower beds", label: "Lawn Renovation" },
              { src: res3, alt: "Natural stone patio and outdoor living space", label: "Stone Patio" },
              { src: comHoa, alt: "HOA community entrance landscaping", label: "HOA Entrance" },
            ].map((img, i) => (
              <Link key={i} href="/gallery" className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-500 block">
                <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent"></div>
                <span className="absolute bottom-5 left-5 text-white font-extrabold text-lg">{img.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight text-white">Why Carolina Exterior?</h2>
              <p className="text-background/70 font-medium leading-relaxed mb-8">
                We bring a craftsman's approach to landscaping, treating every property with respect and delivering reliable, lasting results.
              </p>
              <Link href="/about">
                <Button variant="outline" className="rounded-full bg-transparent border-white/20 text-white hover:bg-white hover:text-foreground">
                  Our Story
                </Button>
              </Link>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
              {VALUE_PROPS.map((v, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{v.title}</h3>
                  <p className="text-background/70 font-medium leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Craft Band */}
      <section className="relative w-full py-28 md:py-36 bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={aboutStory} alt="Carolina Exterior crew installing a natural stone patio" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/85 to-foreground/40"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <p className="text-primary font-extrabold text-sm tracking-widest uppercase mb-4">One Company. Complete Care.</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-8 leading-tight">
              We design it, build it, and keep it thriving.
            </h2>
            <div className="flex flex-wrap gap-3">
              {BRAND.subTagline.split(" \u2022 ").map((word) => (
                <span key={word} className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-white/10 border border-white/15 text-white font-bold tracking-wide backdrop-blur-sm">
                  <Leaf className="h-4 w-4 text-primary" /> {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Blocks */}
      <section className="py-24 bg-background border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <BlockRenderer blocks={page.blocks} />
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-32 bg-accent relative overflow-hidden text-accent-foreground">
        <div className="absolute inset-0 bg-contours opacity-70 pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white rounded-full blur-3xl opacity-40"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/40 text-foreground font-bold tracking-widest text-xs mb-8 uppercase backdrop-blur-md border border-white/50">
            Start Your Project
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight">Ready to transform your property?</h2>
          <p className="text-xl md:text-2xl font-medium opacity-90 mb-12 max-w-2xl mx-auto leading-relaxed">
            Contact {BRAND.name} today for a free estimate on your residential or commercial landscaping needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/get-a-quote">
              <Button size="lg" className="h-16 px-10 text-lg font-bold shadow-xl shadow-primary/20 rounded-full hover:-translate-y-1 transition-transform">
                REQUEST RESIDENTIAL QUOTE
              </Button>
            </Link>
            <Link href="/commercial-quote">
              <Button variant="outline" size="lg" className="h-16 px-10 text-lg font-bold rounded-full bg-transparent border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-colors">
                COMMERCIAL INQUIRY
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
