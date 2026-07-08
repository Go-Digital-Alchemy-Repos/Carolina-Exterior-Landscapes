import { getPage } from "@/features/landscape-site/content/pages";
import { useLandscapeCmsPage } from "@/features/landscape-site/use-landscape-cms";
import { BlockRenderer } from "@/features/landscape-site/components/BlockRenderer";
import { Seo } from "@/features/landscape-site/components/Seo";
import { BRAND, RESIDENTIAL_SERVICES, COMMERCIAL_SERVICES, VALUE_PROPS } from "@/features/landscape-site/content/site";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Leaf, Shield, Clock, MapPin } from "lucide-react";
import { SectionDivider } from "@/features/landscape-site/components/nature/SectionDivider";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";
import { LANDSCAPE_IMAGE_BASE } from "@/features/landscape-site/content/base";

export default function Home() {
  const page = useLandscapeCmsPage("home", getPage("home"));

  if (!page) return null;

  const heroImg = page.media?.heroImageUrl ?? `${LANDSCAPE_IMAGE_BASE}/hero-home.png`;
  const aboutStory = page.media?.sidebarImageUrl ?? `${LANDSCAPE_IMAGE_BASE}/about-story.png`;
  const residentialCardImage = page.media?.featureCards?.find((card) => card.title === "Residential")?.imageUrl ?? `${LANDSCAPE_IMAGE_BASE}/gallery-res-1.png`;
  const commercialCardImage = page.media?.featureCards?.find((card) => card.title === "Commercial")?.imageUrl ?? `${LANDSCAPE_IMAGE_BASE}/hero-commercial.png`;
  const galleryPreview = page.media?.galleryPreview ?? [
    { src: `${LANDSCAPE_IMAGE_BASE}/gallery-res-2.png`, alt: "Striped residential lawn with vibrant flower beds", label: "Lawn Renovation" },
    { src: `${LANDSCAPE_IMAGE_BASE}/gallery-res-3.png`, alt: "Natural stone patio and outdoor living space", label: "Stone Patio" },
    { src: `${LANDSCAPE_IMAGE_BASE}/gallery-com-2.png`, alt: "HOA community entrance landscaping", label: "HOA Entrance" },
  ];

  return (
    <div className="w-full">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Carolina beautiful lawn" className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent"></div>
          <div className="absolute inset-0 bg-topo-light opacity-25 mix-blend-multiply pointer-events-none"></div>
        </div>

        <BotanicalAccent variant="fern" className="hidden md:block absolute right-10 lg:right-24 top-1/2 -translate-y-1/2 h-[26rem] w-auto text-primary/25 z-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-16">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 text-white font-bold tracking-widest text-xs mb-8 border border-white/30 uppercase backdrop-blur-sm [&_svg]:text-white">
              <Leaf className="h-3 w-3" /> {BRAND.tagline}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight">
              {page.h1}
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-medium mb-10 leading-relaxed max-w-2xl">
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
            
            <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-8 text-white/70 text-sm font-bold tracking-wide">
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

        <SectionDivider variant="hills" overlay fillColor="hsl(var(--surface-sand))" />
      </section>

      {/* Services Overview */}
      <section className="py-24 surface-sand bg-paper relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none"></div>
        <div className="absolute inset-0 bg-topo opacity-70 pointer-events-none"></div>
        <BotanicalAccent variant="sprig" className="hidden lg:block absolute -left-6 top-16 h-64 w-auto text-brand-leaf/15 -rotate-12" />
        <BotanicalAccent variant="sprig" className="hidden lg:block absolute -right-6 bottom-16 h-64 w-auto text-brand-leaf/15 rotate-12 scale-x-[-1]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-brand-leaf/10 text-brand-leaf font-bold tracking-widest text-xs mb-6 border border-brand-leaf/20 uppercase">
              <Leaf className="h-3 w-3" /> Field Notes
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">Expertise for Every Property</h2>
            <p className="text-xl text-muted-foreground font-medium">Comprehensive landscaping services tailored to the Piedmont Carolina climate.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Residential Card */}
            <div className="group rounded-3xl overflow-hidden bg-card border border-border shadow-natural hover:shadow-natural-lg transition-all duration-500 hover:-translate-y-1">
              <div className="h-72 w-full relative overflow-hidden">
                <img src={residentialCardImage} alt="Residential Landscaping" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
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
            <div className="group rounded-3xl overflow-hidden bg-card border border-border shadow-natural hover:shadow-natural-lg transition-all duration-500 hover:-translate-y-1">
              <div className="h-72 w-full relative overflow-hidden">
                <img src={commercialCardImage} alt="Commercial Landscaping" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
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
      <section className="py-24 bg-background bg-paper relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-white font-extrabold text-sm tracking-widest uppercase mb-3">Proof In The Work</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">Recent Finished Projects</h2>
            </div>
            <Link href="/gallery">
              <Button variant="outline" className="rounded-full h-12 px-6 font-bold group/btn shrink-0">
                View Full Gallery <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {galleryPreview.map((img, i) => (
              <Link key={i} href="/gallery" className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-natural hover:shadow-natural-lg transition-all duration-500 block hover:-translate-y-1">
                <img src={img.src} alt={img.alt} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <span className="absolute bottom-5 left-5 text-white font-extrabold text-lg">{img.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <SectionDivider variant="hills" bgColor="hsl(var(--background))" fillColor="hsl(var(--foreground))" />
      <section className="py-24 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-topo-light opacity-70 pointer-events-none"></div>
        <BotanicalAccent variant="fern" className="hidden lg:block absolute right-8 top-10 h-72 w-auto text-primary/15" />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
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
          <img src={aboutStory} alt="Carolina Exterior crew installing a natural stone patio" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40"></div>
        </div>
        <div className="absolute inset-0 bg-topo-light opacity-50 pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <p className="text-white font-extrabold text-sm tracking-widest uppercase mb-4">One Company. Complete Care.</p>
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

        <SectionDivider variant="leaf" overlay fillColor="hsl(var(--surface-mist))" />
      </section>

      {/* SEO Content Blocks */}
      <section className="py-24 surface-mist bg-paper relative overflow-hidden">
        <div className="absolute inset-0 bg-topo opacity-60 pointer-events-none"></div>
        <BotanicalAccent variant="leaf" className="hidden lg:block absolute right-6 top-24 h-72 w-auto text-brand-leaf/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <BlockRenderer blocks={page.blocks} />
        </div>
      </section>

      {/* CTA Section */}
      <SectionDivider variant="hills" bgColor="hsl(var(--surface-mist))" fillColor="hsl(var(--accent))" />
      <section className="py-32 bg-accent relative overflow-hidden text-accent-foreground">
        <div className="absolute inset-0 bg-contours opacity-70 pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white rounded-full blur-3xl opacity-40"></div>
        <BotanicalAccent variant="fern" className="hidden md:block absolute left-6 lg:left-16 top-1/2 -translate-y-1/2 h-80 w-auto text-brand-forest/10" />

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
