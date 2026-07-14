// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import CmsBlogEditorPage from "./cms-blog-editor-page";

const navigateMock = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/admin/cms/blog/new", navigateMock],
  useParams: () => ({ id: "new" }),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: () => ({ data: undefined, isLoading: false }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

vi.mock("@/features/admin/admin-sidebar", () => ({
  AdminSidebar: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "admin-sidebar" }, children),
}));

vi.mock("@/features/admin/cms/components/cms-image-upload", () => ({
  CmsImageUpload: () => React.createElement("div", { "data-testid": "mock-image-upload" }),
}));

vi.mock("@/hooks/use-editor-lock", () => ({
  useEditorLock: () => ({
    hasLocking: false,
    isReadOnly: false,
    summary: null,
    isLoading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
  queryClient: { invalidateQueries: vi.fn() },
}));

describe("CMS Blog editor", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    navigateMock.mockReset();
    root = null;
    (
      globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).React = React;
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
    document.body.innerHTML = "";
  });

  it("places post status before View Live and removes the bottom publication card", async () => {
    root = createRoot(container);

    await act(async () => {
      root!.render(React.createElement(CmsBlogEditorPage));
    });

    const status = container.querySelector('[data-testid="select-blog-status"]') as HTMLElement;
    const viewLive = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("View Live"),
    );

    expect(status).toBeTruthy();
    expect(status.textContent).toContain("Draft");
    expect(viewLive).toBeTruthy();
    expect(status.compareDocumentPosition(viewLive!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(container.textContent).not.toContain("Publish this post");
  });

  it("lets an editor collapse and reopen the Post Details card", async () => {
    root = createRoot(container);

    await act(async () => {
      root!.render(React.createElement(CmsBlogEditorPage));
    });

    const toggle = container.querySelector(
      '[data-testid="button-toggle-post-details"]',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector("#blog-title")).toBeTruthy();

    await act(async () => toggle.click());

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("#blog-title")).toBeNull();

    await act(async () => toggle.click());

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector("#blog-title")).toBeTruthy();
  });

  it("provides a separate FAQ card with title, description, and repeatable questions", async () => {
    root = createRoot(container);

    await act(async () => {
      root!.render(React.createElement(CmsBlogEditorPage));
    });

    expect(container.querySelector('[data-testid="button-toggle-faq"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="input-blog-faq-title"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="textarea-blog-faq-description"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="input-blog-faq-question-0"]')).toBeNull();

    const addButton = container.querySelector(
      '[data-testid="button-add-blog-faq"]',
    ) as HTMLButtonElement;
    await act(async () => addButton.click());

    expect(container.querySelector('[data-testid="input-blog-faq-question-0"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="textarea-blog-faq-answer-0"]')).toBeTruthy();

    const removeButton = container.querySelector(
      '[data-testid="button-remove-blog-faq-0"]',
    ) as HTMLButtonElement;
    await act(async () => removeButton.click());

    expect(container.querySelector('[data-testid="input-blog-faq-question-0"]')).toBeNull();
  });
});
