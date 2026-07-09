import { getLocation } from "@/features/landscape-site/content";
import { useLandscapeCmsLocation } from "@/features/landscape-site/use-landscape-cms";
import { BlockRenderer } from "@/features/landscape-site/components/BlockRenderer";
import { Seo } from "@/features/landscape-site/components/Seo";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import NotFound from "@/features/landscape-site/pages/not-found";
import heroImg from "@/features/landscape-site/assets/hero-home.webp";
import res1 from "@/features/landscape-site/assets/gallery-res-1.webp";
import res2 from "@/features/landscape-site/assets/gallery-res-2.webp";
import res3 from "@/features/landscape-site/assets/gallery-res-3.webp";
import communityAerial from "@/features/landscape-site/assets/community-aerial.webp";
import matthewsHero from "@/features/landscape-site/assets/matthews-nc-hero.webp";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { BRAND, SERVICE_AREAS } from "@/features/landscape-site/content/site";
import { CityMiniMap } from "@/features/landscape-site/components/CityMiniMap";
import { SectionDivider } from "@/features/landscape-site/components/nature/SectionDivider";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";

const CITY_IMAGES = [heroImg, res1, res2, res3, communityAerial];

// City-specific hero imagery overrides. Cities not listed fall back to the
// shared deterministic pool.
const CITY_IMAGE_OVERRIDES: Record<string, { hero: string }> = {
  "matthews-nc": { hero: matthewsHero },
};

function pickCityImage(slug: string): string {
  const override = CITY_IMAGE_OVERRIDES[slug];
  if (override) return override.hero;
  let sum = 0;
  for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i);
  return CITY_IMAGES[sum % CITY_IMAGES.length];
}

export default function ServiceAreaCity() {
  const { slug } = useParams();
  const location = useLandscapeCmsLocation(slug || "", getLocation(slug || ""));

  if (!location) {
    return <NotFound />;
  }

  const heroImage = pickCityImage(slug || "");
  const serviceArea = SERVICE_AREAS.find((a) => a.slug === slug);

  return (
    <div className="w-full bg-background pb-24">
      <Seo title={location.titleTag} description={location.metaDescription} />
      
      <div className="relative w-full h-[55vh] min-h-[450px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt={`${location.city} landscaping and lawn care`} width={1408} height={768} fetchPriority="high" decoding="async" className="w-full h-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/30 to-transparent"></div>
          <div className="absolute inset-0 bg-topo-light opacity-50 mix-blend-overlay pointer-events-none"></div>
        </div>

        <SectionDivider variant="hills" overlay fillColor="hsl(var(--background))" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 text-white font-bold tracking-widest text-xs mb-6 border border-white/30 uppercase backdrop-blur-sm [&_svg]:text-white">
              <MapPin className="h-3 w-3" /> LOCAL SERVICE AREA
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              {location.h1}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 font-medium max-w-2xl leading-relaxed">
              {location.metaDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="relative surface-stone bg-paper overflow-hidden">
        <div className="absolute inset-0 bg-topo opacity-60 pointer-events-none"></div>
        <BotanicalAccent variant="sprig" className="hidden xl:block absolute -left-4 top-32 h-72 w-auto text-brand-leaf/10 -rotate-6" />
        <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative">
        <div className="lg:col-span-8">
          <BlockRenderer blocks={location.blocks} excludeSlug={location.slug} />
        </div>
        
        <div className="lg:col-span-4">
          <div className="sticky top-32 space-y-8">
          {serviceArea && (
            <CityMiniMap
              lat={serviceArea.lat}
              lng={serviceArea.lng}
              city={location.city}
              state={location.state}
            />
          )}
          <div className="surface-sand bg-paper p-8 rounded-3xl border border-border shadow-natural">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-extrabold mb-4 tracking-tight">Landscaping in {location.city}?</h3>
            <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
              We provide premium residential and commercial landscaping services throughout {location.city}, {location.state}. Contact us for a free estimate.
            </p>
            <div className="flex flex-col gap-[18px]">
              <Button asChild size="lg" className="w-full font-bold h-14 rounded-full shadow-md group">
                <Link href="/get-a-quote">
                  RESIDENTIAL QUOTE
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full font-bold h-14 rounded-full group bg-background">
                <Link href="/commercial-quote">
                  COMMERCIAL QUOTE
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <p className="text-sm font-bold text-muted-foreground mb-3">Or call us directly:</p>
              <a href={`tel:${BRAND.phoneTel}`} className="inline-flex items-center gap-2 text-foreground font-extrabold hover:text-primary transition-colors text-lg">
                <Phone className="h-5 w-5 text-primary" />
                {BRAND.phoneDisplay}
              </a>
            </div>
          </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
