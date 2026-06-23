import { Seo } from "@/components/Seo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BRAND } from "@/content/site";
import { extractFaqs } from "./Faq";

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
      
      <div className="bg-foreground py-20 px-4 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Commercial FAQ</h1>
        <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
          Answers to common questions about our commercial and HOA services.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {faqs.length > 0 ? (
          <Accordion type="multiple" className="w-full">
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
