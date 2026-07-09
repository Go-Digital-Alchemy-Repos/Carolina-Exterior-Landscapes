import { getPage } from "@/features/landscape-site/content";
import { useLandscapeCmsPage } from "@/features/landscape-site/use-landscape-cms";
import { Seo } from "@/features/landscape-site/components/Seo";
import { ServiceAreaMap } from "@/features/landscape-site/components/ServiceAreaMap";
import { BRAND, SERVICE_AREAS } from "@/features/landscape-site/content/site";
import { MapPin, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/features/landscape-site/components/nature/SectionDivider";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";
import heroImg from "@/features/landscape-site/assets/community-aerial.webp";
import { CtaBackdrop } from "@/features/landscape-site/components/CtaBackdrop";

export default function ServiceAreas() {
  const page = useLandscapeCmsPage("service-areas", getPage("service-areas"));

  if (!page) return null;

  return (
    <div className="w-full bg-background">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      <div className="relative w-full h-[50vh] min-h-[400px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Carolina service areas" fetchPriority="high" decoding="async" className="w-full h-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/30 to-transparent"></div>
          <div className="absolute inset-0 bg-topo-light opacity-50 mix-blend-overlay pointer-events-none"></div>
        </div>

        <SectionDivider variant="hills" overlay fillColor="hsl(var(--surface-stone))" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-3xl">
          <span className="public-eyebrow-badge mb-6">
            <MapPin className="h-3 w-3" /> Locations
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
            {page.h1}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/80 font-medium max-w-2xl leading-relaxed">
            Serving Union County and the greater Charlotte region with premium landscaping services.
          </p>
          </div>
        </div>
      </div>

      <div className="relative surface-stone bg-paper overflow-hidden">
        <div className="absolute inset-0 bg-topo opacity-60 pointer-events-none"></div>
        <BotanicalAccent variant="sprig" className="hidden xl:block absolute -left-4 top-32 h-72 w-auto text-brand-leaf/10 -rotate-6" />
        <BotanicalAccent variant="sprig" className="hidden xl:block absolute -right-4 bottom-32 h-72 w-auto text-brand-leaf/10 rotate-6 scale-x-[-1]" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-24">
        <div>
          <h2 className="text-3xl font-extrabold text-center mb-4 tracking-tight">Communities We Serve</h2>
          <p className="text-center text-muted-foreground font-medium mb-12 max-w-2xl mx-auto">
            Explore our service territory across Union County and the greater Charlotte region. Click any pin to view local services for that community.
          </p>
          <ServiceAreaMap />
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_AREAS.map((area) => (
            <Link
              key={area.slug}
              href={`/service-areas/${area.slug}`}
              className="group flex min-h-16 items-center justify-between gap-4 rounded-lg border border-border/70 bg-background/90 px-5 py-4 font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
            >
              <span className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {area.city}, {area.state}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Complete outdoor care throughout our service territory</h2>
          <p className="mt-4 text-lg font-medium leading-relaxed text-muted-foreground">
            Residential and commercial clients receive the same reliable scheduling, professional crews, and full range of lawn care, landscaping, hardscape, and drainage services in every community we serve.
          </p>
        </div>
      </div>
      </div>

      <SectionDivider variant="hills" bgColor="hsl(var(--surface-stone))" fillColor="hsl(var(--brand-forest))" />
      <section className="relative overflow-hidden bg-[hsl(var(--brand-forest))] px-4 py-24 text-center text-white">
        <CtaBackdrop imageUrl={heroImg} />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Ready to improve your outdoor space?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed text-white/80">
            Tell us about your property and {BRAND.name} will help you choose the right next step.
          </p>
          <Link href="/get-a-quote">
            <Button size="lg" className="mt-9 h-14 rounded-full px-9 font-extrabold">
              REQUEST A QUOTE
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
