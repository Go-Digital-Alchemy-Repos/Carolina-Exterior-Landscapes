import { getPage } from "@/content";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { VALUE_PROPS, BRAND } from "@/content/site";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import heroImg from "@/assets/about-story.png";

export default function About() {
  const page = getPage("about");
  if (!page) return null;

  return (
    <div className="w-full bg-background">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      <div className="relative w-full h-[55vh] min-h-[450px] flex items-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="About Carolina Exterior" className="w-full h-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/30 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 text-primary font-bold tracking-widest text-xs mb-6 border border-primary/30 uppercase backdrop-blur-sm">
              Our Story
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">{page.h1}</h1>
            <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed">{BRAND.tagline}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative">
        <div className="lg:col-span-8">
          <BlockRenderer blocks={page.blocks} />
        </div>
        
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-muted/50 p-8 rounded-3xl border border-border shadow-sm sticky top-32">
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
          
          <div className="bg-primary text-primary-foreground p-10 rounded-3xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
            <h3 className="text-2xl font-extrabold mb-4 relative z-10">Join Our Team</h3>
            <p className="font-medium text-primary-foreground/90 mb-8 relative z-10 leading-relaxed">
              We are always looking for hardworking individuals who share our passion for the outdoors and commitment to quality.
            </p>
            <Button variant="secondary" className="w-full font-bold h-14 rounded-full relative z-10 group text-primary">
              VIEW OPENINGS
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
      </div>
      
      {/* Simple CTA */}
      <div className="bg-accent text-accent-foreground py-32 text-center px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10"></div>
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
