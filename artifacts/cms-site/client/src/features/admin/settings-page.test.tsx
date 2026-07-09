import { describe, expect, it } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import AdminSettingsPage from "@/features/admin/settings-page";

describe("AdminSettingsPage", () => {
  function renderSettingsPage() {
    (globalThis as typeof globalThis & { React?: typeof React }).React = React;
    (globalThis as typeof globalThis & { location?: Location }).location = {
      pathname: "/admin/settings",
      search: "",
      hash: "",
    } as Location;
    const client = new QueryClient();

    return renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(AdminSettingsPage),
      ),
    );
  }

  it("renders Google Reviews API integration settings", () => {
    const html = renderSettingsPage();

    expect(html).toContain("Integrations");
    expect(html).toContain("Google Reviews API");
    expect(html).toContain("Google Place ID");
    expect(html).toContain("Google Places API Key");
  });
});
