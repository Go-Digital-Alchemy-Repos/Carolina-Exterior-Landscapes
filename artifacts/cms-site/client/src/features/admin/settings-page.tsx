import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "./admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EmailTemplate } from "@shared/schema";

type SettingsResponse = Record<string, Record<string, { value: string; isSecret: boolean }>>;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
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

  const mailgun = settings.mailgun ?? {};
  const analytics = settings.google_analytics ?? {};
  const googleReviews = settings.google_reviews ?? {};

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generic backend configuration for email, analytics, and integrations.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Delivery</CardTitle>
            <CardDescription>Configure Mailgun delivery for admin notifications and password resets.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
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
                defaultValue=""
                placeholder={mailgun.mailgun_api_key?.value ? "Stored secret" : ""}
                onBlur={(event) => {
                  if (event.currentTarget.value) {
                    saveSetting.mutate({ category: "mailgun", key: "mailgun_api_key", value: event.currentTarget.value, isSecret: true });
                    event.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Optional public runtime analytics setting.</CardDescription>
          </CardHeader>
          <CardContent>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-medium">Google Reviews API</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Store Google Places credentials for pulling review data into review widgets.
                  </p>
                </div>
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
                    defaultValue=""
                    placeholder={googleReviews.google_reviews_api_key?.value ? "Stored secret" : ""}
                    onBlur={(event) => {
                      if (event.currentTarget.value) {
                        saveSetting.mutate({
                          category: "google_reviews",
                          key: "google_reviews_api_key",
                          value: event.currentTarget.value,
                          isSecret: true,
                        });
                        event.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </AdminSidebar>
  );
}
