import { getPage } from "@/content";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import NotFound from "@/pages/not-found";
import { BRAND } from "@/content/site";

import heroHome from "@/assets/hero-home.png";
import heroCommercial from "@/assets/hero-commercial.png";
import heroHardscape from "@/assets/hero-hardscape.png";
import heroMulch from "@/assets/hero-mulch.png";
import heroDrainage from "@/assets/hero-drainage.png";

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
    <div className="w-full">
      <Seo
        title={page.titleTag}
        description={page.metaDescription}
        jsonLd={serviceJsonLd}
      />
      
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] min-h-[400px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt={page.h1} className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full mt-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              {page.h1}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <BlockRenderer blocks={page.blocks} />
          </div>
          
          {/* Sidebar CTA */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 bg-muted p-8 rounded-xl border border-border">
              <h3 className="text-2xl font-extrabold mb-4">Ready to start?</h3>
              <p className="text-muted-foreground font-medium mb-8">
                Contact us today for a free, no-obligation estimate for your property.
              </p>
              <Link href={isCommercial ? "/commercial-quote" : "/get-a-quote"}>
                <Button size="lg" className="w-full font-bold h-12">
                  REQUEST A QUOTE
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
