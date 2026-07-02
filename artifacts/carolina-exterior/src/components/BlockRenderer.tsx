import { Block } from "@/content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CheckCircle2, Leaf, ArrowRight } from "lucide-react";

type BlockGroup = 
  | { type: 'faq', title: string, items: { q: string, a: string }[] }
  | { type: 'process', title: string, items: { title: string, text: string }[] }
  | { type: 'grid', title?: string, items: { title: string, text: string }[] }
  | { type: 'prose', blocks: Block[] };

export function BlockRenderer({ blocks, className }: { blocks: Block[], className?: string }) {
  const groups: BlockGroup[] = [];
  
  let currentGroup: BlockGroup | null = null;
  
  const commitCurrentProse = (proseBlocks: Block[]) => {
    if (proseBlocks.length > 0) {
      groups.push({ type: 'prose', blocks: [...proseBlocks] });
      proseBlocks.length = 0;
    }
  };

  let tempProse: Block[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Check for H2 to start new sections
    if (block.type === 'h2') {
      commitCurrentProse(tempProse);
      const textLower = block.text.toLowerCase();
      
      if (textLower.includes('frequently asked') || textLower.includes('faq')) {
        currentGroup = { type: 'faq', title: block.text, items: [] };
        groups.push(currentGroup);
        continue;
      }
      
      if (textLower.includes('process') || textLower.includes('how it works') || textLower.includes('how we work')) {
        currentGroup = { type: 'process', title: block.text, items: [] };
        groups.push(currentGroup);
        continue;
      }

      // Check if following blocks are h3+p patterns that could be a grid
      let isGrid = false;
      if (i + 2 < blocks.length && blocks[i+1].type === 'h3' && blocks[i+2].type === 'p') {
        isGrid = true;
      }

      if (isGrid) {
        currentGroup = { type: 'grid', title: block.text, items: [] };
        groups.push(currentGroup);
        continue;
      }

      // Otherwise just regular prose
      currentGroup = null;
      tempProse.push(block);
      continue;
    }

    if (currentGroup) {
      if (block.type === 'h3') {
        const nextBlock = blocks[i + 1];
        if (nextBlock && nextBlock.type === 'p') {
          if (currentGroup.type === 'faq') {
            currentGroup.items.push({ q: block.text, a: nextBlock.text });
          } else if (currentGroup.type === 'process' || currentGroup.type === 'grid') {
            currentGroup.items.push({ title: block.text, text: nextBlock.text });
          }
          i++; // Skip the next 'p' block
          continue;
        } else {
          // h3 without a p, revert to prose
          currentGroup = null;
          tempProse.push(block);
        }
      } else {
        // Not an h3, revert to prose
        currentGroup = null;
        tempProse.push(block);
      }
    } else {
      // Look for standalone h3+p grids without an h2
      if (block.type === 'h3') {
        const nextBlock = blocks[i + 1];
        if (nextBlock && nextBlock.type === 'p') {
          commitCurrentProse(tempProse);
          currentGroup = { type: 'grid', items: [{ title: block.text, text: nextBlock.text }] };
          groups.push(currentGroup);
          i++;
          continue;
        }
      }
      tempProse.push(block);
    }
  }
  
  commitCurrentProse(tempProse);

  return (
    <div className={cn("w-full space-y-16", className)}>
      {groups.map((group, idx) => {
        if (group.type === 'faq') {
          return (
            <div key={idx} className="my-16 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-foreground tracking-tight">{group.title}</h2>
              <Accordion type="single" collapsible className="w-full bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                {group.items.map((faq, fIdx) => (
                  <AccordionItem key={fIdx} value={`faq-${idx}-${fIdx}`} className="border-b border-border/50 last:border-0">
                    <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground font-medium leading-relaxed pb-6 text-base">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          );
        }

        if (group.type === 'process') {
          return (
            <div key={idx} className="my-20">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-12 text-center text-foreground tracking-tight">{group.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-border -z-10"></div>
                {group.items.map((step, sIdx) => (
                  <div key={sIdx} className="relative flex flex-col items-center text-center group">
                    <div className="w-24 h-24 rounded-full bg-background border-4 border-muted flex items-center justify-center text-3xl font-extrabold text-muted-foreground mb-6 group-hover:border-primary group-hover:text-primary transition-colors duration-500 shadow-sm z-10">
                      {sIdx + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (group.type === 'grid') {
          return (
            <div key={idx} className="my-16">
              {group.title && <h2 className="text-3xl md:text-4xl font-extrabold mb-10 text-foreground tracking-tight">{group.title}</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.items.map((item, gIdx) => (
                  <div key={gIdx} className="bg-card border border-border/60 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (group.type === 'prose') {
          return (
            <div key={idx} className="prose prose-stone lg:prose-lg max-w-4xl mx-auto prose-headings:font-extrabold prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:tracking-tight prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-p:font-medium prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:font-medium prose-li:text-muted-foreground prose-strong:text-foreground">
              {group.blocks.map((block, bIdx) => {
                if (block.type === 'h2') return <h2 key={bIdx}>{block.text}</h2>;
                if (block.type === 'h3') return <h3 key={bIdx}>{block.text}</h3>;
                if (block.type === 'p') return <p key={bIdx}>{block.text}</p>;
                return null;
              })}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
