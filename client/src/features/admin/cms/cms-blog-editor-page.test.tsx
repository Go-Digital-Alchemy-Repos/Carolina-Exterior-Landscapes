// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import CmsBlogEditorPage from "./cms-blog-editor-page";

vi.mock("wouter", () => ({
  useLocation: () => ["/admin/cms/blog/new", vi.fn()],
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
    React.createElement("div", null, children),
}));

vi.mock("@/features/admin/cms/components/cms-image-upload", () => ({
  CmsImageUpload: () => React.createElement("div"),
}));

vi.mock("@/features/admin/cms/builder/cms-rich-text-editor", () => ({
  CmsRichTextEditor: ({
    value,
    onChange,
    ...props
  }: {
    value: string;
    onChange: (value: string) => void;
  }) =>
    React.createElement("textarea", {
      value,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
      ...props,
    }),
}));

vi.mock("@/hooks/use-editor-lock", () => ({
  useEditorLock: () => ({ hasLocking: false, isReadOnly: false, summary: null }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
  queryClient: { invalidateQueries: vi.fn(), setQueryData: vi.fn() },
}));

describe("CMS blog editor layout", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
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

  it("places status before View Live and makes content cards collapsible", async () => {
    root = createRoot(container);
    await act(async () => root!.render(React.createElement(CmsBlogEditorPage)));

    const status = container.querySelector('[data-testid="select-blog-status"]') as HTMLElement;
    const viewLive = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("View Live"),
    );
    const postDetails = container.querySelector(
      '[data-testid="button-toggle-post-details"]',
    ) as HTMLButtonElement;

    expect(status.compareDocumentPosition(viewLive!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(container.textContent).not.toContain("Publication");
    expect(container.querySelector('[data-testid="button-toggle-hero-content"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="button-toggle-faq"]')).toBeTruthy();
    expect(postDetails.getAttribute("aria-expanded")).toBe("true");

    await act(async () => postDetails.click());

    expect(postDetails.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("#blog-title")).toBeNull();
  });

  it("adds and removes FAQ questions", async () => {
    root = createRoot(container);
    await act(async () => root!.render(React.createElement(CmsBlogEditorPage)));

    const addButton = container.querySelector(
      '[data-testid="button-add-blog-faq"]',
    ) as HTMLButtonElement;
    await act(async () => addButton.click());

    expect(container.querySelector('[data-testid="input-blog-faq-question-0"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="editor-blog-faq-answer-0"]')).toBeTruthy();

    const removeButton = container.querySelector(
      '[data-testid="button-remove-blog-faq-0"]',
    ) as HTMLButtonElement;
    await act(async () => removeButton.click());

    expect(container.querySelector('[data-testid="input-blog-faq-question-0"]')).toBeNull();
  });
});
