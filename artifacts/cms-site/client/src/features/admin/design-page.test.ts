import { describe, expect, it } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import AdminDesignPage from "@/features/admin/design-page";

describe("AdminDesignPage", () => {
  function renderDesignPage(initialSubview: "branding" | "colors" | "typography") {
    (globalThis as typeof globalThis & { React?: typeof React }).React = React;
    (globalThis as typeof globalThis & { location?: Location }).location = {
      pathname: `/admin/design/${initialSubview}`,
      search: "",
      hash: "",
    } as Location;
    const client = new QueryClient();

    return renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(AdminDesignPage, { initialSubview }),
      ),
    );
  }

  it("renders branding controls", () => {
    const html = renderDesignPage("branding");

    expect(html).toContain("Public Identity");
    expect(html).toContain("Header Logo");
    expect(html).toContain("Footer Logo");
    expect(html).toContain("Favicon / Admin Icon");
    expect(html).toContain("/images/header-logo-horizontal.svg");
    expect(html).toContain("/images/footer-logo-horizontal.svg");
    expect(html).toContain("/images/symbol.svg");
  });

  it("renders color controls", () => {
    const html = renderDesignPage("colors");

    expect(html).toContain("Brand Colors");
    expect(html).toContain("Text Colors");
    expect(html).toContain("Primary Leaf Green");
    expect(html).toContain("#53823C");
    expect(html).toContain("#103F27");
  });

  it("renders typography controls", () => {
    const html = renderDesignPage("typography");

    expect(html).toContain("Frontend Typography");
    expect(html).toContain("Body Font");
    expect(html).toContain("Heading Font");
    expect(html).toContain("Heading Font Picker");
    expect(html).toContain("Body Font Picker");
    expect(html).toContain("Sans Serif Options");
    expect(html).toContain("Serif Options");
    expect(html).toContain("Save Typography");
    expect(html).toContain("Manrope");
  });
});
