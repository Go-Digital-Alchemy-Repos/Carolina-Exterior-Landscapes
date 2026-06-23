import { getLocation } from "@/content";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import heroImg from "@/assets/hero-home.png";

export default function ServiceAreaCity() {
  const { slug } = useParams();
  const location = getLocation(slug || "");

  if (!location) {
    return <NotFound />;
  }

  return (
    <div className="w-full bg-background pb-24">
      <Seo title={location.titleTag} description={location.metaDescription} />
      
      <div className="relative w-full h-[45vh] min-h-[350px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt={`${location.city} Landscaping`} className="w-full h-full object-cover opacity-25 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full mt-10">
          <div className="max-w-3xl">
            <span className="inline-block py-1 px-3 rounded-sm bg-primary/20 text-primary font-bold tracking-widest text-sm mb-4 border border-primary/30 uppercase">
              LOCAL SERVICE AREA
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              {location.h1}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8">
          <BlockRenderer blocks={location.blocks} />
        </div>
        
        <div className="lg:col-span-4">
          <div className="sticky top-32 bg-muted p-8 rounded-xl border border-border">
            <h3 className="text-2xl font-extrabold mb-4">Landscaping in {location.city}?</h3>
            <p className="text-muted-foreground font-medium mb-8">
              We provide premium residential and commercial landscaping services throughout {location.city}, {location.state}. Contact us for a free estimate.
            </p>
            <div className="space-y-4">
              <Link href="/get-a-quote">
                <Button size="lg" className="w-full font-bold h-12">
                  RESIDENTIAL QUOTE
                </Button>
              </Link>
              <Link href="/commercial-quote">
                <Button variant="outline" size="lg" className="w-full font-bold h-12">
                  COMMERCIAL QUOTE
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
