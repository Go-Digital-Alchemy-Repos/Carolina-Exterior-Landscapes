import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Settings } from "lucide-react";
import type { CrmLead, CrmLeadDetail, CrmLeadStage } from "@shared/schema";

interface CrmSettings {
  leadNotificationEmail: string;
}

const stages: Array<{ value: CrmLeadStage; label: string; className: string }> = [
  { value: "new", label: "New", className: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Contacted", className: "bg-cyan-100 text-cyan-800" },
  { value: "qualified", label: "Qualified", className: "bg-emerald-100 text-emerald-800" },
  { value: "proposal", label: "Proposal", className: "bg-amber-100 text-amber-800" },
  { value: "won", label: "Won", className: "bg-green-100 text-green-800" },
  { value: "lost", label: "Lost", className: "bg-slate-100 text-slate-800" },
];

const fmt = (date?: string | Date | null) => date ? format(new Date(date), "MMM d, yyyy") : "No date";
const inputDate = (date?: string | Date | null) => date ? format(new Date(date), "yyyy-MM-dd") : "";

function stageMeta(stage: string) {
  return stages.find((item) => item.value === stage) ?? stages[0];
}

function LeadCard({ lead, onOpen }: { lead: CrmLead; onOpen: (lead: CrmLead) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id, data: { stage: lead.stage } });
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
      <p className="mt-1 text-xs text-muted-foreground">{lead.email || lead.phone || "No contact info"}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline">{lead.source}</Badge>
        {lead.company ? <Badge variant="secondary">{lead.company}</Badge> : null}
      </div>
      {lead.nextFollowUpAt ? <p className="mt-2 text-xs text-amber-700">Follow up {fmt(lead.nextFollowUpAt)}</p> : null}
    </button>
  );
}

function StageColumn({ stage, leads, onOpen }: { stage: CrmLeadStage; leads: CrmLead[]; onOpen: (lead: CrmLead) => void }) {
  const meta = stageMeta(stage);
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={`min-h-[280px] rounded-lg border bg-muted/20 p-3 ${isOver ? "ring-2 ring-primary" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <Badge className={meta.className}>{meta.label}</Badge>
        <Badge variant="outline">{leads.length}</Badge>
      </div>
      <div className="space-y-2">
        {leads.length ? leads.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={onOpen} />) : <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">Drop leads here</div>}
      </div>
    </div>
  );
}

export default function CrmPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [note, setNote] = useState("");
  const [task, setTask] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leadNotificationEmail, setLeadNotificationEmail] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const qs = new URLSearchParams({ q: query, stage }).toString();
  const { data: leads = [] } = useQuery<CrmLead[]>({ queryKey: [`/api/admin/crm?${qs}`] });
  const { data: detail } = useQuery<CrmLeadDetail>({ queryKey: [`/api/admin/crm/${selectedId}`], enabled: Boolean(selectedId) });
  const { data: crmSettings } = useQuery<CrmSettings>({ queryKey: ["/api/admin/crm/settings"] });

  useEffect(() => {
    if (crmSettings) setLeadNotificationEmail(crmSettings.leadNotificationEmail);
  }, [crmSettings]);

  const invalidate = () => {
    queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("/api/admin/crm") });
  };
  const createLead = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/admin/crm", { ...form, source: "manual" })).json(),
    onSuccess: () => { invalidate(); toast({ title: "Lead created" }); setCreateOpen(false); setForm({ name: "", email: "", phone: "", company: "", message: "" }); },
  });
  const updateLead = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CrmLead> }) => apiRequest("PATCH", `/api/admin/crm/${id}`, data),
    onSuccess: invalidate,
  });
  const addNote = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/crm/${selectedId}/notes`, { body: note }),
    onSuccess: () => { setNote(""); invalidate(); },
  });
  const addTask = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/crm/${selectedId}/tasks`, { title: task, dueAt: taskDue || null }),
    onSuccess: () => { setTask(""); setTaskDue(""); invalidate(); },
  });
  const updateTask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => apiRequest("PATCH", `/api/admin/crm/tasks/${id}`, { completed }),
    onSuccess: invalidate,
  });
  const saveSettings = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/admin/crm/settings", { leadNotificationEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/settings"] });
      toast({ title: "CRM settings saved" });
      setSettingsOpen(false);
    },
  });

  const grouped = useMemo(() => Object.fromEntries(stages.map((item) => [item.value, leads.filter((lead) => lead.stage === item.value)])) as Record<CrmLeadStage, CrmLead[]>, [leads]);
  const onDragEnd = (event: DragEndEvent) => {
    const leadId = String(event.active.id);
    const nextStage = event.over?.id ? String(event.over.id) as CrmLeadStage : null;
    const current = leads.find((lead) => lead.id === leadId);
    if (nextStage && current && current.stage !== nextStage) updateLead.mutate({ id: leadId, data: { stage: nextStage } });
  };

  return (
    <AdminSidebar>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-semibold">CRM Pipeline</h1><p className="text-muted-foreground">Track inbound leads from forms, social sources, and manual outreach.</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(true)}><Settings className="mr-2 h-4 w-4" />Settings</Button>
            <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Lead</Button>
          </div>
        </div>
        <div className="flex gap-3">
          <Input placeholder="Search leads..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
          <Select value={stage} onValueChange={setStage}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Stages</SelectItem>{stages.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
        </div>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid gap-3 xl:grid-cols-6 md:grid-cols-3">{stages.map((item) => <StageColumn key={item.value} stage={item.value} leads={grouped[item.value]} onOpen={(lead) => setSelectedId(lead.id)} />)}</div>
        </DndContext>
        <Card>
          <CardHeader><CardTitle>Leads</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y rounded-md border">
              {leads.map((lead) => <button key={lead.id} className="grid w-full grid-cols-4 gap-4 p-3 text-left hover:bg-muted/30" onClick={() => setSelectedId(lead.id)}><span><b>{lead.name}</b><br /><small>{lead.email || lead.phone || "No contact info"}</small></span><span><Badge className={stageMeta(lead.stage).className}>{stageMeta(lead.stage).label}</Badge></span><span>{lead.source}</span><span>{fmt(lead.createdAt)}</span></button>)}
            </div>
          </CardContent>
        </Card>
      </div>
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" size="md"><SheetHeader><SheetTitle>Create Lead</SheetTitle><SheetDescription>Add a manual CRM lead to the pipeline.</SheetDescription></SheetHeader><SheetBody className="space-y-4">{(["name", "email", "phone", "company"] as const).map((key) => <div key={key} className="space-y-1"><Label className="capitalize">{key}</Label><Input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} /></div>)}<div className="space-y-1"><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} /></div></SheetBody><SheetFooter><Button disabled={!form.name.trim()} onClick={() => createLead.mutate()}>Create Lead</Button></SheetFooter></SheetContent>
      </Sheet>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" size="md">
          <SheetHeader>
            <SheetTitle>CRM Settings</SheetTitle>
            <SheetDescription>Control where new website lead notifications are sent.</SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Notifications</CardTitle>
                <CardDescription>Contact and quote form leads are saved to the CRM and emailed here. Use commas for multiple addresses.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="crm-lead-notification-email">Notification Email</Label>
                <Input
                  id="crm-lead-notification-email"
                  type="text"
                  value={leadNotificationEmail}
                  onChange={(event) => setLeadNotificationEmail(event.target.value)}
                  placeholder="van@carolinaexteriorlandscapes.com"
                />
              </CardContent>
            </Card>
          </SheetBody>
          <SheetFooter>
            <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>Save Settings</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" size="lg"><SheetHeader><SheetTitle>{detail?.name ?? "Loading lead..."}</SheetTitle><SheetDescription>{detail?.email || detail?.phone || "No contact info"}</SheetDescription></SheetHeader><SheetBody>{detail ? <Tabs defaultValue="notes"><Card className="mb-4"><CardContent className="grid gap-3 pt-4 md:grid-cols-2"><div><Label>Stage</Label><Select value={detail.stage} onValueChange={(value) => updateLead.mutate({ id: detail.id, data: { stage: value as CrmLeadStage } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{stages.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Next Follow-Up</Label><Input type="date" defaultValue={inputDate(detail.nextFollowUpAt)} onBlur={(e) => updateLead.mutate({ id: detail.id, data: { nextFollowUpAt: e.target.value ? new Date(e.target.value) : null } })} /></div><p><b>Source:</b> {detail.source}</p><p><b>Company:</b> {detail.company || "—"}</p><p><b>Linked Client:</b> {detail.client ? detail.client.name : "—"}</p></CardContent></Card><TabsList><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="data">Data</TabsTrigger></TabsList><TabsContent value="notes" className="space-y-3"><Textarea placeholder="Add an internal note..." value={note} onChange={(e) => setNote(e.target.value)} /><Button disabled={!note.trim()} onClick={() => addNote.mutate()}>Add Note</Button>{detail.notes.map((item) => <Card key={item.id}><CardContent className="pt-4"><p>{item.body}</p><p className="text-xs text-muted-foreground">{fmt(item.createdAt)}</p></CardContent></Card>)}</TabsContent><TabsContent value="tasks" className="space-y-3"><div className="flex gap-2"><Input placeholder="Follow-up task" value={task} onChange={(e) => setTask(e.target.value)} /><Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} /><Button disabled={!task.trim()} onClick={() => addTask.mutate()}>Add</Button></div>{detail.tasks.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-md border p-2"><Checkbox checked={item.completed} onCheckedChange={(checked) => updateTask.mutate({ id: item.id, completed: Boolean(checked) })} /><span className={item.completed ? "text-muted-foreground line-through" : ""}>{item.title} · {fmt(item.dueAt)}</span></label>)}</TabsContent><TabsContent value="data"><pre className="overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify({ formData: detail.formData, metadata: detail.metadata }, null, 2)}</pre></TabsContent></Tabs> : null}</SheetBody></SheetContent>
      </Sheet>
    </AdminSidebar>
  );
}
