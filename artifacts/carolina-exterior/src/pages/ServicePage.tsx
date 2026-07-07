import { getPage } from "@/content";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import NotFound from "@/pages/not-found";
import { BRAND } from "@/content/site";
import { ArrowRight, Phone, CheckCircle2 } from "lucide-react";

import heroHome from "@/assets/hero-home.png";
import heroCommercial from "@/assets/hero-commercial.png";
import heroHardscape from "@/assets/hero-hardscape.png";
import heroMulch from "@/assets/hero-mulch.png";
import heroDrainage from "@/assets/hero-drainage.png";
import galleryRes from "@/assets/gallery-res-1.png";
import galleryCom from "@/assets/gallery-com-1.png";

const HERO_IMAGES: Record<string, string> = {
  "residential-lawn-maintenance": heroHome,
  "residential-landscaping": heroHome,
  "residential-hardscape": heroHardscape,
  "mulching-and-planting": heroMulch,
  "drainage-solutions": heroDrainage,
  "commercial": heroCommercial,
  "commercial-grounds-maintenance": heroCommercial,
  "commercial-landscaping": heroCommercial,
  "commercial-hardscape": heroHardscape,
  "commercial-drainage": heroDrainage,
  "hoa-services": heroCommercial,
};

export default function ServicePage({ slug: slugProp }: { slug?: string }) {
  const params = useParams();
  const slug = slugProp ?? params.slug;
  const page = getPage(slug || "");

  if (!page) {
    return <NotFound />;
  }

  const isCommercial = slug?.includes("commercial") || slug === "hoa-services";
  const heroImage = HERO_IMAGES[slug || ""] || heroHome;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.h1,
    description: page.metaDescription,
    serviceType: page.h1,
    areaServed: `${BRAND.county}, ${BRAND.region}`,
    provider: {
      "@type": "LocalBusiness",
      name: BRAND.name,
      telephone: BRAND.phoneTel,
      email: BRAND.email,
      address: {
        "@type": "PostalAddress",
        addressLocality: BRAND.addressLocality,
        addressRegion: BRAND.addressRegion,
        postalCode: BRAND.postalCode,
        addressCountry: "US",
      },
    },
  };

  return (
    <div className="w-full bg-background">
      <Seo
        title={page.titleTag}
        description={page.metaDescription}
        jsonLd={serviceJsonLd}
      />
      
      {/* Hero Section */}
      <div className="relative w-full h-[60vh] min-h-[500px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt={page.h1} className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full mt-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Link href={isCommercial ? "/commercial" : "/"} className="text-primary hover:text-white transition-colors text-sm font-bold tracking-wide uppercase">
                {isCommercial ? "Commercial Services" : "Residential Services"}
              </Link>
              <span className="text-white/30 text-sm">/</span>
              <span className="text-white/60 text-sm font-bold tracking-wide uppercase">{page.h1}</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-[1.1] tracking-tight">
              {page.h1}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-medium max-w-2xl leading-relaxed">
              {page.metaDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative">
        <div className="lg:col-span-8">
          <BlockRenderer blocks={page.blocks} />
        </div>
        
        {/* Sidebar CTA */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 space-y-8">
            <div className="bg-muted/50 p-8 rounded-3xl border border-border shadow-sm">
              <h3 className="text-2xl font-extrabold mb-4 tracking-tight">Ready to start?</h3>
              <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
                Contact us today for a free, no-obligation estimate for your property in {BRAND.region}.
              </p>
              <Link href={isCommercial ? "/commercial-quote" : "/get-a-quote"} className="block mb-4">
                <Button size="lg" className="w-full font-bold h-14 rounded-full shadow-md shadow-primary/10 group">
                  REQUEST A QUOTE
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href={`tel:${BRAND.phoneTel}`} className="block">
                <Button variant="outline" size="lg" className="w-full font-bold h-14 rounded-full bg-background group">
                  <Phone className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  {BRAND.phoneDisplay}
                </Button>
              </a>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl">
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                The Carolina Difference
              </h4>
              <ul className="space-y-4 text-sm font-medium text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Locally owned & operated in Monroe, NC
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Fully licensed and insured
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Reliable scheduling and communication
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Premium materials and craftsmanship
                </li>
              </ul>
            </div>

            <div className="rounded-3xl overflow-hidden border border-border shadow-sm relative aspect-[4/3]">
              <img src={isCommercial ? galleryCom : galleryRes} alt={`${page.h1} project by ${BRAND.shortName}`} loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent"></div>
              <span className="absolute bottom-5 left-6 text-white font-extrabold text-lg">Recent Work</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative bg-primary text-primary-foreground py-24 overflow-hidden">
        <div className="absolute inset-0 bg-contours opacity-40 pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Ready to get started?</h2>
          <p className="text-lg md:text-xl font-medium opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Contact {BRAND.name} for a free, no-obligation estimate for your property in {BRAND.county}.
          </p>
          <Link href={isCommercial ? "/commercial-quote" : "/get-a-quote"}>
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold rounded-full text-primary hover:-translate-y-1 transition-transform">
              REQUEST A QUOTE
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
