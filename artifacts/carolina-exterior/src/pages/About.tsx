import { getPage } from "@/content";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Seo } from "@/components/Seo";
import { VALUE_PROPS } from "@/content/site";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  const page = getPage("about");
  if (!page) return null;

  return (
    <div className="w-full">
      <Seo title={page.titleTag} description={page.metaDescription} />
      
      <div className="bg-foreground py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">{page.h1}</h1>
          <p className="text-xl text-white/80 font-medium">Rooted in Carolina. Built for Life.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8">
          <BlockRenderer blocks={page.blocks} />
        </div>
        
        <div className="lg:col-span-4 space-y-12">
          <div className="bg-muted p-8 rounded-xl border border-border">
            <h3 className="text-2xl font-extrabold mb-6">Our Values</h3>
            <ul className="space-y-6">
              {VALUE_PROPS.map((v, i) => (
                <li key={i}>
                  <strong className="block text-lg font-bold text-foreground mb-1">{v.title}</strong>
                  <span className="text-muted-foreground font-medium text-sm leading-relaxed">{v.body}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-primary text-primary-foreground p-8 rounded-xl text-center">
            <h3 className="text-2xl font-extrabold mb-4">Join Our Team</h3>
            <p className="font-medium text-primary-foreground/90 mb-6">
              We are always looking for hardworking individuals who share our passion for the outdoors.
            </p>
            <Button variant="secondary" className="w-full font-bold">VIEW OPENINGS</Button>
          </div>
        </div>
      </div>
      
      {/* Simple CTA */}
      <div className="bg-background border-t border-border py-20 text-center px-4">
        <h2 className="text-3xl font-extrabold mb-6">Experience the difference.</h2>
        <Link href="/get-a-quote">
          <Button size="lg" className="h-14 px-8 text-lg font-bold">GET A QUOTE</Button>
        </Link>
      </div>
    </div>
  );
}
