import { describe, expect, it } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import AdminSettingsPage, { type SettingsSubview } from "@/features/admin/settings-page";

type SettingsResponse = Record<string, Record<string, { value: string; isSecret: boolean }>>;

describe("AdminSettingsPage", () => {
  function renderSettingsPage(
    settings?: SettingsResponse,
    googleReviewsStatus?: { success: boolean; message: string },
    subview: SettingsSubview = "email",
    mailgunStatus?: { success: boolean; message: string },
  ) {
    (globalThis as typeof globalThis & { React?: typeof React }).React = React;
    (globalThis as typeof globalThis & { location?: Location }).location = {
      pathname: `/admin/settings/${subview}`,
      search: "",
      hash: "",
    } as Location;
    const client = new QueryClient();
    if (settings) {
      client.setQueryData(["/api/admin/settings"], settings);
    }
    if (googleReviewsStatus) {
      client.setQueryData(
        ["/api/admin/settings/test-connection", "google_reviews", true, "ChIJ-example", true],
        googleReviewsStatus,
      );
    }
    if (mailgunStatus) {
      client.setQueryData(
        ["/api/admin/settings/test-connection", "mailgun", "mg.example.com", true],
        mailgunStatus,
      );
    }

    return renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(AdminSettingsPage, { initialSubview: subview }),
      ),
    );
  }

  it("renders Google Reviews API integration settings", () => {
    const html = renderSettingsPage(undefined, undefined, "integrations");

    expect(html).toContain("Email Settings");
    expect(html).toContain("Google Reviews API");
    expect(html).toContain("Google Place ID");
    expect(html).toContain("Google Places API Key");
    expect(html).toContain("Review Language");
    expect(html).toContain("Cache Duration");
    expect(html).toContain("Verify Connection");
    expect(html).toContain("do not use a Websites/referrer application restriction");
    expect(html).toContain("Disabled");
    expect(html).toContain("Turn on the integration to validate Google Reviews credentials.");
  });

  it("renders the code snippets settings tab", () => {
    const html = renderSettingsPage(undefined, undefined, "code-snippets");

    expect(html).toContain("Code Snippets");
    expect(html).toContain("Head Tags");
    expect(html).toContain("Body Start Tags");
    expect(html).toContain("Footer Tags");
    expect(html).toContain("Save Code Snippets");
    expect(html).not.toContain("Mailgun Domain");
  });

  it("shows a mask when the Mailgun API key is already stored", () => {
    const html = renderSettingsPage({
      mailgun: {
        mailgun_api_key: { value: "••••••••", isSecret: true },
      },
    });

    expect(html).toContain('id="mailgun-key"');
    expect(html).toContain('value="*****"');
    expect(html).toContain("Form Submission Recipients");
  });

  it("shows Mailgun as verified when the saved domain and API key pass validation", () => {
    const html = renderSettingsPage(
      {
        mailgun: {
          mailgun_domain: { value: "mg.example.com", isSecret: false },
          mailgun_api_key: { value: "••••••••", isSecret: true },
        },
      },
      undefined,
      "email",
      { success: true, message: "Mailgun connection successful" },
    );

    expect(html).toContain("Verified");
    expect(html).toContain("Mailgun connection successful");
    expect(html).toContain("Email Templates");
    expect(html).not.toContain("Google Reviews API");
  });

  it("shows the same mask when the Google Places API key is already stored", () => {
    const html = renderSettingsPage({
      google_reviews: {
        google_reviews_api_key: { value: "••••••••", isSecret: true },
      },
    }, undefined, "integrations");

    expect(html).toContain('id="google-reviews-api-key"');
    expect(html).toContain('value="*****"');
  });

  it("explains how to fix a server-side referrer restriction failure", () => {
    const html = renderSettingsPage(
      {
        google_reviews: {
          google_reviews_enabled: { value: "true", isSecret: false },
          google_reviews_place_id: { value: "ChIJ-example", isSecret: false },
          google_reviews_api_key: { value: "••••••••", isSecret: true },
        },
      },
      { success: false, message: "Requests from referrer <empty> are blocked." },
      "integrations",
    );

    expect(html).toContain("Connection verification failed");
    expect(html).toContain("Change Application restrictions from Websites to None");
    expect(html).toContain("Places API (New)");
    expect(html).toContain("Open Google Cloud Credentials");
  });
});
