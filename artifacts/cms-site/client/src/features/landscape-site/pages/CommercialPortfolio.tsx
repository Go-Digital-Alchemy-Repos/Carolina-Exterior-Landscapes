import { Seo } from "@/features/landscape-site/components/Seo";
import { useLandscapeCmsData } from "@/features/landscape-site/use-landscape-cms";
import { LANDSCAPE_IMAGE_BASE, type LandscapeMedia } from "@/features/landscape-site/content/base";
import { BRAND } from "@/features/landscape-site/content/site";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";

export default function CommercialPortfolio() {
  const fallbackImages = [
    { src: `${LANDSCAPE_IMAGE_BASE}/gallery-com-1.png`, alt: "Corporate office park landscaping" },
    { src: `${LANDSCAPE_IMAGE_BASE}/gallery-com-2.png`, alt: "HOA community entrance landscaping" },
    { src: `${LANDSCAPE_IMAGE_BASE}/gallery-com-3.png`, alt: "Commercial property hardscape and walkways" },
    { src: `${LANDSCAPE_IMAGE_BASE}/hero-commercial.png`, alt: "Pristine commercial property grounds" },
  ];
  const page = useLandscapeCmsData<{ media?: LandscapeMedia }>("commercial-portfolio", { media: { images: fallbackImages } });
  const images = page.media?.images ?? fallbackImages;

  return (
    <div className="w-full bg-background min-h-screen pb-24">
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
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {images.map((img, i) => (
            <div key={i} className="aspect-video rounded-xl overflow-hidden border border-border shadow-natural hover:shadow-natural-lg hover:-translate-y-1 transition-all duration-500 group">
              <img 
                src={img.src} 
                alt={img.alt} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
