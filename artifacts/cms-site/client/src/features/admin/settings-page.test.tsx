import { describe, expect, it } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import AdminSettingsPage from "@/features/admin/settings-page";

type SettingsResponse = Record<string, Record<string, { value: string; isSecret: boolean }>>;

describe("AdminSettingsPage", () => {
  function renderSettingsPage(settings?: SettingsResponse) {
    (globalThis as typeof globalThis & { React?: typeof React }).React = React;
    (globalThis as typeof globalThis & { location?: Location }).location = {
      pathname: "/admin/settings",
      search: "",
      hash: "",
    } as Location;
    const client = new QueryClient();
    if (settings) {
      client.setQueryData(["/api/admin/settings"], settings);
    }

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

    expect(html).toContain("General");
    expect(html).toContain("Google Reviews API");
    expect(html).toContain("Google Place ID");
    expect(html).toContain("Google Places API Key");
    expect(html).toContain("Review Language");
    expect(html).toContain("Cache Duration");
    expect(html).toContain("Test Google Reviews");
    expect(html).toContain("Disabled");
    expect(html).toContain("Turn on the integration to validate Google Reviews credentials.");
  });

  it("renders the code snippets settings tab", () => {
    const html = renderSettingsPage();

    expect(html).toContain("Code Snippets");
    expect(html).toContain("Head Tags");
    expect(html).toContain("Body Start Tags");
    expect(html).toContain("Footer Tags");
    expect(html).toContain("Save Code Snippets");
  });

  it("shows a mask when the Mailgun API key is already stored", () => {
    const html = renderSettingsPage({
      mailgun: {
        mailgun_api_key: { value: "••••••••", isSecret: true },
      },
    });

    expect(html).toContain('id="mailgun-key"');
    expect(html).toContain('value="********"');
  });
});
