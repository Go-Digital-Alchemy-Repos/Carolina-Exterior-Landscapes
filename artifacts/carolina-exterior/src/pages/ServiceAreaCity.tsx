import { getLocation } from "@/content";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import heroImg from "@/assets/hero-home.png";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { BRAND } from "@/content/site";

export default function ServiceAreaCity() {
  const { slug } = useParams();
  const location = getLocation(slug || "");

  if (!location) {
    return <NotFound />;
  }

  return (
    <div className="w-full bg-background pb-24">
      <Seo title={location.titleTag} description={location.metaDescription} />
      
      <div className="relative w-full h-[55vh] min-h-[450px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt={`${location.city} Landscaping`} className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full mt-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 text-primary font-bold tracking-widest text-xs mb-6 border border-primary/30 uppercase backdrop-blur-sm">
              <MapPin className="h-3 w-3" /> LOCAL SERVICE AREA
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              {location.h1}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-medium max-w-2xl leading-relaxed">
              {location.metaDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative">
        <div className="lg:col-span-8">
          <BlockRenderer blocks={location.blocks} />
        </div>
        
        <div className="lg:col-span-4">
          <div className="sticky top-32 bg-muted/50 p-8 rounded-3xl border border-border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-extrabold mb-4 tracking-tight">Landscaping in {location.city}?</h3>
            <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
              We provide premium residential and commercial landscaping services throughout {location.city}, {location.state}. Contact us for a free estimate.
            </p>
            <div className="space-y-4">
              <Link href="/get-a-quote">
                <Button size="lg" className="w-full font-bold h-14 rounded-full shadow-md group">
                  RESIDENTIAL QUOTE
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/commercial-quote">
                <Button variant="outline" size="lg" className="w-full font-bold h-14 rounded-full group bg-background">
                  COMMERCIAL QUOTE
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
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
  );
}
