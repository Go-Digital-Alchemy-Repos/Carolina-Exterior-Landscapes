import { Seo } from "@/components/Seo";
import { BRAND } from "@/content/site";
import res1 from "@/assets/gallery-res-1.png";
import res2 from "@/assets/gallery-res-2.png";
import res3 from "@/assets/gallery-res-3.png";
import heroHardscape from "@/assets/hero-hardscape.png";
import heroMulch from "@/assets/hero-mulch.png";
import heroDrainage from "@/assets/hero-drainage.png";

export default function Gallery() {
  const images = [
    { src: res1, alt: "Beautiful landscape design with retaining wall" },
    { src: res2, alt: "Striped residential lawn with vibrant flower beds" },
    { src: res3, alt: "Natural stone patio and outdoor living space" },
    { src: heroHardscape, alt: "Custom hardscape patio" },
    { src: heroMulch, alt: "Freshly mulched garden beds" },
    { src: heroDrainage, alt: "Drainage solution installation" },
  ];

  return (
    <div className="w-full bg-background min-h-screen pb-24">
      <Seo 
        title={`Residential Portfolio & Gallery | ${BRAND.name}`} 
        description={`View our recent residential landscaping, hardscape, and lawn maintenance projects across ${BRAND.region}.`} 
      />
      
      <div className="bg-foreground py-20 px-4 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Residential Gallery</h1>
        <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
          A showcase of our recent landscape and hardscape projects in the Carolina Piedmont.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border shadow-sm group">
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
