import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { AdminSidebar } from "./admin-sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Database, MessageSquareText, Plus } from "lucide-react";
import type { CrmLead, CrmLeadDetail, CrmLeadStage } from "@shared/schema";

const stages: Array<{ value: CrmLeadStage; label: string; className: string }> = [
  { value: "new", label: "New", className: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Contacted", className: "bg-cyan-100 text-cyan-800" },
  { value: "qualified", label: "Qualified", className: "bg-emerald-100 text-emerald-800" },
  { value: "proposal", label: "Proposal", className: "bg-amber-100 text-amber-800" },
  { value: "won", label: "Won", className: "bg-green-100 text-green-800" },
  { value: "lost", label: "Lost", className: "bg-slate-100 text-slate-800" },
];

const fmt = (date?: string | Date | null) =>
  date ? format(new Date(date), "MMM d, yyyy") : "No date";
const inputDate = (date?: string | Date | null) =>
  date ? format(new Date(date), "yyyy-MM-dd") : "";
type LeadType = "residential" | "commercial" | "contact" | "other";

function leadType(lead: CrmLead): LeadType {
  const metadata = lead.metadata && typeof lead.metadata === "object" ? lead.metadata : {};
  const explicit = metadata.leadType;
  if (explicit === "residential" || explicit === "commercial" || explicit === "contact") {
    return explicit;
  }
  const formName = typeof metadata.formName === "string" ? metadata.formName.toLowerCase() : "";
  if (formName.includes("commercial") && formName.includes("quote")) return "commercial";
  if (formName.includes("residential") && formName.includes("quote")) return "residential";
  return lead.source === "website_form" ? "contact" : "other";
}

function LeadTypeBadge({ lead }: { lead: CrmLead }) {
  const type = leadType(lead);
  const styles: Record<LeadType, string> = {
    residential: "border-emerald-200 bg-emerald-50 text-emerald-800",
    commercial: "border-indigo-200 bg-indigo-50 text-indigo-800",
    contact: "border-amber-200 bg-amber-50 text-amber-800",
    other: "border-slate-200 bg-slate-50 text-slate-700",
  };
  const label = type === "other" ? "Other" : `${type[0].toUpperCase()}${type.slice(1)}`;
  return (
    <Badge variant="outline" className={styles[type]}>
      {label}
    </Badge>
  );
}

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
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">Not provided</span>;
  }
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-2">
        {value.map((item, index) => (
          <Badge key={`${String(item)}-${index}`} variant="secondary">
            {String(item)}
          </Badge>
        ))}
      </div>
    );
  }
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
  if (fieldKey.toLowerCase().includes("email")) {
    return (
      <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${display}`}>
        {display}
      </a>
    );
  }
  if (fieldKey.toLowerCase().includes("phone")) {
    return (
      <a className="text-primary underline-offset-4 hover:underline" href={`tel:${display}`}>
        {display}
      </a>
    );
  }
  return <span className="whitespace-pre-wrap">{display}</span>;
}

function leadMetadata(lead: CrmLead) {
  return lead.metadata && typeof lead.metadata === "object" ? lead.metadata : {};
}

function formatDateTime(value?: string | Date | null) {
  return value ? format(new Date(value), "MMM d, yyyy 'at' h:mm a") : "Not recorded";
}

function stageMeta(stage: string) {
  return stages.find((item) => item.value === stage) ?? stages[0];
}

function LeadCard({ lead, onOpen }: { lead: CrmLead; onOpen: (lead: CrmLead) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
    data: { stage: lead.stage },
  });
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(lead)}
      className="w-full rounded-md border bg-background p-3 text-left shadow-sm hover:border-primary/40"
      data-testid={`lead-card-${lead.id}`}
    >
      <p className="font-medium">{lead.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {lead.email || lead.phone || "No contact info"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <LeadTypeBadge lead={lead} />
        <Badge variant="outline">{lead.source}</Badge>
        {lead.company ? <Badge variant="secondary">{lead.company}</Badge> : null}
      </div>
      {lead.nextFollowUpAt ? (
        <p className="mt-2 text-xs text-amber-700">Follow up {fmt(lead.nextFollowUpAt)}</p>
      ) : null}
    </button>
  );
}

function StageColumn({
  stage,
  leads,
  onOpen,
}: {
  stage: CrmLeadStage;
  leads: CrmLead[];
  onOpen: (lead: CrmLead) => void;
}) {
  const meta = stageMeta(stage);
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[280px] rounded-lg border bg-muted/20 p-3 ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <Badge className={meta.className}>{meta.label}</Badge>
        <Badge variant="outline">{leads.length}</Badge>
      </div>
      <div className="space-y-2">
        {leads.length ? (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={onOpen} />)
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
}

export default function CrmPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [note, setNote] = useState("");
  const [task, setTask] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const qs = new URLSearchParams({ q: query, stage }).toString();
  const { data: allLeads = [] } = useQuery<CrmLead[]>({ queryKey: [`/api/admin/crm?${qs}`] });
  const leads =
    typeFilter === "all" ? allLeads : allLeads.filter((lead) => leadType(lead) === typeFilter);
  const { data: detail } = useQuery<CrmLeadDetail>({
    queryKey: [`/api/admin/crm/${selectedId}`],
    enabled: Boolean(selectedId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).startsWith("/api/admin/crm"),
    });
  };
  const createLead = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", "/api/admin/crm", { ...form, source: "manual" })).json(),
    onSuccess: () => {
      invalidate();
      toast({ title: "Lead created" });
      setCreateOpen(false);
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
    },
  });
  const updateLead = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CrmLead> }) =>
      apiRequest("PATCH", `/api/admin/crm/${id}`, data),
    onSuccess: invalidate,
  });
  const addNote = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/crm/${selectedId}/notes`, { body: note }),
    onSuccess: () => {
      setNote("");
      invalidate();
    },
  });
  const addTask = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/admin/crm/${selectedId}/tasks`, {
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
      apiRequest("PATCH", `/api/admin/crm/tasks/${id}`, { completed }),
    onSuccess: invalidate,
  });

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        stages.map((item) => [item.value, leads.filter((lead) => lead.stage === item.value)]),
      ) as Record<CrmLeadStage, CrmLead[]>,
    [leads],
  );
  const onDragEnd = (event: DragEndEvent) => {
    const leadId = String(event.active.id);
    const nextStage = event.over?.id ? (String(event.over.id) as CrmLeadStage) : null;
    const current = leads.find((lead) => lead.id === leadId);
    if (nextStage && current && current.stage !== nextStage)
      updateLead.mutate({ id: leadId, data: { stage: nextStage } });
  };

  return (
    <AdminSidebar>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">CRM Pipeline</h1>
            <p className="text-muted-foreground">
              Track inbound leads from forms, social sources, and manual outreach.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Search leads..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48" data-testid="select-lead-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lead Types</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid gap-3 xl:grid-cols-6 md:grid-cols-3">
            {stages.map((item) => (
              <StageColumn
                key={item.value}
                stage={item.value}
                leads={grouped[item.value]}
                onOpen={(lead) => setSelectedId(lead.id)}
              />
            ))}
          </div>
        </DndContext>
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-md border">
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  className="grid w-full grid-cols-4 gap-4 p-3 text-left hover:bg-muted/30"
                  onClick={() => setSelectedId(lead.id)}
                >
                  <span>
                    <b>{lead.name}</b>
                    <br />
                    <small>{lead.email || lead.phone || "No contact info"}</small>
                  </span>
                  <span className="flex flex-wrap items-center gap-1">
                    <Badge className={stageMeta(lead.stage).className}>
                      {stageMeta(lead.stage).label}
                    </Badge>
                    <LeadTypeBadge lead={lead} />
                  </span>
                  <span>{lead.source}</span>
                  <span>{fmt(lead.createdAt)}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" size="md">
          <SheetHeader>
            <SheetTitle>Create Lead</SheetTitle>
            <SheetDescription>Add a manual CRM lead to the pipeline.</SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4">
            {(["name", "email", "phone", "company"] as const).map((key) => (
              <div key={key} className="space-y-1">
                <Label className="capitalize">{key}</Label>
                <Input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button disabled={!form.name.trim()} onClick={() => createLead.mutate()}>
              Create Lead
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" size="lg">
          <SheetHeader>
            <SheetTitle>{detail?.name ?? "Loading lead..."}</SheetTitle>
            <SheetDescription>
              {detail?.email || detail?.phone || "No contact info"}
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            {detail ? (
              <Tabs defaultValue="notes">
                <Card className="mb-4">
                  <CardContent className="grid gap-3 pt-4 md:grid-cols-2">
                    <div>
                      <Label>Stage</Label>
                      <Select
                        value={detail.stage}
                        onValueChange={(value) =>
                          updateLead.mutate({
                            id: detail.id,
                            data: { stage: value as CrmLeadStage },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Next Follow-Up</Label>
                      <Input
                        type="date"
                        defaultValue={inputDate(detail.nextFollowUpAt)}
                        onBlur={(e) =>
                          updateLead.mutate({
                            id: detail.id,
                            data: {
                              nextFollowUpAt: e.target.value ? new Date(e.target.value) : null,
                            },
                          })
                        }
                      />
                    </div>
                    <p className="flex items-center gap-2">
                      <b>Type:</b> <LeadTypeBadge lead={detail} />
                    </p>
                    <p>
                      <b>Source:</b> {detail.source}
                    </p>
                    <p>
                      <b>Company:</b> {detail.company || "—"}
                    </p>
                    <p>
                      <b>Linked Client:</b> {detail.client ? detail.client.name : "—"}
                    </p>
                  </CardContent>
                </Card>
                <TabsList>
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
                <TabsContent value="notes" className="space-y-3">
                  <Textarea
                    placeholder="Add an internal note..."
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
                  <div className="flex gap-2">
                    <Input
                      placeholder="Follow-up task"
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
                      <CardTitle className="text-base">Submission Details</CardTitle>
                      <CardDescription>
                        When and where this lead entered the system.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="font-medium">Date and Time</p>
                        <p className="mt-1 text-muted-foreground">
                          {formatDateTime(detail.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">IP Address</p>
                        <p className="mt-1 text-muted-foreground">
                          {typeof leadMetadata(detail).clientIp === "string"
                            ? String(leadMetadata(detail).clientIp)
                            : "Not recorded"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Form</p>
                        <p className="mt-1 text-muted-foreground">
                          {typeof leadMetadata(detail).formName === "string"
                            ? String(leadMetadata(detail).formName)
                            : "Not recorded"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Lead Source</p>
                        <p className="mt-1 text-muted-foreground">{detail.source}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Information Submitted</CardTitle>
                      <CardDescription>The information provided by this lead.</CardDescription>
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
