import { Seo } from "@/features/landscape-site/components/Seo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BRAND } from "@/features/landscape-site/content/site";
import { extractFaqs } from "./Faq";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";

export default function CommercialFaq() {
  const slugs = [
    "commercial",
    "commercial-grounds-maintenance",
    "commercial-landscaping",
    "commercial-hardscape",
    "commercial-drainage",
    "hoa-services",
  ];
  
  const faqs = extractFaqs(slugs);

  return (
    <div className="w-full bg-background min-h-screen pb-24">
      <Seo 
        title={`Commercial & HOA FAQ | ${BRAND.name}`} 
        description={`Frequently asked questions about our commercial landscaping, HOA grounds maintenance, and site work services.`} 
      />
      
      <div className="bg-foreground py-20 px-4 text-center mb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-topo-light opacity-50 pointer-events-none"></div>
        <BotanicalAccent variant="fern" className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 h-56 w-auto text-primary/15" />
        <BotanicalAccent variant="fern" className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 h-56 w-auto text-primary/15 scale-x-[-1]" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Commercial FAQ</h1>
          <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
            Answers to common questions about our commercial and HOA services.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {faqs.length > 0 ? (
          <Accordion type="multiple" className="w-full surface-stone bg-paper rounded-2xl border border-border shadow-natural p-6 md:p-10">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border-b border-border/50 py-2">
                <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-medium leading-relaxed pb-6 text-base">
                  {faq.a}
                  <div className="mt-3 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                    From: {faq.source}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-center text-muted-foreground py-12">No FAQs available at this time.</p>
        )}
      </div>
    </div>
  );
}
