import { LANDSCAPE_IMAGE_BASE } from "@/features/landscape-site/content/base";
import { getPage } from "@/features/landscape-site/content/pages";
import { useLandscapeCmsPage } from "@/features/landscape-site/use-landscape-cms";
import { BlockRenderer } from "@/features/landscape-site/components/BlockRenderer";
import { Seo } from "@/features/landscape-site/components/Seo";
import { ServiceAreaMap } from "@/features/landscape-site/components/ServiceAreaMap";
import { MapPin } from "lucide-react";
import { SectionDivider } from "@/features/landscape-site/components/nature/SectionDivider";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";

export default function ServiceAreas() {
  const page = useLandscapeCmsPage("service-areas", getPage("service-areas"));

  if (!page) return null;
  const heroImg = page.media?.heroImageUrl ?? `${LANDSCAPE_IMAGE_BASE}/community-aerial.png`;

  return (
    <div className="w-full bg-background pb-24">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      <div className="relative w-full h-[50vh] min-h-[400px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Carolina service areas" className="w-full h-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/30 to-transparent"></div>
          <div className="absolute inset-0 bg-topo-light opacity-50 mix-blend-overlay pointer-events-none"></div>
        </div>

        <SectionDivider variant="hills" overlay fillColor="hsl(var(--background))" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 text-white font-bold tracking-widest text-xs mb-6 border border-white/30 uppercase backdrop-blur-sm [&_svg]:text-white">
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
        <div className="max-w-5xl mx-auto px-4 py-24 relative">
        <div className="mb-24">
          <h2 className="text-3xl font-extrabold text-center mb-4 tracking-tight">Communities We Serve</h2>
          <p className="text-center text-muted-foreground font-medium mb-12 max-w-2xl mx-auto">
            Explore our service territory across Union County and the greater Charlotte region. Click any pin to view local services for that community.
          </p>
          <ServiceAreaMap />
        </div>

        <BlockRenderer blocks={page.blocks} className="max-w-4xl mx-auto text-center" />
      </div>
      </div>
    </div>
  );
}
