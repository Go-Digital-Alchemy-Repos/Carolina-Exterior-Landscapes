// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { PublicBlockRenderer } from "./public-block-renderer";
import type { BlockInstance } from "@/features/admin/cms/builder/block-registry";

vi.mock("@/components/shared/branding-provider", () => ({
  useBranding: () => ({
    companyGoogleBusinessUrl: "https://example.com/google-business",
  }),
}));

function heroBlock(props: Record<string, unknown>, id = "hero-test"): BlockInstance {
  return {
    id,
    type: "hero",
    props: {
      heading: "Hero heading",
      backgroundImageUrl: "/images/hero-test.webp",
      ...props,
    },
  };
}

function textImageBlock(id: string, props: Record<string, unknown>): BlockInstance {
  return {
    id,
    type: "text-image",
    props: {
      heading: "Van and Zaahira Orcutt — Owners",
      body: "Owners copy",
      imageUrl: "/images/cca-family-owners-2.webp",
      imageAlt: "Van and Zaahira Orcutt",
      imagePosition: "right",
      ...props,
    },
  };
}

function mockGoogleReviews(reviews: Array<Record<string, unknown>>) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      configured: true,
      enabled: true,
      placeName: "Carolina Exterior Landscapes",
      placeUrl: "https://example.com/google-business",
      rating: 5,
      userRatingCount: 24,
      reviews,
      updatedAt: "2026-07-09T12:00:00.000Z",
    }),
  }));
}

describe("PublicBlockRenderer hero", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }).React = React;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    class MockObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      value: MockObserver,
    });
    Object.defineProperty(globalThis, "IntersectionObserver", {
      writable: true,
      value: MockObserver,
    });
    Object.defineProperty(window, "ResizeObserver", {
      writable: true,
      value: MockObserver,
    });
    Object.defineProperty(globalThis, "ResizeObserver", {
      writable: true,
      value: MockObserver,
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    container.remove();
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("uses hero readability defaults when new props are missing", async () => {
    await act(async () => {
      root!.render(React.createElement(PublicBlockRenderer, { block: heroBlock({}) }));
    });

    const image = container.querySelector('[data-testid="hero-background-image"]') as HTMLImageElement | null;
    const overlay = container.querySelector('[data-testid="hero-overlay"]') as HTMLDivElement | null;
    const gradient = container.querySelector('[data-testid="hero-gradient"]') as HTMLDivElement | null;
    const heading = container.querySelector("h1") as HTMLHeadingElement | null;

    expect(image?.style.opacity).toBe("1");
    expect(image?.style.objectPosition).toBe("50% 50%");
    expect(overlay?.style.opacity).toBe("0.2");
    expect(gradient?.style.height).toBe("40%");
    expect(gradient?.style.opacity).toBe("0.75");
    expect(gradient?.style.backgroundImage).toContain("linear-gradient");
    expect(heading?.className).toContain("max-[640px]:ml-[1vw]");
    expect(heading?.className).toContain("max-[640px]:max-w-[92%]");
    expect(heading?.className).toContain("max-[640px]:text-[clamp(2.375rem,9.5vw,3.25rem)]");
    expect(heading?.className).toContain("max-[640px]:leading-[0.95]");
  });

  it("renders hero eyebrow text in the shared eyebrow badge", async () => {
    await act(async () => {
      root!.render(React.createElement(PublicBlockRenderer, { block: heroBlock({ eyebrow: "Residential Landscaping" }) }));
    });

    const eyebrow = container.querySelector('[data-testid="hero-eyebrow"]') as HTMLSpanElement | null;

    expect(eyebrow?.textContent).toBe("Residential Landscaping");
    expect(eyebrow?.className).toContain("public-eyebrow-badge");
    expect(eyebrow?.className).not.toContain("text-white");
    expect(eyebrow?.className).not.toContain("text-primary");
  });

  it("gives interior heroes additional vertical breathing room", async () => {
    await act(async () => {
      root!.render(React.createElement(PublicBlockRenderer, { block: heroBlock({ variant: "interior" }) }));
    });

    const hero = container.querySelector('[data-testid="block-hero"]') as HTMLElement | null;

    expect(hero?.className).toContain("min-h-[620px]");
    expect(hero?.className).toContain("sm:min-h-[620px]");
    expect(hero?.className).toContain("lg:min-h-[680px]");
  });

  it("uses the landscape service hero readability fallback", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({ backgroundImageUrl: "/images/hero-drainage.png" }),
        }),
      );
    });

    const overlay = container.querySelector('[data-testid="hero-overlay"]') as HTMLDivElement | null;

    expect(overlay?.style.opacity).toBe("0.2");
  });

  it("applies custom hero opacity, overlay, and gradient settings", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            backgroundPositionX: 72,
            backgroundPositionY: 45,
            backgroundImageOpacity: 82,
            overlayColor: "#123456",
            overlayOpacity: 12,
            gradientColor: "#abcdef",
            gradientOpacity: 33,
            gradientHeight: 25,
          }),
        }),
      );
    });

    const image = container.querySelector('[data-testid="hero-background-image"]') as HTMLImageElement | null;
    const overlay = container.querySelector('[data-testid="hero-overlay"]') as HTMLDivElement | null;
    const gradient = container.querySelector('[data-testid="hero-gradient"]') as HTMLDivElement | null;

    expect(image?.style.opacity).toBe("0.82");
    expect(image?.style.objectPosition).toBe("72% 45%");
    expect(overlay?.style.backgroundColor).toBe("rgb(18, 52, 86)");
    expect(overlay?.style.opacity).toBe("0.12");
    expect(gradient?.style.height).toBe("25%");
    expect(gradient?.style.opacity).toBe("0.33");
    expect(gradient?.style.backgroundImage).toContain("rgb(171, 205, 239)");
  });

  it("applies a custom hero pixel height when provided", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({ heroHeightPx: 740 }),
        }),
      );
    });

    const hero = container.querySelector('[data-testid="block-hero"]') as HTMLElement | null;

    expect(hero?.style.minHeight).toBe("740px");
  });

  it("omits the hero gradient when disabled", async () => {
    await act(async () => {
      root!.render(React.createElement(PublicBlockRenderer, { block: heroBlock({ gradientEnabled: false }) }));
    });

    expect(container.querySelector('[data-testid="hero-gradient"]')).toBeNull();
  });

  it("strips saved paragraph tags from hero h1 text", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({ heading: "<p>Landscape Design Solutions</p>" }),
        }),
      );
    });

    const heading = container.querySelector("h1") as HTMLHeadingElement | null;

    expect(heading?.textContent).toBe("Landscape Design Solutions");
    expect(heading?.textContent).not.toContain("</p>");
  });

  it("strips saved paragraph tags from hero supporting copy", async () => {
    await act(async () => {
      root!.render(React.createElement(PublicBlockRenderer, {
        block: heroBlock({ subheading: "<p>Landscaping built around your property.</p>" }),
      }));
    });

    const content = container.querySelector('[data-testid="hero-content"]');
    expect(content?.textContent).toContain("Landscaping built around your property.");
    expect(content?.textContent).not.toContain("<p>");
  });

  it("aligns hero subheading and actions with left hero headings", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            alignment: "left",
            subheading: "Supporting copy",
            ctaText: "Request an Estimate",
            ctaLink: "/contact",
          }),
        }),
      );
    });

    const outer = container.querySelector('[data-testid="block-hero"] > div:last-child') as HTMLDivElement | null;
    const content = container.querySelector('[data-testid="hero-content"]') as HTMLDivElement | null;
    const subheading = container.querySelector("p") as HTMLParagraphElement | null;
    const actions = container.querySelector("p + div") as HTMLDivElement | null;

    expect(outer?.className).toContain("max-w-7xl");
    expect(content?.className).toContain("mr-auto");
    expect(content?.className).toContain("text-left");
    expect(subheading?.className).not.toContain("mx-auto");
    expect(actions?.className).toContain("justify-start");
  });

  it("keeps hero subheading and actions centered with centered headings", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            alignment: "center",
            subheading: "Supporting copy",
            ctaText: "Request an Estimate",
            ctaLink: "/contact",
          }),
        }),
      );
    });

    const content = container.querySelector('[data-testid="hero-content"]') as HTMLDivElement | null;
    const subheading = container.querySelector("p") as HTMLParagraphElement | null;
    const actions = container.querySelector("p + div") as HTMLDivElement | null;

    expect(content?.className).toContain("mx-auto");
    expect(content?.className).toContain("text-center");
    expect(subheading?.className).toContain("mx-auto");
    expect(actions?.className).toContain("justify-center");
  });

  it.each(["services-hero", "access-control-systems-1-hero", "burglar-alarm-installation-1-hero"])(
    "forces service hero content and container left on desktop for %s even when CMS alignment is centered",
    async (blockId) => {
      await act(async () => {
        root!.render(
          React.createElement(PublicBlockRenderer, {
            block: heroBlock(
              {
                alignment: "center",
                subheading: "Supporting copy",
                ctaText: "Request an Estimate",
                ctaLink: "/contact",
              },
              blockId,
            ),
          }),
        );
      });

      const outer = container.querySelector('[data-testid="block-hero"] > div:last-child') as HTMLDivElement | null;
      const content = container.querySelector('[data-testid="hero-content"]') as HTMLDivElement | null;
      const subheading = container.querySelector("p") as HTMLParagraphElement | null;
      const actions = container.querySelector("p + div") as HTMLDivElement | null;

      expect(outer?.className).toContain("max-w-7xl");
      expect(outer?.className).toContain("min-[641px]:mx-0");
      expect(outer?.className).toContain("min-[641px]:max-w-none");
      expect(outer?.className).toContain("min-[641px]:px-16");
      expect(outer?.className).toContain("xl:px-24");
      expect(content?.className).toContain("mx-auto");
      expect(content?.className).toContain("text-center");
      expect(content?.className).toContain("min-[641px]:ml-0");
      expect(content?.className).toContain("min-[641px]:mr-auto");
      expect(content?.className).toContain("min-[641px]:text-left");
      expect(subheading?.className).toContain("min-[641px]:mx-0");
      expect(actions?.className).toContain("min-[641px]:justify-start");
    },
  );

  it.each(["charlotte-nc-1-hero", "matthews-nc-1-hero", "indian-trail-nc-1-hero"])(
    "forces service location hero content and container left on desktop for %s",
    async (blockId) => {
      await act(async () => {
        root!.render(
          React.createElement(PublicBlockRenderer, {
            block: heroBlock(
              {
                alignment: "center",
                heading: "Commercial Security System Installation in Charlotte, NC",
              },
              blockId,
            ),
          }),
        );
      });

      const outer = container.querySelector('[data-testid="block-hero"] > div:last-child') as HTMLDivElement | null;
      const content = container.querySelector('[data-testid="hero-content"]') as HTMLDivElement | null;

      expect(outer?.className).toContain("min-[641px]:mx-0");
      expect(outer?.className).toContain("min-[641px]:max-w-none");
      expect(outer?.className).toContain("min-[641px]:px-16");
      expect(content?.className).toContain("min-[641px]:ml-0");
      expect(content?.className).toContain("min-[641px]:mr-auto");
      expect(content?.className).toContain("min-[641px]:text-left");
    },
  );

  it.each([
    ["Landscaping Services in Matthews, NC", "Landscaping ServicesMatthews, NC"],
    ["Landscaping Services in Indian Trail, NC", "Landscaping ServicesIndian Trail, NC"],
  ])("uses shorter mobile location H1 variants for %s", async (fullHeading, mobileHeading) => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            heading: fullHeading,
          }),
        }),
      );
    });

    const heading = container.querySelector("h1") as HTMLHeadingElement | null;
    const desktopText = heading?.querySelector("span.max-\\[640px\\]\\:hidden") as HTMLSpanElement | null;
    const mobileText = heading?.querySelector("span.hidden") as HTMLSpanElement | null;

    expect(heading?.className).toContain("max-[640px]:ml-[2vw]");
    expect(heading?.className).not.toContain("max-[640px]:ml-[1vw]");
    expect(desktopText?.textContent).toBe(fullHeading);
    expect(mobileText?.textContent).toBe(mobileHeading);
    expect(mobileText?.querySelector("br")).not.toBeNull();
  });

  it("uses the shorter mobile lawn maintenance H1 while preserving the full desktop H1", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            heading: "Annual Lawn Maintenance in Waxhaw, NC",
          }),
        }),
      );
    });

    const heading = container.querySelector("h1") as HTMLHeadingElement | null;
    const desktopText = heading?.querySelector("span.max-\\[640px\\]\\:hidden") as HTMLSpanElement | null;
    const mobileText = heading?.querySelector("span.hidden") as HTMLSpanElement | null;

    expect(heading?.className).toContain("max-[640px]:text-[clamp(2.375rem,9.5vw,3.25rem)]");
    expect(heading?.className).toContain("max-[640px]:leading-[0.95]");
    expect(heading?.className).toContain("max-[640px]:ml-[1vw]");
    expect(heading?.className).toContain("tracking-normal");
    expect(desktopText?.textContent).toBe("Annual Lawn Maintenance in Waxhaw, NC");
    expect(mobileText?.textContent).toBe("Annual LawnMaintenance in Waxhaw");
    expect(mobileText?.querySelector("br")).not.toBeNull();
  });

  it("uses shorter mobile service H1 variants while preserving desktop H1 text", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            heading: "Commercial Grounds Maintenance in Charlotte, NC",
          }),
        }),
      );
    });

    const heading = container.querySelector("h1") as HTMLHeadingElement | null;
    const desktopText = heading?.querySelector("span.max-\\[640px\\]\\:hidden") as HTMLSpanElement | null;
    const mobileText = heading?.querySelector("span.hidden") as HTMLSpanElement | null;

    expect(desktopText?.textContent).toBe("Commercial Grounds Maintenance in Charlotte, NC");
    expect(mobileText?.textContent).toBe("Commercial GroundsMaintenance in Charlotte");
    expect(mobileText?.querySelector("br")).not.toBeNull();
  });

  it("uses a CMS mobile hero heading only on mobile while preserving the desktop H1", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            heading: "Commercial Grounds Maintenance in Charlotte, NC",
            mobileHeading: "Commercial Grounds\nMaintenance Charlotte",
          }),
        }),
      );
    });

    const heading = container.querySelector("h1") as HTMLHeadingElement | null;
    const desktopText = heading?.querySelector("span.max-\\[640px\\]\\:hidden") as HTMLSpanElement | null;
    const mobileText = heading?.querySelector("span.hidden") as HTMLSpanElement | null;

    expect(desktopText?.textContent).toBe("Commercial Grounds Maintenance in Charlotte, NC");
    expect(mobileText?.textContent).toBe("Commercial GroundsMaintenance Charlotte");
    expect(mobileText?.querySelector("br")).not.toBeNull();
  });

  it("keeps shared mobile service H1s tightly inset from the left", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            heading: "Annual Lawn Maintenance in Waxhaw, NC",
          }),
        }),
      );
    });

    const heading = container.querySelector("h1") as HTMLHeadingElement | null;
    expect(heading?.className).toContain("max-[640px]:ml-[1vw]");
    expect(heading?.className).not.toContain("max-[640px]:ml-[2vw]");
    expect(heading?.className).not.toContain("max-[640px]:ml-[4vw]");
    expect(heading?.className).not.toContain("max-[640px]:ml-0");
  });

  it("uses the shared tight mobile offset for the lawn care H1", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            heading: "Annual Lawn Maintenance in Waxhaw, NC",
          }),
        }),
      );
    });

    const heading = container.querySelector("h1") as HTMLHeadingElement | null;
    const mobileText = heading?.querySelector("span.hidden") as HTMLSpanElement | null;

    expect(heading?.className).toContain("max-[640px]:ml-[1vw]");
    expect(heading?.className).not.toContain("max-[640px]:ml-[2vw]");
    expect(heading?.className).not.toContain("max-[640px]:ml-0");
    expect(mobileText?.textContent).toBe("Annual LawnMaintenance in Waxhaw");
  });

  it("moves right aligned hero content to the right side of the hero container", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: heroBlock({
            alignment: "right",
            subheading: "Supporting copy",
            ctaText: "Request an Estimate",
            ctaLink: "/contact",
          }),
        }),
      );
    });

    const content = container.querySelector('[data-testid="hero-content"]') as HTMLDivElement | null;
    const subheading = container.querySelector("p") as HTMLParagraphElement | null;
    const actions = container.querySelector("p + div") as HTMLDivElement | null;

    expect(content?.className).toContain("ml-auto");
    expect(content?.className).toContain("text-right");
    expect(subheading?.className).toContain("ml-auto");
    expect(actions?.className).toContain("justify-end");
  });

  it("applies saved focal points to text-image block photos", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: textImageBlock("about-owners", {
            imagePositionX: 28,
            imagePositionY: 64,
          }),
        }),
      );
    });

    const image = container.querySelector('[data-testid="text-image-img"]') as HTMLImageElement | null;

    expect(image?.style.objectPosition).toBe("28% 64%");
  });

  it("applies saved focal points to card grid images", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: {
            id: "card-grid-test",
            type: "cards-grid",
            props: {
              cards: [
                {
                  title: "Camera systems",
                  imageUrl: "/images/cca-camera.webp",
                  imagePositionX: 35,
                  imagePositionY: 20,
                },
              ],
            },
          },
        }),
      );
    });

    const image = container.querySelector('[data-testid="card-grid-image"]') as HTMLImageElement | null;

    expect(image?.style.objectPosition).toBe("35% 20%");
  });

  it("renders rich card grid descriptions", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: {
            id: "rich-card-grid-test",
            type: "cards-grid",
            props: {
              cards: [
                {
                  title: "Mulch options",
                  description: "<p><strong>Black Dyed Mulch:</strong> Creates contrast.</p><ul><li>Holds color longer</li></ul>",
                },
              ],
            },
          },
        }),
      );
    });

    expect(container.querySelector("strong")?.textContent).toBe("Black Dyed Mulch:");
    expect(container.querySelector("li")?.textContent).toBe("Holds color longer");
  });

  it("renders live Google review widgets from the integration feed", async () => {
    mockGoogleReviews([
      {
        authorName: "Jordan",
        authorUrl: null,
        profilePhotoUrl: null,
        rating: 5,
        text: "Careful work and excellent communication.",
        relativeTimeDescription: "a week ago",
        publishTime: "2026-07-01T12:00:00.000Z",
        source: "Google",
      },
      {
        authorName: "Casey",
        authorUrl: null,
        profilePhotoUrl: null,
        rating: 4,
        text: "This should be filtered out.",
        relativeTimeDescription: "2 weeks ago",
        publishTime: "2026-06-25T12:00:00.000Z",
        source: "Google",
      },
    ]);

    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: {
            id: "reviews-test",
            type: "review-widget",
            props: {
              title: "Latest Google Reviews",
              maxReviews: 5,
              showPlaceSummary: true,
            },
          },
        }),
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    const link = container.querySelector('a[href="https://example.com/google-business"]') as HTMLAnchorElement | null;

    expect(container.textContent).toContain("Latest Google Reviews");
    expect(container.textContent).toContain("5.0 Google rating from 24 reviews");
    expect(container.textContent).toContain("Careful work and excellent communication.");
    expect(container.textContent).toContain("Jordan");
    expect(container.textContent).not.toContain("This should be filtered out.");
    expect(link?.textContent).toContain("Read Reviews on Google");
    expect(link?.target).toBe("_blank");
  });

  it("renders Google testimonials with review cards and a Google CTA", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: {
            id: "reviews-list",
            type: "testimonials",
            props: {
              variant: "google-carousel",
              title: "Latest Google Reviews",
              subtitle: "Verified feedback from customers.",
              ctaText: "Read Reviews on Google",
              ctaLink: "https://example.com/reviews",
              items: [
                {
                  quote: "Careful installation and clear communication.",
                  name: "Jordan",
                  role: "Customer",
                  location: "Google review",
                  rating: 5,
                  date: "a week ago",
                },
                {
                  quote: "Responsive from start to finish.",
                  name: "Casey",
                  role: "Customer",
                  location: "Google review",
                  rating: 5,
                  date: "2 weeks ago",
                },
                {
                  quote: "Professional and knowledgeable.",
                  name: "Taylor",
                  role: "Customer",
                  location: "Google review",
                  rating: 5,
                  date: "3 weeks ago",
                },
              ],
            },
          },
        }),
      );
    });

    const block = container.querySelector('[data-testid="block-testimonials"]');
    const link = container.querySelector('a[href="https://example.com/reviews"]') as HTMLAnchorElement | null;

    expect(block?.textContent).toContain("Latest Google Reviews");
    expect(block?.textContent).toContain("Careful installation and clear communication.");
    expect(block?.textContent).toContain("Jordan");
    expect(block?.textContent).toContain("Previous slide");
    expect(block?.textContent).toContain("Next slide");
    expect(link?.textContent).toContain("Read Reviews on Google");
  });

  it("renders FAQ title, rich subtext, and rich answers", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: {
            id: "faq-rich",
            type: "faq",
            props: {
              title: "Commercial FAQs",
              subtext: "<p>Answers for <strong>property managers</strong>.</p>",
              items: [
                {
                  question: "Are you insured?",
                  answer: "<p>Yes. We carry <strong>commercial liability</strong> coverage.</p><script>alert('x')</script>",
                },
              ],
            },
          },
        }),
      );
    });

    const block = container.querySelector('[data-testid="block-faq"]') as HTMLElement | null;
    expect(block?.textContent).toContain("Commercial FAQs");
    expect(block?.textContent).toContain("Answers for property managers.");
    expect(block?.textContent).toContain("Yes. We carry commercial liability coverage.");
    expect(block?.querySelector("strong")?.textContent).toBe("property managers");
    expect(block?.querySelector("script")).toBeNull();
  });

  it("renders a single homepage testimonial with an internal same-window CTA", async () => {
    await act(async () => {
      root!.render(
        React.createElement(PublicBlockRenderer, {
          block: {
            id: "home-reviews",
            type: "testimonials",
            props: {
              variant: "google-carousel",
              title: "What Clients Say About CCA",
              ctaText: "Read More Reviews",
              ctaLink: "/reviews/",
              items: [
                {
                  quote: "Van and his team are amazing!",
                  name: "Laura Erbe",
                  role: "Customer",
                  location: "Google review",
                  rating: 5,
                },
              ],
            },
          },
        }),
      );
    });

    const link = container.querySelector('a[href="/reviews/"]') as HTMLAnchorElement | null;
    const reviewGrid = container.querySelector('[data-testid="block-testimonials"] .grid') as HTMLDivElement | null;

    expect(container.textContent).toContain("What Clients Say About CCA");
    expect(container.textContent).toContain("Laura Erbe");
    expect(container.textContent).not.toContain("Josh Domino");
    expect(reviewGrid?.className).toContain("max-w-2xl");
    expect(reviewGrid?.className).not.toContain("md:grid-cols-2");
    expect(link?.textContent).toContain("Read More Reviews");
    expect(link?.target).toBe("");
    expect(link?.querySelector("svg")).toBeNull();
  });

  it("places the About owners image before the owners text on mobile while preserving desktop order", async () => {
    await act(async () => {
      root!.render(React.createElement(PublicBlockRenderer, { block: textImageBlock("about-owners", {}) }));
    });

    const text = container.querySelector('[data-testid="text-image-text"]') as HTMLDivElement | null;
    const image = container.querySelector('[data-testid="text-image-image"]') as HTMLDivElement | null;
    const renderedImage = container.querySelector('[data-testid="text-image-img"]') as HTMLImageElement | null;
    const role = container.querySelector('[data-testid="owner-heading-role"]') as HTMLParagraphElement | null;

    expect(text?.className).toContain("order-2");
    expect(text?.className).toContain("md:order-1");
    expect(image?.className).toContain("order-1");
    expect(image?.className).toContain("md:order-2");
    expect(renderedImage?.className).toContain("aspect-[5/4]");
    expect(renderedImage?.className).toContain("sm:aspect-[4/3]");
    expect(container.querySelector("h2")?.textContent).toBe("Van and Zaahira Orcutt");
    expect(role?.textContent).toBe("Owners");
  });

  it("places the homepage owners image between the heading and body on mobile", async () => {
    await act(async () => {
      root!.render(React.createElement(PublicBlockRenderer, { block: textImageBlock("home-owner-story", {}) }));
    });

    const containerGrid = container.querySelector('[data-testid="block-text-image"] > div') as HTMLDivElement | null;
    const heading = container.querySelector('[data-testid="text-image-heading"]') as HTMLDivElement | null;
    const text = container.querySelector('[data-testid="text-image-text"]') as HTMLDivElement | null;
    const image = container.querySelector('[data-testid="text-image-image"]') as HTMLDivElement | null;
    const renderedImage = container.querySelector('[data-testid="text-image-img"]') as HTMLImageElement | null;

    expect(Array.from(containerGrid?.children ?? [])).toEqual([heading, image, text]);
    expect(heading?.textContent).toContain("Van and Zaahira Orcutt");
    expect(text?.textContent).toContain("Owners copy");
    expect(image?.className).toContain("md:row-span-2");
    expect(renderedImage?.className).toContain("aspect-[5/4]");
    expect(renderedImage?.className).not.toContain("aspect-[4/3]");
  });
});
