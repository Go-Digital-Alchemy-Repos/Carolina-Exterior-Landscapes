import { getPage } from "@/content";
import { Seo } from "@/components/Seo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BRAND } from "@/content/site";

export function extractFaqs(pageSlugs: string[]) {
  const faqs: { q: string; a: string; source: string }[] = [];
  pageSlugs.forEach(slug => {
    const page = getPage(slug);
    if (!page) return;
    let inFaq = false;
    for (let i = 0; i < page.blocks.length; i++) {
      const block = page.blocks[i];
      if (block.type === 'h2' && block.text.toLowerCase().includes('frequently asked')) {
        inFaq = true;
        continue;
      }
      if (inFaq && block.type === 'h3') {
        const next = page.blocks[i + 1];
        if (next && next.type === 'p') {
          faqs.push({ q: block.text, a: next.text, source: page.h1 });
          i++;
        }
      } else if (inFaq && block.type === 'h2') {
        inFaq = false;
      }
    }
  });
  return faqs;
}

export default function Faq() {
  const slugs = [
    "residential-lawn-maintenance",
    "residential-landscaping",
    "residential-hardscape",
    "mulching-and-planting",
    "drainage-solutions",
  ];
  
  const faqs = extractFaqs(slugs);

  return (
    <div className="w-full bg-background min-h-screen pb-24">
      <Seo 
        title={`Residential FAQ | ${BRAND.name}`} 
        description={`Frequently asked questions about our residential landscaping and lawn care services.`} 
      />
      
      <div className="bg-foreground py-20 px-4 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Residential FAQ</h1>
        <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
          Answers to common questions about our lawn care, landscaping, and hardscape services.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4">
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
      </div>
    </div>
  );
}
