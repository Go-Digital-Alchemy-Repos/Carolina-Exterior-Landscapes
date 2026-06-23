import { Seo } from "@/components/Seo";
import { BRAND } from "@/content/site";
import com1 from "@/assets/gallery-com-1.png";
import com2 from "@/assets/gallery-com-2.png";
import com3 from "@/assets/gallery-com-3.png";
import heroCommercial from "@/assets/hero-commercial.png";

export default function CommercialPortfolio() {
  const images = [
    { src: com1, alt: "Corporate office park landscaping" },
    { src: com2, alt: "HOA community entrance landscaping" },
    { src: com3, alt: "Commercial property hardscape and walkways" },
    { src: heroCommercial, alt: "Pristine commercial property grounds" },
  ];

  return (
    <div className="w-full bg-background min-h-screen pb-24">
      <Seo 
        title={`Commercial Portfolio | ${BRAND.name}`} 
        description={`View our recent commercial landscaping, grounds maintenance, and site work projects across ${BRAND.region}.`} 
      />
      
      <div className="bg-foreground py-20 px-4 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Commercial Portfolio</h1>
        <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
          Professional grounds maintenance, landscape design, and hardscape for businesses and HOAs.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {images.map((img, i) => (
            <div key={i} className="aspect-video rounded-xl overflow-hidden border border-border shadow-sm group">
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
