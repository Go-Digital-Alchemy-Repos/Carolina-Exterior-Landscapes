import { Block } from "@/content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// A component to render the generic content blocks from the JSON
export function BlockRenderer({ blocks, className }: { blocks: Block[], className?: string }) {
  // Parse blocks to find FAQ sections
  const processedBlocks: any[] = [];
  let currentFaq: { questions: { q: string, a: string }[] } | null = null;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Check if this is the start of an FAQ section
    if (block.type === 'h2' && block.text.toLowerCase().includes('frequently asked')) {
      currentFaq = { questions: [] };
      processedBlocks.push({ type: 'faq', data: currentFaq });
      continue;
    }

    // If we're inside an FAQ section, look for h3 (question) followed by p (answer)
    if (currentFaq) {
      if (block.type === 'h3') {
        const nextBlock = blocks[i + 1];
        if (nextBlock && nextBlock.type === 'p') {
          currentFaq.questions.push({ q: block.text, a: nextBlock.text });
          i++; // Skip the next 'p' block since we consumed it
          continue;
        } else {
          // Found an h3 without a p following it, or end of blocks. 
          // End FAQ mode.
          currentFaq = null;
        }
      } else if (block.type === 'h2') {
        // New section, end FAQ mode
        currentFaq = null;
      } else {
        // Skip random paragraphs inside FAQ if they aren't answers
        continue;
      }
    }

    if (!currentFaq) {
      processedBlocks.push(block);
    }
  }

  return (
    <div className={cn("prose prose-stone lg:prose-lg max-w-none prose-headings:font-extrabold prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-p:font-medium prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:font-medium prose-li:text-muted-foreground", className)}>
      {processedBlocks.map((block, idx) => {
        if (block.type === 'faq') {
          return (
            <div key={idx} className="not-prose my-12">
              <h2 className="text-3xl font-extrabold mb-8 text-foreground">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {block.data.questions.map((faq: any, fIdx: number) => (
                  <AccordionItem key={fIdx} value={`faq-${fIdx}`} className="border-b border-border/50">
                    <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground font-medium leading-relaxed pb-6">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          );
        }

        if (block.type === 'h2') {
          return <h2 key={idx}>{block.text}</h2>;
        }
        if (block.type === 'h3') {
          return <h3 key={idx}>{block.text}</h3>;
        }
        if (block.type === 'p') {
          // Handle lists if the paragraph has bullets or numbered items, or just standard text
          // Content doesn't have strict ul/li types, just text that might contain them if markdown-ish,
          // but looking at the JSON, lists seem to be mostly just paragraphs or we can let prose handle it
          return <p key={idx}>{block.text}</p>;
        }
        return null;
      })}
    </div>
  );
}
