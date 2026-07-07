import { getPage } from "@/content";
import { SERVICE_AREAS } from "@/content/site";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { Link } from "wouter";
import { MapPin, ArrowRight } from "lucide-react";
import heroImg from "@/assets/community-aerial.png";

export default function ServiceAreas() {
  const page = getPage("service-areas");

  if (!page) return null;

  return (
    <div className="w-full bg-background pb-24">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      <div className="relative w-full h-[50vh] min-h-[400px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Carolina service areas" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full mt-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 text-primary font-bold tracking-widest text-xs mb-6 border border-primary/30 uppercase backdrop-blur-sm mx-auto">
            <MapPin className="h-3 w-3" /> Locations
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            {page.h1}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
            Serving Union County and the greater Charlotte region with premium landscaping services.
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-4 py-24 relative">
        <BlockRenderer blocks={page.blocks} className="max-w-4xl mx-auto text-center" />

        <div className="mt-20">
          <h2 className="text-3xl font-extrabold text-center mb-12 tracking-tight">Communities We Serve</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {SERVICE_AREAS.map(area => (
              <Link key={area.slug} href={`/service-areas/${area.slug}`}>
                <div className="group border border-border/60 bg-card p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {area.city}, {area.state}
                    </span>
                  </div>
                  <div className="flex items-center text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors mt-auto">
                    View Local Services <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
