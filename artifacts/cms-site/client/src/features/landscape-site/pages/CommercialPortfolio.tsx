import { Seo } from "@/features/landscape-site/components/Seo";
import { BRAND } from "@/features/landscape-site/content/site";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";
import com1 from "@/features/landscape-site/assets/gallery-com-1.webp";
import com2 from "@/features/landscape-site/assets/gallery-com-2.webp";
import com3 from "@/features/landscape-site/assets/gallery-com-3.webp";
import heroCommercial from "@/features/landscape-site/assets/hero-commercial.webp";
import { SectionDivider } from "@/features/landscape-site/components/nature/SectionDivider";

export default function CommercialPortfolio() {
  const images = [
    { src: com1, alt: "Corporate office park landscaping" },
    { src: com2, alt: "HOA community entrance landscaping" },
    { src: com3, alt: "Commercial property hardscape and walkways" },
    { src: heroCommercial, alt: "Pristine commercial property grounds" },
  ];

  return (
    <div className="w-full surface-stone bg-topo min-h-screen pb-24">
      <Seo 
        title={`Commercial Portfolio | ${BRAND.name}`} 
        description={`View our recent commercial landscaping, grounds maintenance, and site work projects across ${BRAND.region}.`} 
      />
      
      <div className="bg-foreground py-20 px-4 text-center mb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-topo-light opacity-50 pointer-events-none"></div>
        <BotanicalAccent variant="fern" className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 h-56 w-auto text-primary/15" />
        <BotanicalAccent variant="fern" className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 h-56 w-auto text-primary/15 scale-x-[-1]" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Commercial Portfolio</h1>
          <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
            Professional grounds maintenance, landscape design, and hardscape for businesses and HOAs.
          </p>
        </div>
        <SectionDivider variant="hills" overlay fillColor="hsl(var(--surface-stone))" />
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {images.map((img, i) => (
            <div key={i} className="aspect-video rounded-xl overflow-hidden border border-border shadow-natural hover:shadow-natural-lg hover:-translate-y-1 transition-all duration-500 group">
              <img 
                src={img.src} 
                alt={img.alt} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
