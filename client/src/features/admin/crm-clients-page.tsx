import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AdminSidebar } from "./admin-sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  ClipboardList,
  CreditCard,
  Database,
  Mail,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import type { CrmClient, CrmClientDetail } from "@shared/schema";

const statusOptions = [
  { value: "onboarding", label: "Onboarding", className: "bg-amber-100 text-amber-800" },
  { value: "active", label: "Active", className: "bg-emerald-100 text-emerald-800" },
  { value: "inactive", label: "Inactive", className: "bg-slate-100 text-slate-800" },
] as const;
const typeOptions = [
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
] as const;
const onboardingOptions = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
] as const;
const contactOptions = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text" },
  { value: "no_preference", label: "No Preference" },
] as const;

const fmt = (date?: string | Date | null) =>
  date ? format(new Date(date), "MMM d, yyyy") : "No date";
const inputDate = (date?: string | Date | null) =>
  date ? format(new Date(date), "yyyy-MM-dd") : "";
const statusMeta = (status: string) =>
  statusOptions.find((item) => item.value === status) ?? statusOptions[0];
const contactLine = (client: CrmClient) =>
  client.primaryEmail || client.email || client.primaryPhone || client.phone || "No contact info";

const FIELD_LABELS: Record<string, string> = {
  name: "Full Name",
  fullName: "Full Name",
  contactName: "Contact Name",
  email: "Email Address",
  phone: "Phone Number",
  companyName: "Company / HOA Name",
  servicesInterested: "Services Needed",
  servicesNeeded: "Services Needed",
  message: "Project Details / Message",
  notes: "Additional Notes",
  sourcePage: "Submitted From",
};

function formFieldLabel(key: string) {
  return (
    FIELD_LABELS[key] ??
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function FormDataValue({ fieldKey, value }: { fieldKey: string; value: unknown }) {
  if (value === null || value === undefined || value === "")
    return <span className="text-muted-foreground">Not provided</span>;
  if (Array.isArray(value))
    return (
      <div className="flex flex-wrap gap-2">
        {value.map((item, index) => (
          <Badge key={`${String(item)}-${index}`} variant="secondary">
            {String(item)}
          </Badge>
        ))}
      </div>
    );
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, item]) => item !== "",
    );
    return (
      <div className="space-y-1">
        {entries.map(([key, item]) => (
          <div key={key}>
            <span className="font-medium">{formFieldLabel(key)}:</span> {String(item)}
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  const display = String(value);
  if (fieldKey.toLowerCase().includes("email"))
    return (
      <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${display}`}>
        {display}
      </a>
    );
  if (fieldKey.toLowerCase().includes("phone"))
    return (
      <a className="text-primary underline-offset-4 hover:underline" href={`tel:${display}`}>
        {display}
      </a>
    );
  return <span className="whitespace-pre-wrap">{display}</span>;
}

function recordMetadata(client: CrmClient) {
  return client.metadata && typeof client.metadata === "object" ? client.metadata : {};
}

function formatDateTime(value?: string | Date | null) {
  return value ? format(new Date(value), "MMM d, yyyy 'at' h:mm a") : "Not recorded";
}

function InlineInput({
  label,
  value,
  onSave,
  type = "text",
}: {
  label: string;
  value: unknown;
  onSave: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type={type}
        defaultValue={String(value ?? "")}
        onBlur={(e) => onSave(e.target.value)}
      />
    </div>
  );
}

export default function CrmClientsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [task, setTask] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const qs = new URLSearchParams({ q: query, status }).toString();
  const { data: clients = [] } = useQuery<CrmClient[]>({
    queryKey: [`/api/admin/crm/clients?${qs}`],
  });
  const { data: detail } = useQuery<CrmClientDetail>({
    queryKey: [`/api/admin/crm/clients/${selectedId}`],
    enabled: Boolean(selectedId),
  });
  const invalidate = () =>
    queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).startsWith("/api/admin/crm"),
    });
  const patch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/admin/crm/clients/${id}`, data),
    onSuccess: invalidate,
  });
  const addNote = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/admin/crm/clients/${selectedId}/notes`, { body: note }),
    onSuccess: () => {
      setNote("");
      invalidate();
    },
  });
  const addTask = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/admin/crm/clients/${selectedId}/tasks`, {
        title: task,
        dueAt: taskDue || null,
      }),
    onSuccess: () => {
      setTask("");
      setTaskDue("");
      invalidate();
    },
  });
  const updateTask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      apiRequest("PATCH", `/api/admin/crm/clients/tasks/${id}`, { completed }),
    onSuccess: invalidate,
  });
  const save = (field: string, value: unknown) =>
    detail && patch.mutate({ id: detail.id, data: { [field]: value } });
  const savePatch = (data: Record<string, unknown>) =>
    detail && patch.mutate({ id: detail.id, data });

  return (
    <AdminSidebar>
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold">CRM Clients</h1>
          <p className="text-muted-foreground">
            Track won leads through onboarding, active service, and inactive status.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <Input
            placeholder="Search clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="p-0">
            {clients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No clients yet. Move a lead to Won to create one.
              </div>
            ) : (
              <div className="divide-y">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    className="grid w-full gap-2 p-4 text-left hover:bg-muted/30 sm:grid-cols-5 sm:gap-4"
                    onClick={() => setSelectedId(client.id)}
                  >
                    <span>
                      <b>{client.name}</b>
                      <br />
                      <small>{contactLine(client)}</small>
                    </span>
                    <span>
                      {typeOptions.find((item) => item.value === client.clientType)?.label}
                    </span>
                    <span>
                      <Badge className={statusMeta(client.status).className}>
                        {statusMeta(client.status).label}
                      </Badge>
                    </span>
                    <span>{client.companyName || client.company || "—"}</span>
                    <span>{fmt(client.nextFollowUpAt)}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" size="xl">
          <SheetHeader>
            <SheetTitle>{detail?.name ?? "Loading client..."}</SheetTitle>
            <SheetDescription>
              {detail ? `${detail.clientType} · ${contactLine(detail)}` : "Loading client..."}
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            {detail ? (
              <Tabs defaultValue="overview">
                <TabsList className="flex h-auto w-full flex-nowrap justify-start overflow-x-auto">
                  <TabsTrigger value="overview" className="gap-2">
                    <UserRound className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="gap-2">
                    <Mail className="h-4 w-4 text-rose-600" aria-hidden="true" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="company" className="gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                    Company
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="gap-2">
                    <CreditCard className="h-4 w-4 text-amber-600" aria-hidden="true" />
                    Billing/Admin
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <MessageSquareText className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="gap-2">
                    <ClipboardList className="h-4 w-4 text-orange-600" aria-hidden="true" />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger value="data" className="gap-2">
                    <Database className="h-4 w-4 text-cyan-600" aria-hidden="true" />
                    Data
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="grid gap-4 md:grid-cols-2">
                  <InlineInput
                    label="Client Name"
                    value={detail.name}
                    onSave={(v) => save("name", v)}
                  />
                  <div>
                    <Label>Client Type</Label>
                    <Select value={detail.clientType} onValueChange={(v) => save("clientType", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={detail.status} onValueChange={(v) => save("status", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Onboarding</Label>
                    <Select
                      value={detail.onboardingStatus}
                      onValueChange={(v) => save("onboardingStatus", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {onboardingOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <InlineInput
                    label="Next Follow-Up"
                    type="date"
                    value={inputDate(detail.nextFollowUpAt)}
                    onSave={(v) => save("nextFollowUpAt", v || null)}
                  />
                  <InlineInput
                    label="Client Since"
                    type="date"
                    value={inputDate(detail.clientSince)}
                    onSave={(v) => save("clientSince", v || null)}
                  />
                  <p>
                    <b>Source:</b> {detail.source}
                  </p>
                  <p>
                    <b>Company:</b> {detail.company || "—"}
                  </p>
                  <p>
                    <b>Source Lead:</b> {detail.sourceLead?.name || "—"}
                  </p>
                </TabsContent>
                <TabsContent value="contact" className="grid gap-4 md:grid-cols-2">
                  {[
                    ["Primary Email", "primaryEmail"],
                    ["Secondary Email", "secondaryEmail"],
                    ["Primary Phone", "primaryPhone"],
                    ["Alternate Phone", "alternatePhone"],
                    ["Address Line 1", "addressLine1"],
                    ["Address Line 2", "addressLine2"],
                    ["City", "city"],
                    ["State/Region", "region"],
                    ["Postal Code", "postalCode"],
                    ["Country", "country"],
                  ].map(([label, field]) => (
                    <InlineInput
                      key={field}
                      label={label}
                      value={(detail as any)[field]}
                      onSave={(v) =>
                        field === "primaryEmail"
                          ? savePatch({ primaryEmail: v || null, email: v || null })
                          : field === "primaryPhone"
                            ? savePatch({ primaryPhone: v || null, phone: v || null })
                            : save(field, v || null)
                      }
                    />
                  ))}
                  <div>
                    <Label>Preferred Contact</Label>
                    <Select
                      value={detail.preferredContactMethod}
                      onValueChange={(v) => save("preferredContactMethod", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contactOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="company" className="grid gap-4 md:grid-cols-2">
                  {[
                    ["Company Name", "companyName"],
                    ["Legal Name", "legalName"],
                    ["Website", "website"],
                    ["Industry", "industry"],
                    ["Company Size", "companySize"],
                    ["Business Type", "businessType"],
                    ["Company Phone", "companyPhone"],
                    ["Company Email", "companyEmail"],
                  ].map(([label, field]) => (
                    <InlineInput
                      key={field}
                      label={label}
                      value={(detail as any)[field]}
                      onSave={(v) =>
                        field === "companyName"
                          ? savePatch({ companyName: v || null, company: v || null })
                          : save(field, v || null)
                      }
                    />
                  ))}
                </TabsContent>
                <TabsContent value="billing" className="grid gap-4 md:grid-cols-2">
                  {[
                    ["Billing Contact", "billingContactName"],
                    ["Billing Email", "billingEmail"],
                    ["Billing Phone", "billingPhone"],
                    ["Account Owner ID", "accountOwnerId"],
                    ["Service Start", "serviceStartDate"],
                    ["Renewal Date", "renewalDate"],
                  ].map(([label, field]) => (
                    <InlineInput
                      key={field}
                      label={label}
                      type={field.includes("Date") || field.includes("Start") ? "date" : "text"}
                      value={
                        field.includes("Date") || field.includes("Start")
                          ? inputDate((detail as any)[field])
                          : (detail as any)[field]
                      }
                      onSave={(v) => save(field, v || null)}
                    />
                  ))}
                  <InlineInput
                    label="Internal Tags"
                    value={(detail.internalTags ?? []).join(", ")}
                    onSave={(v) =>
                      save(
                        "internalTags",
                        v
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </TabsContent>
                <TabsContent value="notes" className="space-y-3">
                  <Textarea
                    placeholder="Add a client note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button disabled={!note.trim()} onClick={() => addNote.mutate()}>
                    Add Note
                  </Button>
                  {detail.notes.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-4">
                        <p>{item.body}</p>
                        <p className="text-xs text-muted-foreground">{fmt(item.createdAt)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="tasks" className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <Input
                      placeholder="Client task"
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                    />
                    <Input
                      type="date"
                      value={taskDue}
                      onChange={(e) => setTaskDue(e.target.value)}
                    />
                    <Button disabled={!task.trim()} onClick={() => addTask.mutate()}>
                      Add
                    </Button>
                  </div>
                  {detail.tasks.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 rounded-md border p-2">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) =>
                          updateTask.mutate({ id: item.id, completed: Boolean(checked) })
                        }
                      />
                      <span className={item.completed ? "text-muted-foreground line-through" : ""}>
                        {item.title} · {fmt(item.dueAt)}
                      </span>
                    </label>
                  ))}
                </TabsContent>
                <TabsContent value="data" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Record Details</CardTitle>
                      <CardDescription>
                        When and where this client first entered the system.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="font-medium">Lead Entered</p>
                        <p className="mt-1 text-muted-foreground">
                          {formatDateTime(detail.sourceLead?.createdAt ?? detail.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Converted to Client</p>
                        <p className="mt-1 text-muted-foreground">
                          {formatDateTime(
                            typeof recordMetadata(detail).convertedAt === "string"
                              ? String(recordMetadata(detail).convertedAt)
                              : detail.createdAt,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">IP Address</p>
                        <p className="mt-1 text-muted-foreground">
                          {typeof recordMetadata(detail).clientIp === "string"
                            ? String(recordMetadata(detail).clientIp)
                            : "Not recorded"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Form</p>
                        <p className="mt-1 text-muted-foreground">
                          {typeof recordMetadata(detail).formName === "string"
                            ? String(recordMetadata(detail).formName)
                            : "Not recorded"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Client Source</p>
                        <p className="mt-1 text-muted-foreground">{detail.source}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Information Submitted</CardTitle>
                      <CardDescription>
                        The information originally provided by this client.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.entries(detail.formData ?? {}).length > 0 ? (
                        <dl className="divide-y">
                          {Object.entries(detail.formData ?? {}).map(([key, value]) => (
                            <div
                              key={key}
                              className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4"
                            >
                              <dt className="text-sm font-medium text-muted-foreground">
                                {formFieldLabel(key)}
                              </dt>
                              <dd className="min-w-0 text-sm">
                                <FormDataValue fieldKey={key} value={value} />
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No submitted form data is available.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : null}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </AdminSidebar>
  );
}
