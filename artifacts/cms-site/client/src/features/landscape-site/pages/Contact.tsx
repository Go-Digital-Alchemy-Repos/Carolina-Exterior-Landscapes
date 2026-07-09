import { getPage } from "@/features/landscape-site/content";
import { useLandscapeCmsPage } from "@/features/landscape-site/use-landscape-cms";
import { BlockRenderer } from "@/features/landscape-site/components/BlockRenderer";
import { Seo } from "@/features/landscape-site/components/Seo";
import { BRAND, SERVICE_AREAS } from "@/features/landscape-site/content/site";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";
import { SectionDivider } from "@/features/landscape-site/components/nature/SectionDivider";
import { PublicFormRenderer } from "@/components/forms/public-form-renderer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

export default function Contact() {
  const page = useLandscapeCmsPage("contact", getPage("contact"));
  if (!page) return null;

  const intro = page.blocks.find((block) => block.type === "p")?.text;
  const contentBlocks = page.blocks.filter((block, index) => !(index === 0 && block.type === "p"));

  return (
    <div className="w-full bg-background">
      <Seo title={page.titleTag} description={page.metaDescription} />

      <section className="relative overflow-hidden bg-foreground text-white">
        <div className="absolute inset-0 bg-topo-light opacity-45 pointer-events-none" />
        <BotanicalAccent variant="fern" className="hidden lg:block absolute -left-8 top-20 h-72 w-auto text-primary/20 -rotate-6" />
        <BotanicalAccent variant="sprig" className="hidden lg:block absolute right-6 bottom-8 h-64 w-auto text-primary/20 rotate-6" />
        <SectionDivider variant="hills" overlay fillColor="hsl(var(--background))" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/20 text-white font-bold tracking-widest text-xs mb-6 border border-white/30 uppercase backdrop-blur-sm">
              Contact
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">{page.h1}</h1>
            {intro ? (
              <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed">{intro}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative surface-stone bg-paper overflow-hidden">
        <div className="absolute inset-0 bg-topo opacity-60 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-10 lg:gap-16 items-start">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href={`tel:${BRAND.phoneTel}`} className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm hover:border-primary/50 transition-colors">
                <Phone className="h-6 w-6 text-primary mb-4" />
                <h2 className="text-lg font-extrabold text-foreground mb-1">Call</h2>
                <p className="font-bold text-primary">{BRAND.phoneDisplay}</p>
              </a>
              <a href={`mailto:${BRAND.email}`} className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm hover:border-primary/50 transition-colors">
                <Mail className="h-6 w-6 text-primary mb-4" />
                <h2 className="text-lg font-extrabold text-foreground mb-1">Email</h2>
                <p className="font-bold text-primary break-words">{BRAND.email}</p>
              </a>
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                <MapPin className="h-6 w-6 text-primary mb-4" />
                <h2 className="text-lg font-extrabold text-foreground mb-1">Based In</h2>
                <p className="font-bold text-primary">{BRAND.city}, {BRAND.state}</p>
              </div>
            </div>

            <BlockRenderer blocks={contentBlocks} />
          </div>

          <aside className="lg:sticky lg:top-28">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-natural-lg">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Start Your Request</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                  Share a few details and we will follow up within one business day.
                </p>
              </div>
              <PublicFormRenderer
                slug="residential-quote"
                showHeader={false}
                buttonTextOverride="Send Request"
              />
              <div className="mt-6 border-t border-border pt-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Need commercial or HOA service?
                </p>
                <Link href="/commercial-quote">
                  <Button variant="outline" className="w-full justify-between font-bold">
                    Commercial Quote
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-accent text-accent-foreground py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-contours opacity-60 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 tracking-tight">Serving the Carolina Piedmont</h2>
          <div className="flex flex-wrap gap-3">
            {SERVICE_AREAS.map((area) => (
              <Link
                key={area.slug}
                href={`/service-areas/${area.slug}`}
                className="rounded-full bg-background/80 px-4 py-2 text-sm font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {area.city}, {area.state}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
