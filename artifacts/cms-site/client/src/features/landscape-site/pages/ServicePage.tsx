import { LANDSCAPE_IMAGE_BASE } from "@/features/landscape-site/content/base";
import { getPage } from "@/features/landscape-site/content/pages";
import { useLandscapeCmsPage } from "@/features/landscape-site/use-landscape-cms";
import { BlockRenderer } from "@/features/landscape-site/components/BlockRenderer";
import { Seo } from "@/features/landscape-site/components/Seo";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import NotFound from "@/features/landscape-site/pages/not-found";
import { BRAND } from "@/features/landscape-site/content/site";
import { getServiceImages } from "@/features/landscape-site/lib/serviceImages";
import { ArrowRight, Phone, CheckCircle2 } from "lucide-react";
import { SectionDivider } from "@/features/landscape-site/components/nature/SectionDivider";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";

const HERO_IMAGES: Record<string, string> = {
  "residential-lawn-maintenance": `${LANDSCAPE_IMAGE_BASE}/hero-home.png`,
  "residential-landscaping": `${LANDSCAPE_IMAGE_BASE}/hero-home.png`,
  "residential-hardscape": `${LANDSCAPE_IMAGE_BASE}/hero-hardscape.png`,
  "residential-pressure-washing": `${LANDSCAPE_IMAGE_BASE}/hero-residential-pressure-washing.avif`,
  "mulching-and-planting": `${LANDSCAPE_IMAGE_BASE}/hero-mulch.png`,
  "drainage-solutions": `${LANDSCAPE_IMAGE_BASE}/hero-drainage.png`,
  "commercial": `${LANDSCAPE_IMAGE_BASE}/hero-commercial.png`,
  "commercial-grounds-maintenance": `${LANDSCAPE_IMAGE_BASE}/hero-commercial-grounds.png`,
  "commercial-landscaping": `${LANDSCAPE_IMAGE_BASE}/hero-commercial-landscaping.png`,
  "commercial-hardscape": `${LANDSCAPE_IMAGE_BASE}/hero-commercial-hardscape.png`,
  "commercial-drainage": `${LANDSCAPE_IMAGE_BASE}/hero-commercial-drainage.png`,
  "commercial-pressure-washing": `${LANDSCAPE_IMAGE_BASE}/hero-commercial-pressure-washing.avif`,
  "hoa-services": `${LANDSCAPE_IMAGE_BASE}/hero-hoa.png`,
};

export default function ServicePage({ slug: slugProp }: { slug?: string }) {
  const params = useParams();
  const slug = slugProp ?? params.slug;
  const page = useLandscapeCmsPage(slug || "", getPage(slug || ""));

  if (!page) {
    return <NotFound />;
  }

  const isCommercial = slug?.includes("commercial") || slug === "hoa-services";
  const heroImage = page.media?.heroImageUrl ?? HERO_IMAGES[slug || ""] ?? `${LANDSCAPE_IMAGE_BASE}/hero-home.png`;
  const sidebarImage = page.media?.sidebarImageUrl ?? (isCommercial ? `${LANDSCAPE_IMAGE_BASE}/gallery-com-1.png` : `${LANDSCAPE_IMAGE_BASE}/gallery-res-1.png`);

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
          <img src={heroImage} alt={page.h1} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"></div>
          <div className="absolute inset-0 bg-topo-light opacity-25 mix-blend-multiply pointer-events-none"></div>
        </div>

        <BotanicalAccent variant="fern" className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 h-72 w-auto text-primary/20 z-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
              {page.h1}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 font-medium max-w-2xl leading-relaxed">
              {page.metaDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link href={isCommercial ? "/commercial" : "/"} className="text-primary hover:text-foreground transition-colors text-sm font-bold tracking-wide uppercase">
            {isCommercial ? "Commercial Services" : "Residential Services"}
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-muted-foreground text-sm font-bold tracking-wide uppercase">{page.h1}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative surface-stone bg-paper overflow-hidden">
        <div className="absolute inset-0 bg-topo opacity-60 pointer-events-none"></div>
        <BotanicalAccent variant="sprig" className="hidden xl:block absolute -left-4 top-32 h-72 w-auto text-brand-leaf/10 -rotate-6" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        <div className="lg:col-span-8">
          <BlockRenderer blocks={page.blocks} serviceImages={page.media?.serviceImages ?? getServiceImages(slug || "")} />
        </div>
        
        {/* Sidebar CTA */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 space-y-8">
            <div className="surface-sand bg-paper p-8 rounded-3xl border border-border shadow-natural">
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

            <div className="rounded-3xl overflow-hidden border border-border shadow-natural relative aspect-[4/3]">
              <img src={sidebarImage} alt={page.media?.sidebarImageAlt ?? `${page.h1} project by ${BRAND.shortName}`} loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <span className="absolute bottom-5 left-6 text-white font-extrabold text-lg">Recent Work</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <SectionDivider variant="hills" bgColor="hsl(var(--surface-stone))" fillColor="hsl(var(--primary))" />
      <div className="relative bg-primary text-primary-foreground py-24 overflow-hidden">
        <div className="absolute inset-0 bg-contours opacity-40 pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <BotanicalAccent variant="fern" className="hidden md:block absolute left-6 lg:left-16 top-1/2 -translate-y-1/2 h-72 w-auto text-white/10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Ready to get started?</h2>
          <p className="text-lg md:text-xl font-medium opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Contact {BRAND.name} for a free, no-obligation estimate for your property in {BRAND.county}.
          </p>
          <Link href={isCommercial ? "/commercial-quote" : "/get-a-quote"}>
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold rounded-full hover:-translate-y-1 transition-transform text-background">
              REQUEST A QUOTE
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
