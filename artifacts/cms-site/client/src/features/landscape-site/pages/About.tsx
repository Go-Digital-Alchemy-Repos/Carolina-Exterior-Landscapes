import { LANDSCAPE_IMAGE_BASE } from "@/features/landscape-site/content/base";
import { getPage } from "@/features/landscape-site/content/pages";
import { useLandscapeCmsPage } from "@/features/landscape-site/use-landscape-cms";
import { BlockRenderer } from "@/features/landscape-site/components/BlockRenderer";
import { Seo } from "@/features/landscape-site/components/Seo";
import { VALUE_PROPS, BRAND } from "@/features/landscape-site/content/site";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { SectionDivider } from "@/features/landscape-site/components/nature/SectionDivider";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";

export default function About() {
  const page = useLandscapeCmsPage("about", getPage("about"));
  if (!page) return null;
  const heroImg = page.media?.heroImageUrl ?? `${LANDSCAPE_IMAGE_BASE}/about-story.png`;

  return (
    <div className="w-full bg-background">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      <div className="relative w-full h-[55vh] min-h-[450px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="About Carolina Exterior" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"></div>
          <div className="absolute inset-0 bg-topo-light opacity-25 mix-blend-multiply pointer-events-none"></div>
        </div>

        <SectionDivider variant="hills" overlay fillColor="hsl(var(--background))" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 text-white font-bold tracking-widest text-xs mb-6 border border-white/30 uppercase backdrop-blur-sm [&_svg]:text-white">
              Our Story
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">{page.h1}</h1>
            <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed">{BRAND.tagline}</p>
          </div>
        </div>
      </div>

      <div className="relative surface-stone bg-paper overflow-hidden">
        <div className="absolute inset-0 bg-topo opacity-60 pointer-events-none"></div>
        <BotanicalAccent variant="sprig" className="hidden xl:block absolute -left-4 top-32 h-72 w-auto text-brand-leaf/10 -rotate-6" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        <div className="lg:col-span-8">
          <BlockRenderer blocks={page.blocks} />
        </div>
        
        <div className="lg:col-span-4 space-y-8">
          <div className="surface-sand bg-paper p-8 rounded-3xl border border-border shadow-natural sticky top-32">
            <h3 className="text-2xl font-extrabold mb-8 tracking-tight text-foreground">Our Values</h3>
            <ul className="space-y-8">
              {VALUE_PROPS.map((v, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-lg font-bold text-foreground mb-1">{v.title}</strong>
                    <span className="text-muted-foreground font-medium text-sm leading-relaxed">{v.body}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      </div>
      
      {/* Simple CTA */}
      <SectionDivider variant="hills" bgColor="hsl(var(--surface-stone))" fillColor="hsl(var(--accent))" />
      <div className="bg-accent text-accent-foreground py-32 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-contours opacity-60 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10"></div>
        <BotanicalAccent variant="fern" className="hidden md:block absolute left-6 lg:left-20 top-1/2 -translate-y-1/2 h-72 w-auto text-brand-forest/10" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight">Experience the difference.</h2>
          <p className="text-xl font-medium opacity-90 mb-10 leading-relaxed">Let us show you what reliable, premium landscaping looks like.</p>
          <Link href="/get-a-quote">
            <Button size="lg" className="h-16 px-10 text-lg font-bold rounded-full shadow-xl shadow-primary/20 hover:-translate-y-1 transition-transform">
              REQUEST A QUOTE
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
