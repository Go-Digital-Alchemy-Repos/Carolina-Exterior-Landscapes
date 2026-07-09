import express from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPage = vi.fn();
const mockGetPageBySlug = vi.fn();

vi.mock("../storage", () => ({
  storage: {
    cmsGalleries: {
      getPublishedByIdOrSlug: vi.fn(),
    },
    cmsMenus: {
      getAll: vi.fn(),
      getByLocation: vi.fn(),
    },
    cmsPages: {
      getAllPages: vi.fn(),
      getPage: mockGetPage,
      getPageBySlug: mockGetPageBySlug,
    },
    cmsSidebars: {
      getDefault: vi.fn(),
      getById: vi.fn(),
    },
  },
}));

describe("public CMS routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves the public contact slug to the linked CMS page alias", async () => {
    mockGetPageBySlug.mockResolvedValue(undefined);
    mockGetPage.mockResolvedValue({
      id: "66e31a59-5278-4708-bcba-0da6cb06e154",
      title: "Contact Carolina Exterior Landscapes",
      slug: "contact-carolina-exterior-landscapes",
      status: "draft",
      pageType: "custom",
      content: { blocks: [{ id: "hero", type: "hero", props: {} }] },
    });

    const { default: cmsPublicRoutes } = await import("./cms-public.routes");
    const app = express();
    app.use("/api/cms", cmsPublicRoutes);
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start");

    const res = await fetch(`http://127.0.0.1:${address.port}/api/cms/pages/by-slug/contact`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockGetPageBySlug).toHaveBeenCalledWith("contact");
    expect(mockGetPage).toHaveBeenCalledWith("66e31a59-5278-4708-bcba-0da6cb06e154");
    expect(body.id).toBe("66e31a59-5278-4708-bcba-0da6cb06e154");

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
