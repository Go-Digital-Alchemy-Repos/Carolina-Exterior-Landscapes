import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "./admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, CircleAlert, CircleDashed, ExternalLink, Loader2 } from "lucide-react";
import type { EmailTemplate } from "@shared/schema";

type SettingsResponse = Record<string, Record<string, { value: string; isSecret: boolean }>>;
const SECRET_FIELD_MASK = "********";
type IntegrationKey = "google_reviews";
type ConnectionTestResult = { success: boolean; message: string };

type SetupLink = {
  label: string;
  href: string;
};

function SetupInstructions({
  title,
  children,
  links,
}: {
  title: string;
  children: React.ReactNode;
  links: SetupLink[];
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm md:col-span-2">
      <h3 className="font-medium text-foreground">{title}</h3>
      <div className="mt-1 leading-6 text-muted-foreground">{children}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <Button key={link.href} asChild size="sm" variant="outline">
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
              <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}

function IntegrationStatusBadge({
  status,
  message,
}: {
  status: "disabled" | "missing" | "checking" | "verified" | "failed";
  message: string;
}) {
  const statusConfig = {
    disabled: {
      icon: CircleDashed,
      label: "Disabled",
      className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    missing: {
      icon: CircleAlert,
      label: "Needs setup",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    checking: {
      icon: Loader2,
      label: "Checking",
      className: "border-sky-200 bg-sky-50 text-sky-700",
    },
    verified: {
      icon: CheckCircle2,
      label: "Verified",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    failed: {
      icon: CircleAlert,
      label: "Not verified",
      className: "border-red-200 bg-red-50 text-red-700",
    },
  }[status];
  const Icon = statusConfig.icon;

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig.className}`}>
        <Icon className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`} aria-hidden="true" />
        {statusConfig.label}
      </div>
      <p className="max-w-xs text-left text-xs text-muted-foreground sm:text-right">{message}</p>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings = {} } = useQuery<SettingsResponse>({ queryKey: ["/api/admin/settings"] });
  const { data: templates = [] } = useQuery<EmailTemplate[]>({ queryKey: ["/api/admin/email-templates"] });

  const saveSetting = useMutation({
    mutationFn: async (payload: { category: string; key: string; value: string; isSecret?: boolean }) => {
      const res = await apiRequest("PUT", "/api/admin/settings", {
        isSecret: false,
        ...payload,
      });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      if (variables.category === "google_reviews") {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/test-connection", "google_reviews"] });
      }
      toast({ title: "Setting saved" });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (payload: { slug: string; subject: string; htmlBody: string; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/email-templates/${payload.slug}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Template saved" });
    },
  });

  const restoreTemplates = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/email-templates/restore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "System templates restored" });
    },
  });

  const testIntegration = useMutation({
    mutationFn: async (integration: IntegrationKey) => {
      const res = await apiRequest("POST", "/api/admin/settings/test-connection", { integration });
      return res.json() as Promise<{ success: boolean; message: string }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/test-connection", "google_reviews"] });
      toast({
        title: result.success ? "Integration connected" : "Integration needs attention",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    },
  });

  const saveCodeSnippets = useMutation({
    mutationFn: async (payload: { headSnippets: string; headerSnippets: string; footerSnippets: string }) => {
      await Promise.all([
        apiRequest("PUT", "/api/admin/settings", {
          category: "code_snippets",
          key: "head_snippets",
          value: payload.headSnippets,
          isSecret: false,
        }),
        apiRequest("PUT", "/api/admin/settings", {
          category: "code_snippets",
          key: "header_snippets",
          value: payload.headerSnippets,
          isSecret: false,
        }),
        apiRequest("PUT", "/api/admin/settings", {
          category: "code_snippets",
          key: "footer_snippets",
          value: payload.footerSnippets,
          isSecret: false,
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Code snippets saved" });
    },
  });

  const mailgun = settings.mailgun ?? {};
  const analytics = settings.google_analytics ?? {};
  const googleReviews = settings.google_reviews ?? {};
  const codeSnippets = settings.code_snippets ?? {};
  const googleReviewsEnabled = googleReviews.google_reviews_enabled?.value === "true";
  const googleReviewsPlaceId = googleReviews.google_reviews_place_id?.value?.trim() || "";
  const googleReviewsApiKeyStored = Boolean(googleReviews.google_reviews_api_key?.value);
  const canValidateGoogleReviews = googleReviewsEnabled && Boolean(googleReviewsPlaceId && googleReviewsApiKeyStored);

  const googleReviewsStatus = useQuery<ConnectionTestResult>({
    queryKey: [
      "/api/admin/settings/test-connection",
      "google_reviews",
      googleReviewsEnabled,
      googleReviewsPlaceId,
      googleReviewsApiKeyStored,
    ],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/admin/settings/test-connection", {
        integration: "google_reviews",
      });
      return res.json() as Promise<ConnectionTestResult>;
    },
    enabled: canValidateGoogleReviews,
    staleTime: 60_000,
    retry: false,
  });

  const googleReviewsConnectionStatus = !googleReviewsEnabled
    ? "disabled"
    : !googleReviewsPlaceId || !googleReviewsApiKeyStored
      ? "missing"
      : googleReviewsStatus.isFetching
        ? "checking"
        : googleReviewsStatus.data?.success
          ? "verified"
          : "failed";
  const googleReviewsConnectionMessage = !googleReviewsEnabled
    ? "Turn on the integration to validate Google Reviews credentials."
    : !googleReviewsPlaceId || !googleReviewsApiKeyStored
      ? "Add a Place ID and API key to verify the connection."
      : googleReviewsStatus.data?.message ||
        (googleReviewsStatus.error instanceof Error
          ? googleReviewsStatus.error.message
          : "Connection has not been verified yet.");

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generic backend configuration for email, analytics, and integrations.</p>
        </div>

        <Tabs defaultValue="email-delivery" className="space-y-6">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="email-delivery">Email Delivery</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
            <TabsTrigger value="code-snippets">Code Snippets</TabsTrigger>
          </TabsList>

          <TabsContent value="email-delivery" className="mt-0 space-y-6" forceMount>
            <Card>
              <CardHeader>
                <CardTitle>Email Delivery</CardTitle>
                <CardDescription>Configure Mailgun delivery for admin notifications and password resets.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <SetupInstructions
                  title="How to configure Mailgun"
                  links={[
                    { label: "Mailgun Domains", href: "https://app.mailgun.com/app/sending/domains" },
                    { label: "Mailgun API Keys", href: "https://app.mailgun.com/app/account/security/api_keys" },
                  ]}
                >
                  Use a verified sending domain from Mailgun for the domain field. The from address should use that
                  verified domain, such as <span className="font-medium text-foreground">noreply@mg.example.com</span>.
                  Create or copy a sending API key from Mailgun and paste it into the API key field.
                </SetupInstructions>
                <div className="space-y-2">
                  <Label htmlFor="mailgun-domain">Mailgun Domain</Label>
                  <Input
                    id="mailgun-domain"
                    defaultValue={mailgun.mailgun_domain?.value ?? ""}
                    onBlur={(event) => saveSetting.mutate({ category: "mailgun", key: "mailgun_domain", value: event.currentTarget.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mailgun-from">From Address</Label>
                  <Input
                    id="mailgun-from"
                    defaultValue={mailgun.mailgun_from_address?.value ?? ""}
                    onBlur={(event) => saveSetting.mutate({ category: "mailgun", key: "mailgun_from_address", value: event.currentTarget.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mailgun-key">Mailgun API Key</Label>
                  <Input
                    id="mailgun-key"
                    type="password"
                    defaultValue={mailgun.mailgun_api_key?.value ? SECRET_FIELD_MASK : ""}
                    placeholder={mailgun.mailgun_api_key?.value ? SECRET_FIELD_MASK : ""}
                    onFocus={(event) => {
                      if (mailgun.mailgun_api_key?.value && event.currentTarget.value === SECRET_FIELD_MASK) {
                        event.currentTarget.value = "";
                      }
                    }}
                    onBlur={(event) => {
                      const value = event.currentTarget.value;
                      if (value && value !== SECRET_FIELD_MASK && value !== mailgun.mailgun_api_key?.value) {
                        saveSetting.mutate({ category: "mailgun", key: "mailgun_api_key", value, isSecret: true });
                        event.currentTarget.value = "";
                      } else if (!value && mailgun.mailgun_api_key?.value) {
                        event.currentTarget.value = SECRET_FIELD_MASK;
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0 space-y-6" forceMount>
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Optional public runtime analytics setting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SetupInstructions
                  title="How to configure GA4"
                  links={[
                    { label: "Google Analytics Admin", href: "https://analytics.google.com/analytics/web/#/admin" },
                    { label: "Find a Measurement ID", href: "https://support.google.com/analytics/answer/12270356" },
                  ]}
                >
                  In Google Analytics, open Admin, choose the property for this website, then open Data Streams and select
                  the web stream. Copy the Measurement ID that starts with{" "}
                  <span className="font-medium text-foreground">G-</span> and paste it here.
                </SetupInstructions>
                <div className="space-y-2">
                  <Label htmlFor="ga4">GA4 Measurement ID</Label>
                  <Input
                    id="ga4"
                    defaultValue={analytics.ga4_measurement_id?.value ?? ""}
                    onBlur={(event) => saveSetting.mutate({ category: "google_analytics", key: "ga4_measurement_id", value: event.currentTarget.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Configure third-party services used by dynamic website blocks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-md border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="font-medium">Google Reviews API</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Store Google Places credentials for pulling review data into review widgets.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <IntegrationStatusBadge
                        status={googleReviewsConnectionStatus}
                        message={googleReviewsConnectionMessage}
                      />
                      <div className="flex items-center gap-2">
                        <Label htmlFor="google-reviews-enabled" className="text-sm">Enabled</Label>
                        <Switch
                          id="google-reviews-enabled"
                          defaultChecked={googleReviews.google_reviews_enabled?.value === "true"}
                          onCheckedChange={(checked) =>
                            saveSetting.mutate({
                              category: "google_reviews",
                              key: "google_reviews_enabled",
                              value: checked ? "true" : "false",
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <SetupInstructions
                      title="How to configure Google Reviews"
                      links={[
                        { label: "Google Cloud API Credentials", href: "https://console.cloud.google.com/apis/credentials" },
                        { label: "Enable Places API", href: "https://console.cloud.google.com/apis/library/places-backend.googleapis.com" },
                        { label: "Find a Place ID", href: "https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" },
                      ]}
                    >
                      In Google Cloud, enable the Places API for the project and create an API key under APIs & Services.
                      Restrict the key to the Places API when possible. Use Google&apos;s Place ID Finder to search for the
                      business listing, then copy the Place ID that starts with{" "}
                      <span className="font-medium text-foreground">ChIJ</span>.
                    </SetupInstructions>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="google-reviews-place-id">Google Place ID</Label>
                      <Input
                        id="google-reviews-place-id"
                        defaultValue={googleReviews.google_reviews_place_id?.value ?? ""}
                        placeholder="ChIJ..."
                        onBlur={(event) =>
                          saveSetting.mutate({
                            category: "google_reviews",
                            key: "google_reviews_place_id",
                            value: event.currentTarget.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="google-reviews-api-key">Google Places API Key</Label>
                      <Input
                        id="google-reviews-api-key"
                        type="password"
                        defaultValue={googleReviews.google_reviews_api_key?.value ? SECRET_FIELD_MASK : ""}
                        placeholder={googleReviews.google_reviews_api_key?.value ? SECRET_FIELD_MASK : ""}
                        onFocus={(event) => {
                          if (googleReviews.google_reviews_api_key?.value && event.currentTarget.value === SECRET_FIELD_MASK) {
                            event.currentTarget.value = "";
                          }
                        }}
                        onBlur={(event) => {
                          const value = event.currentTarget.value;
                          if (value && value !== SECRET_FIELD_MASK && value !== googleReviews.google_reviews_api_key?.value) {
                            saveSetting.mutate({
                              category: "google_reviews",
                              key: "google_reviews_api_key",
                              value,
                              isSecret: true,
                            });
                            event.currentTarget.value = "";
                          } else if (!value && googleReviews.google_reviews_api_key?.value) {
                            event.currentTarget.value = SECRET_FIELD_MASK;
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="google-reviews-language-code">Review Language</Label>
                      <Input
                        id="google-reviews-language-code"
                        defaultValue={googleReviews.google_reviews_language_code?.value ?? "en"}
                        placeholder="en"
                        onBlur={(event) =>
                          saveSetting.mutate({
                            category: "google_reviews",
                            key: "google_reviews_language_code",
                            value: event.currentTarget.value || "en",
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">Use a Google language code such as en or es.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="google-reviews-cache-minutes">Cache Duration (minutes)</Label>
                      <Input
                        id="google-reviews-cache-minutes"
                        type="number"
                        min={5}
                        max={1440}
                        defaultValue={googleReviews.google_reviews_cache_minutes?.value ?? "60"}
                        onBlur={(event) =>
                          saveSetting.mutate({
                            category: "google_reviews",
                            key: "google_reviews_cache_minutes",
                            value: event.currentTarget.value || "60",
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">Controls how often the public carousel refreshes from Google.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testIntegration.mutate("google_reviews")}
                      disabled={testIntegration.isPending}
                    >
                      {testIntegration.isPending ? "Testing..." : "Test Google Reviews"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      The public section only displays reviews returned by Google with a 5-star rating.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email-templates" className="mt-0 space-y-6" forceMount>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>Password reset, welcome, and form notification templates.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => restoreTemplates.mutate()} disabled={restoreTemplates.isPending}>
                  Restore Defaults
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                {templates.map((template) => (
                  <form
                    key={template.slug}
                    className="space-y-3 rounded-md border p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      updateTemplate.mutate({
                        slug: template.slug,
                        subject: String(formData.get("subject") ?? ""),
                        htmlBody: String(formData.get("htmlBody") ?? ""),
                        isActive: formData.get("isActive") === "on",
                      });
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="font-medium">{template.name}</h2>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${template.slug}-active`} className="text-xs">Active</Label>
                        <Switch id={`${template.slug}-active`} name="isActive" defaultChecked={template.isActive} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${template.slug}-subject`}>Subject</Label>
                      <Input id={`${template.slug}-subject`} name="subject" defaultValue={template.subject} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${template.slug}-body`}>HTML Body</Label>
                      <Textarea id={`${template.slug}-body`} name="htmlBody" defaultValue={template.htmlBody} className="min-h-32 font-mono text-xs" />
                    </div>
                    <Button type="submit" disabled={updateTemplate.isPending}>Save Template</Button>
                  </form>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code-snippets" className="mt-0 space-y-6" forceMount>
            <Card>
              <CardHeader>
                <CardTitle>Code Snippets</CardTitle>
                <CardDescription>
                  Add verification tags, analytics pixels, and trusted third-party snippets to public site pages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    saveCodeSnippets.mutate({
                      headSnippets: String(formData.get("headSnippets") ?? ""),
                      headerSnippets: String(formData.get("headerSnippets") ?? ""),
                      footerSnippets: String(formData.get("footerSnippets") ?? ""),
                    });
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="head-snippets">Head Tags</Label>
                    <Textarea
                      id="head-snippets"
                      name="headSnippets"
                      defaultValue={codeSnippets.head_snippets?.value ?? ""}
                      className="min-h-40 font-mono text-xs"
                      spellCheck={false}
                      placeholder={'<meta name="google-site-verification" content="..." />'}
                    />
                    <p className="text-xs text-muted-foreground">
                      Injected before the closing head tag on public pages.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="header-snippets">Body Start Tags</Label>
                    <Textarea
                      id="header-snippets"
                      name="headerSnippets"
                      defaultValue={codeSnippets.header_snippets?.value ?? ""}
                      className="min-h-40 font-mono text-xs"
                      spellCheck={false}
                      placeholder="<!-- Tag manager noscript or body-start snippet -->"
                    />
                    <p className="text-xs text-muted-foreground">
                      Injected immediately after the opening body tag on public pages. Search Console meta tags belong in Head Tags.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer-snippets">Footer Tags</Label>
                    <Textarea
                      id="footer-snippets"
                      name="footerSnippets"
                      defaultValue={codeSnippets.footer_snippets?.value ?? ""}
                      className="min-h-40 font-mono text-xs"
                      spellCheck={false}
                      placeholder="<!-- Chat widgets, pixels, or body-end snippets -->"
                    />
                    <p className="text-xs text-muted-foreground">
                      Injected before the closing body tag on public pages.
                    </p>
                  </div>

                  <Button type="submit" disabled={saveCodeSnippets.isPending}>
                    {saveCodeSnippets.isPending ? "Saving..." : "Save Code Snippets"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminSidebar>
  );
}
