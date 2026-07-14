import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Mail, RefreshCw, Send, Variable } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { EmailTemplate } from "@shared/schema";

type PreviewResponse = {
  subject: string;
  html: string;
};

type TestResponse = {
  success: boolean;
  message: string;
};

export default function SystemEmailsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
  });

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.slug === selectedSlug) ?? templates[0],
    [selectedSlug, templates],
  );

  const updateTemplate = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("Select an email template first.");
      const res = await apiRequest("PUT", `/api/admin/email-templates/${selectedTemplate.slug}`, {
        subject,
        htmlBody,
        isActive,
      });
      return res.json() as Promise<EmailTemplate>;
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Template saved", description: `${template.name} was updated.` });
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

  const previewTemplate = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("Select an email template first.");
      const res = await apiRequest(
        "POST",
        `/api/admin/email-templates/${selectedTemplate.slug}/preview`,
        {
          subject,
          htmlBody,
        },
      );
      return res.json() as Promise<PreviewResponse>;
    },
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("Select an email template first.");
      const res = await apiRequest(
        "POST",
        `/api/admin/email-templates/${selectedTemplate.slug}/test`,
      );
      return res.json() as Promise<TestResponse>;
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Test email sent" : "Test email not sent",
        description: result.message,
      });
    },
  });

  useEffect(() => {
    if (!selectedTemplate) return;
    setSelectedSlug(selectedTemplate.slug);
    setSubject(selectedTemplate.subject);
    setHtmlBody(selectedTemplate.htmlBody);
    setIsActive(selectedTemplate.isActive);
    previewTemplate.reset();
  }, [selectedTemplate]);

  const dirty =
    Boolean(selectedTemplate) &&
    (subject !== selectedTemplate.subject ||
      htmlBody !== selectedTemplate.htmlBody ||
      isActive !== selectedTemplate.isActive);

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1
              className="text-2xl font-heading font-semibold"
              data-testid="text-system-emails-title"
            >
              System Emails
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage the transactional messages sent by admin account and website workflows.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => restoreTemplates.mutate()}
            disabled={restoreTemplates.isPending}
            data-testid="button-restore-email-templates"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", restoreTemplates.isPending && "animate-spin")}
            />
            Restore Defaults
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>{templates.length} managed system messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading templates...</p>
              ) : null}
              {templates.map((template) => (
                <button
                  key={template.slug}
                  type="button"
                  onClick={() => setSelectedSlug(template.slug)}
                  className={cn(
                    "w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/60",
                    selectedTemplate?.slug === template.slug && "border-primary bg-primary/5",
                  )}
                  data-testid={`button-email-template-${template.slug}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{template.name}</span>
                    <Badge variant={template.isActive ? "secondary" : "outline"}>
                      {template.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {template.description}
                  </p>
                </button>
              ))}
              {!isLoading && templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No system email templates found.</p>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {selectedTemplate ? (
              <>
                <Card>
                  <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        {selectedTemplate.name}
                      </CardTitle>
                      <CardDescription>{selectedTemplate.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="template-active" className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id="template-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        data-testid="toggle-email-template-active"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="space-y-5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        updateTemplate.mutate();
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email-template-subject">Subject</Label>
                        <Input
                          id="email-template-subject"
                          value={subject}
                          onChange={(event) => setSubject(event.currentTarget.value)}
                          data-testid="input-email-template-subject"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email-template-body">HTML Body</Label>
                        <Textarea
                          id="email-template-body"
                          value={htmlBody}
                          onChange={(event) => setHtmlBody(event.currentTarget.value)}
                          className="min-h-72 font-mono text-xs"
                          spellCheck={false}
                          data-testid="textarea-email-template-body"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" disabled={!dirty || updateTemplate.isPending}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {updateTemplate.isPending ? "Saving..." : "Save Template"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => previewTemplate.mutate()}
                          disabled={previewTemplate.isPending}
                          data-testid="button-preview-email-template"
                        >
                          Preview
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => sendTest.mutate()}
                          disabled={sendTest.isPending}
                          data-testid="button-send-test-email-template"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Test
                        </Button>
                        {dirty ? (
                          <span className="text-sm text-muted-foreground">Unsaved changes</span>
                        ) : null}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Variable className="h-5 w-5 text-muted-foreground" />
                      Variables
                    </CardTitle>
                    <CardDescription>
                      Use these placeholders in the subject or body.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="font-mono">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      Render the current editor values with sample data before saving or sending a
                      test.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {previewTemplate.data ? (
                      <>
                        <Alert>
                          <AlertTitle>{previewTemplate.data.subject}</AlertTitle>
                          <AlertDescription>
                            Rendered subject with sample variables.
                          </AlertDescription>
                        </Alert>
                        <div className="overflow-hidden rounded-md border bg-white">
                          <iframe
                            title="Email preview"
                            srcDoc={previewTemplate.data.html}
                            className="h-[460px] w-full bg-white"
                            sandbox=""
                            data-testid="iframe-email-template-preview"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Run a preview to render this email with sample data.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-sm text-muted-foreground">
                  Select a system email template to edit.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminSidebar>
  );
}
