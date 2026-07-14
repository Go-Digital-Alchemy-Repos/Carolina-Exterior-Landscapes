// @vitest-environment jsdom

import React, { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsForm } from "@shared/schema";
import { PublicFormRenderer } from "./public-form-renderer";

describe("PublicFormRenderer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).React = React;
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: MockResizeObserver,
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders grid multiselect fields as quote-style checkboxes", async () => {
    const form = {
      id: "residential-quote-id",
      name: "Residential Quote Form",
      slug: "residential-quote",
      description: "Request an estimate.",
      fields: [
        {
          id: "services-interested",
          key: "servicesInterested",
          label: "Services Needed",
          type: "multiselect",
          placeholder: "",
          helpText: "",
          required: false,
          width: "full",
          options: [
            { label: "Lawn Maintenance", value: "Lawn Maintenance" },
            { label: "Drainage Solutions", value: "Drainage Solutions" },
          ],
          config: { selectionMode: "multiple", choiceLayout: "grid" },
        },
      ],
      settings: { submitButtonText: "Request Quote" },
    } as unknown as CmsForm;
    const queryClient = new QueryClient();
    queryClient.setQueryData(["/api/forms", "residential-quote"], form);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <PublicFormRenderer slug="residential-quote" appearance="quote" />
        </QueryClientProvider>,
      );
    });

    expect(container.querySelector("select[multiple]")).toBeNull();
    expect(container.querySelectorAll('[role="checkbox"]')).toHaveLength(2);
    expect(container.textContent).toContain("Services Needed (Select all that apply)");
    expect(container.querySelector('button[type="submit"]')?.className).toContain("w-full");
    expect(container.textContent).toContain("What kind of quote do you need?");
    expect(container.textContent).toContain("Residential");
    expect(container.textContent).toContain("Commercial");
  });

  it("switches from residential to commercial quote fields", async () => {
    const residential = {
      id: "residential-id",
      name: "Residential Quote Form",
      slug: "residential-quote",
      fields: [
        {
          id: "name",
          key: "name",
          label: "Full Name",
          type: "text",
          required: true,
          width: "full",
          options: [],
          config: {},
        },
      ],
      settings: {},
    } as unknown as CmsForm;
    const commercial = {
      id: "commercial-id",
      name: "Commercial Quote Form",
      slug: "commercial-quote",
      fields: [
        {
          id: "company",
          key: "companyName",
          label: "Company / HOA Name",
          type: "text",
          required: true,
          width: "full",
          options: [],
          config: {},
        },
      ],
      settings: {},
    } as unknown as CmsForm;
    const queryClient = new QueryClient();
    queryClient.setQueryData(["/api/forms", "residential-quote"], residential);
    queryClient.setQueryData(["/api/forms", "commercial-quote"], commercial);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <PublicFormRenderer slug="residential-quote" appearance="quote" />
        </QueryClientProvider>,
      );
    });

    const commercialButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Commercial",
    );
    await act(async () => commercialButton?.click());

    expect(container.textContent).toContain("Company / HOA Name");
    expect(container.textContent).not.toContain("Full Name");
  });
});
