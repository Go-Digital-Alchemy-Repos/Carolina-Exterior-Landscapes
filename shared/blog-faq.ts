export type BlogContentBlock = { type: "h2" | "h3" | "p" | "li"; text: string };

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogFaq = {
  title: string;
  description: string;
  items: BlogFaqItem[];
};

const FAQ_HEADING_PATTERN = /\bfaq\b|frequently asked/i;

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeBlogFaq(value: unknown): BlogFaq | null {
  const faq = objectValue(value);
  const rawItems = Array.isArray(faq.items) ? faq.items : [];
  const items = rawItems
    .map((value) => {
      const item = objectValue(value);
      return {
        question: typeof item.question === "string" ? item.question.trim() : "",
        answer: typeof item.answer === "string" ? item.answer.trim() : "",
      };
    })
    .filter((item) => item.question && item.answer);

  if (items.length === 0) return null;

  return {
    title:
      typeof faq.title === "string" && faq.title.trim()
        ? faq.title.trim()
        : "Frequently Asked Questions",
    description: typeof faq.description === "string" ? faq.description.trim() : "",
    items,
  };
}

export function splitBlogFaqBlocks(blocks: BlogContentBlock[]): {
  blocks: BlogContentBlock[];
  faq: BlogFaq | null;
} {
  const start = blocks.findIndex(
    (block) => block.type === "h2" && FAQ_HEADING_PATTERN.test(block.text),
  );
  if (start < 0) return { blocks, faq: null };

  let end = blocks.length;
  for (let index = start + 1; index < blocks.length; index += 1) {
    if (blocks[index].type === "h2") {
      end = index;
      break;
    }
  }

  const section = blocks.slice(start + 1, end);
  const descriptionParts: string[] = [];
  let index = 0;
  while (index < section.length && section[index].type === "p") {
    descriptionParts.push(section[index].text);
    index += 1;
  }

  const items: BlogFaqItem[] = [];
  while (index < section.length) {
    const questionBlock = section[index];
    if (questionBlock.type !== "h3") return { blocks, faq: null };
    index += 1;

    const answerParts: string[] = [];
    while (index < section.length && section[index].type !== "h3") {
      const answerBlock = section[index];
      if (answerBlock.type !== "p" && answerBlock.type !== "li") {
        return { blocks, faq: null };
      }
      answerParts.push(answerBlock.type === "li" ? `• ${answerBlock.text}` : answerBlock.text);
      index += 1;
    }

    const question = questionBlock.text.trim();
    const answer = answerParts.join("\n\n").trim();
    if (!question || !answer) return { blocks, faq: null };
    items.push({ question, answer });
  }

  if (items.length === 0) return { blocks, faq: null };

  return {
    blocks: [...blocks.slice(0, start), ...blocks.slice(end)],
    faq: {
      title: blocks[start].text.trim() || "Frequently Asked Questions",
      description: descriptionParts.join("\n\n").trim(),
      items,
    },
  };
}
