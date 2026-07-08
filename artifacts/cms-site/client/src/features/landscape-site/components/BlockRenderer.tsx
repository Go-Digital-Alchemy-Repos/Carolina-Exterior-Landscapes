import type { ReactNode } from "react";
import { Block } from "@/features/landscape-site/content/base";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/features/landscape-site/lib/utils";
import { CheckCircle2, ArrowRight, Phone } from "lucide-react";
import { Link } from "wouter";
import { CityLinkProvider, LinkedText, resolveCitySlug } from "@/features/landscape-site/lib/cityLinks";
import { BRAND } from "@/features/landscape-site/content/site";

type Item = { title: string; text: string };

type BlockGroup =
  | { type: 'faq'; title: string; intro: string[]; items: { q: string; a: string }[] }
  | { type: 'process'; title: string; intro: string[]; items: Item[] }
  | { type: 'grid'; title?: string; intro: string[]; items: Item[] }
  | { type: 'cta'; title: string; blocks: Block[] }
  | { type: 'prose'; blocks: Block[] };

type Section = { heading?: Block; body: Block[] };

const FAQ_RE = /(frequently asked|faq)/i;
const PROCESS_RE = /(process|how it works|how we work|what to expect|steps)/i;
const CTA_RE = /^request a quote for/i;

// Matches "Short Title: rest of text" or "Short Title — rest of text"
function splitStep(text: string): Item | null {
  const m = text.match(/^([A-Z][^:.!?]{2,70}?)(?::|\s+[—–])\s+(\S[\s\S]*)$/);
  if (!m) return null;
  return { title: m[1].trim(), text: m[2].trim() };
}

// Parses a section body into optional intro paragraphs followed by items,
// supporting both "h3 + paragraph(s)" pairs and runs of "Title: description"
// paragraphs. Returns null unless EVERY block is consumed and there are at
// least 2 items — callers must fall back to prose in that case so no copy is
// ever dropped and no empty decorative section renders.
function parseStructured(body: Block[]): { intro: string[]; items: Item[] } | null {
  const intro: string[] = [];
  let i = 0;
  while (i < body.length && body[i].type === 'p' && !splitStep(body[i].text)) {
    intro.push(body[i].text);
    i++;
  }
  const items: Item[] = [];
  if (i < body.length && body[i].type === 'h3') {
    while (i < body.length && body[i].type === 'h3') {
      const title = body[i].text;
      i++;
      const texts: string[] = [];
      while (i < body.length && body[i].type === 'p') {
        texts.push(body[i].text);
        i++;
      }
      if (texts.length === 0) return null;
      items.push({ title, text: texts.join('\n\n') });
    }
  } else {
    while (i < body.length && body[i].type === 'p') {
      const step = splitStep(body[i].text);
      if (!step) return null;
      items.push(step);
      i++;
    }
  }
  if (i !== body.length || items.length < 2) return null;
  return { intro, items };
}

function parseFaqSection(body: Block[]): { intro: string[]; items: { q: string; a: string }[] } | null {
  const intro: string[] = [];
  let i = 0;
  while (i < body.length && body[i].type === 'p') {
    intro.push(body[i].text);
    i++;
  }
  const items: { q: string; a: string }[] = [];
  while (i < body.length && body[i].type === 'h3') {
    const q = body[i].text;
    i++;
    const answers: string[] = [];
    while (i < body.length && body[i].type === 'p') {
      answers.push(body[i].text);
      i++;
    }
    if (answers.length === 0) return null;
    items.push({ q, a: answers.join('\n\n') });
  }
  if (i !== body.length || items.length === 0) return null;
  return { intro, items };
}

function buildGroups(blocks: Block[]): BlockGroup[] {
  const sections: Section[] = [];
  let current: Section = { body: [] };
  for (const block of blocks) {
    if (block.type === 'h2') {
      sections.push(current);
      current = { heading: block, body: [] };
    } else {
      current.body.push(block);
    }
  }
  sections.push(current);

  const groups: BlockGroup[] = [];
  const pushProse = (section: Section) => {
    const proseBlocks = section.heading ? [section.heading, ...section.body] : section.body;
    if (proseBlocks.length === 0) return;
    const last = groups[groups.length - 1];
    if (last && last.type === 'prose') {
      last.blocks.push(...proseBlocks);
    } else {
      groups.push({ type: 'prose', blocks: proseBlocks });
    }
  };

  for (const section of sections) {
    if (!section.heading) {
      const hasH3 = section.body.some((b) => b.type === 'h3');
      if (hasH3) {
        const parsed = parseStructured(section.body);
        if (parsed) {
          groups.push({ type: 'grid', intro: parsed.intro, items: parsed.items });
          continue;
        }
      }
      pushProse(section);
      continue;
    }

    const headingText = section.heading.text;
    if (CTA_RE.test(headingText)) {
      groups.push({ type: 'cta', title: headingText, blocks: section.body });
      continue;
    }
    if (FAQ_RE.test(headingText)) {
      const faq = parseFaqSection(section.body);
      if (faq && faq.items.length > 0) {
        groups.push({ type: 'faq', title: headingText, intro: faq.intro, items: faq.items });
        continue;
      }
      pushProse(section);
      continue;
    }

    const parsed = parseStructured(section.body);
    if (parsed) {
      if (PROCESS_RE.test(headingText)) {
        groups.push({ type: 'process', title: headingText, intro: parsed.intro, items: parsed.items });
      } else {
        groups.push({ type: 'grid', title: headingText, intro: parsed.intro, items: parsed.items });
      }
      continue;
    }
    pushProse(section);
  }

  return groups;
}

function Paragraphs({ text, className }: { text: string; className?: string }) {
  const parts = text.split('\n\n');
  return (
    <>
      {parts.map((part, idx) => (
        <p key={idx} className={className}><LinkedText text={part} /></p>
      ))}
    </>
  );
}

function IntroParagraphs({ intro }: { intro: string[] }) {
  if (intro.length === 0) return null;
  return (
    <div className="max-w-3xl mx-auto mb-10 space-y-4">
      {intro.map((text, idx) => (
        <p key={idx} className="text-muted-foreground font-medium leading-relaxed text-lg"><LinkedText text={text} /></p>
      ))}
    </div>
  );
}

function processCols(count: number): string {
  if (count === 2) return "md:grid-cols-2";
  if (count === 4) return "md:grid-cols-2 lg:grid-cols-4";
  if (count >= 5) return "md:grid-cols-2 lg:grid-cols-3";
  return "md:grid-cols-3";
}

export function BlockRenderer({ blocks, className, excludeSlug, serviceImages }: { blocks: Block[], className?: string, excludeSlug?: string, serviceImages?: Record<string, string> }) {
  const groups = buildGroups(blocks);

  return (
    <CityLinkProvider excludeSlug={excludeSlug}>
    <div className={cn("relative z-10 w-full space-y-16", className)}>
      {groups.map((group, idx) => {
        if (group.type === 'faq') {
          return (
            <div key={idx} className="my-16 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-foreground tracking-tight">{group.title}</h2>
              <IntroParagraphs intro={group.intro} />
              <Accordion type="single" collapsible className="w-full bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                {group.items.map((faq, fIdx) => (
                  <AccordionItem key={fIdx} value={`faq-${idx}-${fIdx}`} className="border-b border-border/50 last:border-0">
                    <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground font-medium leading-relaxed pb-6 text-base space-y-4">
                      <Paragraphs text={faq.a} />
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
              <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-center text-foreground tracking-tight">{group.title}</h2>
              <div className="text-center">
                <IntroParagraphs intro={group.intro} />
              </div>
              <div className={cn("grid grid-cols-1 gap-10 relative mt-4", processCols(group.items.length))}>
                <div className="hidden md:block absolute top-12 left-[8%] right-[8%] h-0.5 bg-border -z-10"></div>
                {group.items.map((step, sIdx) => (
                  <div key={sIdx} className="relative flex flex-col items-center text-center group">
                    <div className="w-24 h-24 rounded-full bg-background border-4 border-muted flex items-center justify-center text-3xl font-extrabold text-muted-foreground mb-6 group-hover:border-primary group-hover:text-primary transition-colors duration-500 shadow-sm z-10">
                      {sIdx + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                    <div className="text-muted-foreground font-medium leading-relaxed space-y-3">
                      <Paragraphs text={step.text} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (group.type === 'grid') {
          const useImages = !!serviceImages && group.items.length > 0 && group.items.every((it) => serviceImages[it.title]);
          if (useImages) {
            return (
              <div key={idx} className="my-16">
                {group.title && <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-foreground tracking-tight">{group.title}</h2>}
                <div className="mb-12 space-y-4 max-w-4xl">
                  {group.intro.map((text, iIdx) => (
                    <p key={iIdx} className="text-muted-foreground font-medium leading-relaxed text-lg"><LinkedText text={text} /></p>
                  ))}
                </div>
                <div className="space-y-14 md:space-y-20">
                  {group.items.map((item, gIdx) => (
                    <div key={gIdx} className={cn("flex flex-col gap-6 md:gap-10 md:items-center", gIdx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row")}>
                      <div className="md:w-1/2 shrink-0">
                        <div className="relative overflow-hidden rounded-2xl shadow-md border border-border/60 aspect-[4/3] group">
                          <img src={serviceImages![item.title]} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none"></div>
                        </div>
                      </div>
                      <div className="md:w-1/2">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground tracking-tight">{item.title}</h3>
                        <div className="text-muted-foreground font-medium leading-relaxed space-y-3 text-lg">
                          <Paragraphs text={item.text} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={idx} className="my-16">
              {group.title && <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-foreground tracking-tight">{group.title}</h2>}
              <div className="mb-10 space-y-4 max-w-4xl">
                {group.intro.map((text, iIdx) => (
                  <p key={iIdx} className="text-muted-foreground font-medium leading-relaxed text-lg"><LinkedText text={text} /></p>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.items.map((item, gIdx) => {
                  const citySlug = resolveCitySlug(item.title);
                  return (
                    <div key={gIdx} className="bg-card border border-border/60 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                          <div className="text-muted-foreground font-medium leading-relaxed space-y-3">
                            <Paragraphs text={item.text} />
                          </div>
                          {citySlug && (
                            <Link href={`/service-areas/${citySlug}`} className="mt-4 inline-flex items-center gap-1.5 font-bold text-sm text-primary hover:gap-2.5 transition-all">
                              Read More
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        if (group.type === 'cta') {
          return (
            <div key={idx} className="my-16 max-w-4xl mx-auto">
              <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-foreground tracking-tight">{group.title}</h2>
                <div className="max-w-3xl mx-auto mb-8 space-y-4">
                  {group.blocks
                    .filter((b) => b.type === 'p')
                    .map((b, bIdx) => (
                      <p key={bIdx} className="text-muted-foreground font-medium leading-relaxed text-lg">
                        <LinkedText text={b.text} />
                      </p>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/get-a-quote">
                    <Button size="lg" className="font-bold h-14 rounded-full px-8 shadow-md group">
                      REQUEST A QUOTE
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <a href={`tel:${BRAND.phoneTel}`}>
                    <Button variant="outline" size="lg" className="font-bold h-14 rounded-full px-8 bg-background">
                      <Phone className="mr-2 h-4 w-4 text-primary" />
                      {BRAND.phoneDisplay}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          );
        }

        if (group.type === 'prose') {
          const elements: ReactNode[] = [];
          let liBuffer: Block[] = [];
          const flushList = () => {
            if (liBuffer.length === 0) return;
            const items = liBuffer;
            elements.push(
              <ul key={`ul-${elements.length}`}>
                {items.map((li, liIdx) => (
                  <li key={liIdx}><LinkedText text={li.text} /></li>
                ))}
              </ul>
            );
            liBuffer = [];
          };
          group.blocks.forEach((block, bIdx) => {
            if (block.type === 'li') {
              liBuffer.push(block);
              return;
            }
            flushList();
            if (block.type === 'h2') elements.push(<h2 key={bIdx}>{block.text}</h2>);
            else if (block.type === 'h3') elements.push(<h3 key={bIdx}>{block.text}</h3>);
            else if (block.type === 'p') elements.push(<p key={bIdx}><LinkedText text={block.text} /></p>);
          });
          flushList();
          return (
            <div key={idx} className="prose prose-stone lg:prose-lg max-w-4xl mx-auto prose-headings:font-extrabold prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:tracking-tight prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-p:font-medium prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:font-medium prose-li:text-muted-foreground prose-strong:text-foreground">
              {elements}
            </div>
          );
        }

        return null;
      })}
    </div>
    </CityLinkProvider>
  );
}
