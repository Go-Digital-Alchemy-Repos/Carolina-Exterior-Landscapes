import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminSidebar } from "./admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, CircleAlert, CircleDashed, ExternalLink, Loader2, Mail } from "lucide-react";
import type { CmsForm, EmailTemplate, User } from "@shared/schema";

type SettingsResponse = Record<string, Record<string, { value: string; isSecret: boolean }>>;
const SECRET_FIELD_MASK = "*****";
type IntegrationKey = "mailgun" | "google_reviews";
export type SettingsSubview = "email" | "code-snippets" | "integrations";
type ConnectionTestResult = { success: boolean; message: string };
type NotificationUser = Omit<User, "password">;

type SetupLink = {
  label: string;
  href: string;
};

function secretInputProps(
  stored: boolean,
  save: (value: string, onSaved: () => void) => void,
) {
  return {
    type: "password" as const,
    defaultValue: stored ? SECRET_FIELD_MASK : "",
    placeholder: stored ? SECRET_FIELD_MASK : "",
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      if (event.currentTarget.value === SECRET_FIELD_MASK) {
        event.currentTarget.value = "";
      }
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const value = input.value.trim();

      if (value && value !== SECRET_FIELD_MASK) {
        save(value, () => {
          input.value = SECRET_FIELD_MASK;
        });
      } else if (stored) {
        input.value = SECRET_FIELD_MASK;
      }
    },
  };
}

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

function GoogleReviewsVerificationHelp({ message }: { message: string }) {
  const normalizedMessage = message.toLowerCase();
  const hasReferrerRestrictionError =
    normalizedMessage.includes("referrer") &&
    (normalizedMessage.includes("blocked") || normalizedMessage.includes("not allowed"));

  return (
    <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-950">
      <div className="flex gap-3">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
        <div className="space-y-3">
          <div>
            <p className="font-semibold">Connection verification failed</p>
            <p className="mt-1 text-red-800">{message}</p>
          </div>

          {hasReferrerRestrictionError ? (
            <div className="space-y-2">
              <p>
                This key is restricted to browser referrers, but Google Reviews is requested securely by the website
                server. Update the key in Google Cloud:
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Open the API key under Google Cloud API Credentials.</li>
                <li>
                  Change Application restrictions from Websites to None. If the server has a static outbound IP, IP
                  addresses may be used instead.
                </li>
                <li>Under API restrictions, restrict the key to Places API (New), then save.</li>
                <li>Allow a few minutes for Google&apos;s changes to apply, then click Verify Connection.</li>
              </ol>
            </div>
          ) : (
            <p>
              Confirm that the key is valid, billing is active, Places API (New) is enabled, and the Place ID is
              correct. Save any changes in Google Cloud, then click Verify Connection.
            </p>
          )}

          <Button asChild size="sm" variant="outline" className="border-red-300 bg-white hover:bg-red-100">
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
              Open Google Cloud Credentials
              <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage({ initialSubview = "email" }: { initialSubview?: SettingsSubview }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings = {} } = useQuery<SettingsResponse>({ queryKey: ["/api/admin/settings"] });
  const { data: notificationUsers = [] } = useQuery<NotificationUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: initialSubview === "email",
  });
  const { data: forms = [] } = useQuery<CmsForm[]>({
    queryKey: ["/api/admin/forms"],
    enabled: initialSubview === "email",
  });
  const activeForms = forms.filter((form) => form.isActive);

  const updateFormRecipient = useMutation({
    mutationFn: async ({ user, formId, enabled }: { user: NotificationUser; formId: string; enabled: boolean }) => {
      const current = Array.isArray(user.formNotificationFormIds) ? user.formNotificationFormIds : [];
      const formNotificationFormIds = enabled
        ? Array.from(new Set([...current, formId]))
        : current.filter((id) => id !== formId);
      const response = await apiRequest("PUT", `/api/admin/users/${user.id}`, { formNotificationFormIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Form recipients updated" });
    },
  });

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
      if (variables.category === "google_reviews" || variables.category === "mailgun") {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/test-connection", variables.category] });
      }
      toast({ title: "Setting saved" });
    },
    onError: (error: Error) => {
      toast({
        title: "Setting not saved",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testIntegration = useMutation({
    mutationFn: async (integration: IntegrationKey) => {
      const res = await apiRequest("POST", "/api/admin/settings/test-connection", { integration });
      return res.json() as Promise<{ success: boolean; message: string }>;
    },
    onSuccess: (result, integration) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/test-connection", integration] });
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
  const emailNotifications = settings.email_notifications ?? {};
  const analytics = settings.google_analytics ?? {};
  const googleReviews = settings.google_reviews ?? {};
  const codeSnippets = settings.code_snippets ?? {};
  const mailgunDomain = mailgun.mailgun_domain?.value?.trim() || "";
  const mailgunApiKeyStored = Boolean(mailgun.mailgun_api_key?.value);
  const canValidateMailgun = Boolean(mailgunDomain && mailgunApiKeyStored);
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

  const mailgunStatus = useQuery<ConnectionTestResult>({
    queryKey: ["/api/admin/settings/test-connection", "mailgun", mailgunDomain, mailgunApiKeyStored],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/admin/settings/test-connection", { integration: "mailgun" });
      return res.json() as Promise<ConnectionTestResult>;
    },
    enabled: canValidateMailgun,
    staleTime: 60_000,
    retry: false,
  });

  const { data: emailTemplates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
    enabled: initialSubview === "email",
  });

  const mailgunConnectionStatus = !canValidateMailgun
    ? "missing"
    : mailgunStatus.isFetching
      ? "checking"
      : mailgunStatus.data?.success
        ? "verified"
        : "failed";
  const mailgunConnectionMessage = !canValidateMailgun
    ? "Add a Mailgun domain and API key to verify delivery."
    : mailgunStatus.data?.message ||
      (mailgunStatus.error instanceof Error ? mailgunStatus.error.message : "Connection has not been verified yet.");

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

        <Tabs
          value={initialSubview}
          onValueChange={(value) => navigate(`/admin/settings/${value}`)}
          className="space-y-6"
        >
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="email">Email Settings</TabsTrigger>
            <TabsTrigger value="code-snippets">Code Snippets</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
        </Tabs>

        {initialSubview === "email" ? <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Email Delivery</CardTitle>
                <CardDescription className="mt-1">Configure Mailgun delivery for admin notifications and password resets.</CardDescription>
              </div>
              <IntegrationStatusBadge status={mailgunConnectionStatus} message={mailgunConnectionMessage} />
            </div>
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
                {...secretInputProps(Boolean(mailgun.mailgun_api_key?.value), (value, onSaved) => {
                  saveSetting.mutate(
                    { category: "mailgun", key: "mailgun_api_key", value, isSecret: true },
                    { onSuccess: onSaved },
                  );
                })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => testIntegration.mutate("mailgun")} disabled={!canValidateMailgun || testIntegration.isPending}>
                {testIntegration.isPending ? "Verifying..." : "Verify Connection"}
              </Button>
              <p className="text-xs text-muted-foreground">Checks the saved API key against the configured Mailgun sending domain.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Submission Recipients</CardTitle>
            <CardDescription>
              Choose override inboxes for contact and quote forms, then assign system users per active form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-form-recipient">Contact Form Recipient</Label>
                <Input
                  id="contact-form-recipient"
                  type="email"
                  defaultValue={emailNotifications.contact_form_recipient_email?.value ?? ""}
                  placeholder="contact@example.com"
                  onBlur={(event) => saveSetting.mutate({
                    category: "email_notifications",
                    key: "contact_form_recipient_email",
                    value: event.currentTarget.value.trim(),
                  })}
                />
                <p className="text-xs text-muted-foreground">Overrides assigned users for website contact form submissions.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote-form-recipient">Quote Form Recipient</Label>
                <Input
                  id="quote-form-recipient"
                  type="email"
                  defaultValue={emailNotifications.quote_form_recipient_email?.value ?? ""}
                  placeholder="quotes@example.com"
                  onBlur={(event) => saveSetting.mutate({
                    category: "email_notifications",
                    key: "quote_form_recipient_email",
                    value: event.currentTarget.value.trim(),
                  })}
                />
                <p className="text-xs text-muted-foreground">Overrides assigned users for residential and commercial quote requests.</p>
              </div>
            </div>
            {activeForms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active forms are available.</p>
            ) : notificationUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No system users are available.</p>
            ) : activeForms.map((form) => (
              <div key={form.id} className="rounded-lg border p-4" data-testid={`form-recipients-${form.slug}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{form.name}</h3>
                  {form.isSystem ? <Badge variant="outline">System</Badge> : null}
                  <span className="text-xs text-muted-foreground">/{form.slug}</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {notificationUsers.map((user) => {
                    const checked = Array.isArray(user.formNotificationFormIds)
                      && user.formNotificationFormIds.includes(form.id);
                    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
                    return (
                      <label key={user.id} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/30">
                        <Checkbox
                          checked={checked}
                          disabled={updateFormRecipient.isPending}
                          onCheckedChange={(value) => updateFormRecipient.mutate({
                            user,
                            formId: form.id,
                            enabled: Boolean(value),
                          })}
                          data-testid={`checkbox-recipient-${form.slug}-${user.id}`}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>Manage the transactional messages sent by website and administrator workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {emailTemplates.map((template) => (
              <button key={template.slug} type="button" onClick={() => navigate(`/admin/system/emails?template=${template.slug}`)} className="flex w-full items-center justify-between gap-4 rounded-md border p-3 text-left transition-colors hover:bg-muted/50">
                <div className="flex min-w-0 items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium">{template.name}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">{template.isActive ? "Active" : "Paused"}</span>
              </button>
            ))}
            {emailTemplates.length === 0 ? <p className="text-sm text-muted-foreground">No managed email templates found.</p> : null}
            <Button variant="outline" onClick={() => navigate("/admin/system/emails")}>Manage Email Templates</Button>
          </CardContent>
        </Card>
        </div> : null}

        {initialSubview === "integrations" ? <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Analytics</CardTitle>
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
            <CardTitle>Google Reviews</CardTitle>
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
                  Under API restrictions, limit the key to Places API (New). Because reviews are requested by the
                  website server, do not use a Websites/referrer application restriction; use None, or an IP address
                  restriction only when the server has a static outbound IP. Use Google&apos;s Place ID Finder to search
                  for the business listing, then copy the Place ID that starts with{" "}
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
                    {...secretInputProps(googleReviewsApiKeyStored, (value, onSaved) => {
                      saveSetting.mutate(
                        {
                          category: "google_reviews",
                          key: "google_reviews_api_key",
                          value,
                          isSecret: true,
                        },
                        { onSuccess: onSaved },
                      );
                    })}
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
              {googleReviewsConnectionStatus === "failed" && (
                <GoogleReviewsVerificationHelp message={googleReviewsConnectionMessage} />
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => testIntegration.mutate("google_reviews")}
                  disabled={testIntegration.isPending || !canValidateGoogleReviews}
                >
                  {testIntegration.isPending ? "Verifying..." : "Verify Connection"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Verification also runs automatically after credentials are saved. The public section only displays
                  reviews returned by Google with a 5-star rating.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div> : null}

        {initialSubview === "code-snippets" ? (
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
        ) : null}
      </div>
    </AdminSidebar>
  );
}
