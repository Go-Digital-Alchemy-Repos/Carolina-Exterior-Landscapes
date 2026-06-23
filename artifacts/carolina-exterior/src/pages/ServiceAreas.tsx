import { getPage } from "@/content";
import { SERVICE_AREAS } from "@/content/site";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { Link } from "wouter";
import { MapPin, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-home.png";

export default function ServiceAreas() {
  const page = getPage("service-areas");

  if (!page) return null;

  return (
    <div className="w-full bg-background pb-24">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      <div className="relative w-full h-[40vh] min-h-[300px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Carolina service areas" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full mt-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            {page.h1}
          </h1>
          <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
            Serving Union County and the greater Charlotte region.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <BlockRenderer blocks={page.blocks} />

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {SERVICE_AREAS.map(area => (
            <Link key={area.slug} href={`/service-areas/${area.slug}`}>
              <div className="group border border-border bg-card hover:border-primary p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {area.city}, {area.state}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
