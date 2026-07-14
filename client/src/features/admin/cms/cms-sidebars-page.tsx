import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementType } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { EditorLockBanner } from "@/components/shared/editor-lock-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Edit,
  GripVertical,
  Loader2,
  Mail,
  PanelRight,
  Plus,
  Star,
  Trash2,
  Type,
} from "lucide-react";
import {
  SIDEBAR_WIDGET_TYPES,
  type CmsForm,
  type CmsSidebar,
  type SidebarWidget,
  type SidebarWidgetType,
} from "@shared/schema";
import { useEditorLock } from "@/hooks/use-editor-lock";
import { useLockConflictGuard } from "@/hooks/use-lock-conflict-guard";

const WIDGET_LABELS: Record<SidebarWidgetType, string> = {
  form: "Form",
  callout: "Callout / CTA",
  "custom-html": "Custom HTML",
};

const WIDGET_ICONS: Record<SidebarWidgetType, ElementType> = {
  form: Mail,
  callout: Star,
  "custom-html": Type,
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function defaultWidget(type: SidebarWidgetType): SidebarWidget {
  if (type === "form") {
    return {
      id: generateId(),
      type,
      title: "Form",
      settings: {
        formSlug: "contact-form",
        description: "",
        buttonText: "",
      },
    };
  }
  if (type === "callout") {
    return {
      id: generateId(),
      type,
      title: "Helpful Resource",
      settings: {
        body: "Add a short message, promotion, or supporting note here.",
        buttonText: "",
        buttonUrl: "",
      },
    };
  }
  if (type === "custom-html") {
    return { id: generateId(), type, title: "Custom HTML", settings: { html: "" } };
  }
  return { id: generateId(), type, title: WIDGET_LABELS[type], settings: {} };
}

function widgetCount(sidebar: CmsSidebar) {
  return Array.isArray(sidebar.widgets) ? sidebar.widgets.length : 0;
}

function WidgetSettings({
  widget,
  onChange,
}: {
  widget: SidebarWidget;
  onChange: (updates: Partial<SidebarWidget>) => void;
}) {
  const { data: forms = [] } = useQuery<CmsForm[]>({
    queryKey: ["/api/admin/forms"],
    staleTime: 60_000,
  });
  const updateSetting = (key: string, value: unknown) => {
    onChange({ settings: { ...widget.settings, [key]: value } });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Widget Title</Label>
          <Input
            value={widget.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder={WIDGET_LABELS[widget.type]}
            data-testid={`input-widget-title-${widget.id}`}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Widget Type</Label>
          <Select
            value={widget.type}
            onValueChange={(type) => {
              const replacement = defaultWidget(type as SidebarWidgetType);
              onChange({
                type: replacement.type,
                title: replacement.title,
                settings: replacement.settings,
              });
            }}
          >
            <SelectTrigger data-testid={`select-widget-type-${widget.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIDEBAR_WIDGET_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {WIDGET_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {widget.type === "form" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Assigned Form</Label>
            <Select
              value={String(widget.settings.formSlug ?? "contact-form")}
              onValueChange={(value) => updateSetting("formSlug", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a form" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.slug}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Button Text Override{" "}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                value={String(widget.settings.buttonText ?? "")}
                onChange={(event) => updateSetting("buttonText", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Description Override{" "}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                value={String(widget.settings.description ?? "")}
                onChange={(event) => updateSetting("description", event.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {widget.type === "callout" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea
              value={String(widget.settings.body ?? "")}
              onChange={(event) => updateSetting("body", event.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Button Text</Label>
              <Input
                value={String(widget.settings.buttonText ?? "")}
                onChange={(event) => updateSetting("buttonText", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Button URL</Label>
              <Input
                value={String(widget.settings.buttonUrl ?? "")}
                onChange={(event) => updateSetting("buttonUrl", event.target.value)}
                placeholder="/contact"
                autoPrependHttps
              />
            </div>
          </div>
        </div>
      )}

      {widget.type === "custom-html" && (
        <div className="space-y-1.5">
          <Label>HTML</Label>
          <Textarea
            value={String(widget.settings.html ?? "")}
            onChange={(event) => updateSetting("html", event.target.value)}
            rows={5}
            className="font-mono text-sm"
            placeholder="<p>Custom widget content...</p>"
          />
        </div>
      )}
    </div>
  );
}

function SortableWidgetCard({
  widget,
  index,
  total,
  onChange,
  onMove,
  onDelete,
}: {
  widget: SidebarWidget;
  index: number;
  total: number;
  onChange: (updates: Partial<SidebarWidget>) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const Icon = WIDGET_ICONS[widget.type];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-lg border bg-card p-4",
        isDragging && "relative z-20 opacity-70 shadow-lg ring-2 ring-primary/30",
      )}
      data-testid={`sidebar-widget-${widget.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground cursor-grab hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          aria-label={`Drag ${widget.title || WIDGET_LABELS[widget.type]} widget to reorder`}
          title="Drag to reorder"
          data-testid={`drag-sidebar-widget-${widget.id}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Icon className="mt-2 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <WidgetSettings widget={widget} onChange={onChange} />
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Move ${widget.title || "widget"} up`}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Move ${widget.title || "widget"} down`}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`Delete ${widget.title || "widget"}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SidebarEditor({ sidebar, onClose }: { sidebar: CmsSidebar | null; onClose: () => void }) {
  const { toast } = useToast();
  const isNew = !sidebar;
  const [name, setName] = useState(sidebar?.name ?? "");
  const [description, setDescription] = useState(sidebar?.description ?? "");
  const [isDefault, setIsDefault] = useState(Boolean(sidebar?.isDefault));
  const [widgets, setWidgets] = useState<SidebarWidget[]>(
    Array.isArray(sidebar?.widgets) ? (sidebar!.widgets as SidebarWidget[]) : [],
  );
  const sortableSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const editorLock = useEditorLock({
    resourceType: "cms_sidebar",
    resourceId: isNew ? null : (sidebar?.id ?? null),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { name, description: description || null, isDefault, widgets };
      if (isNew) return apiRequest("POST", "/api/admin/cms/sidebars", body);
      return apiRequest("PUT", `/api/admin/cms/sidebars/${sidebar!.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/sidebars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sidebars"] });
      toast({ title: isNew ? "Sidebar created" : "Sidebar saved" });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save sidebar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useLockConflictGuard({
    active: !isNew && Boolean(sidebar?.id),
    resourceId: isNew ? null : (sidebar?.id ?? null),
    resourceLabel: "sidebar",
    editorLock,
    onConflict: onClose,
  });

  const updateWidget = useCallback((id: string, updates: Partial<SidebarWidget>) => {
    setWidgets((current) =>
      current.map((widget) => (widget.id === id ? { ...widget, ...updates } : widget)),
    );
  }, []);

  const moveWidget = (id: string, direction: -1 | 1) => {
    setWidgets((current) => {
      const index = current.findIndex((widget) => widget.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const reorderWidgets = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setWidgets((current) => {
      const oldIndex = current.findIndex((widget) => widget.id === active.id);
      const newIndex = current.findIndex((widget) => widget.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const addWidget = (type: SidebarWidgetType) => {
    setWidgets((current) => [...current, defaultWidget(type)]);
  };

  return (
    <div className="space-y-6">
      {editorLock.summary ? (
        <EditorLockBanner
          variant={editorLock.summary.variant}
          title={editorLock.summary.title}
          description={editorLock.summary.description}
          isLoading={editorLock.isLoading}
          onRefresh={editorLock.acquire}
        />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-semibold">
            {isNew ? "Create Sidebar" : `Edit ${sidebar.name}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Build reusable sidebars from widget components.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!name.trim() || saveMutation.isPending || editorLock.isReadOnly}
            data-testid="button-save-sidebar"
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isNew ? "Create Sidebar" : "Save Sidebar"}
          </Button>
        </div>
      </div>

      <Card
        className={cn(
          editorLock.hasLocking &&
            editorLock.isReadOnly &&
            "pointer-events-none select-none opacity-70",
        )}
      >
        <CardHeader>
          <CardTitle className="text-base">Sidebar Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Page Sidebar"
                data-testid="input-sidebar-name"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <Label>Default Sidebar</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Used when a page does not select a specific sidebar.
                </p>
              </div>
              <Switch
                checked={isDefault}
                onCheckedChange={setIsDefault}
                data-testid="switch-sidebar-default"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              placeholder="Internal note for admins"
            />
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          editorLock.hasLocking &&
            editorLock.isReadOnly &&
            "pointer-events-none select-none opacity-70",
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Widgets</CardTitle>
              <CardDescription>
                Stack widgets in the order they should appear on the sidebar.
              </CardDescription>
            </div>
            <Select onValueChange={(value) => addWidget(value as SidebarWidgetType)}>
              <SelectTrigger className="w-[210px]" data-testid="select-add-widget">
                <SelectValue placeholder="Add widget..." />
              </SelectTrigger>
              <SelectContent>
                {SIDEBAR_WIDGET_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {WIDGET_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {widgets.length === 0 ? (
            <div
              className="rounded-lg border border-dashed p-10 text-center text-muted-foreground"
              data-testid="text-empty-widgets"
            >
              <PanelRight className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="font-medium">No widgets yet</p>
              <p className="text-sm">Use the Add widget dropdown to start building this sidebar.</p>
            </div>
          ) : (
            <DndContext
              sensors={sortableSensors}
              collisionDetection={closestCenter}
              onDragEnd={reorderWidgets}
            >
              <SortableContext
                items={widgets.map((widget) => widget.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {widgets.map((widget, index) => (
                    <SortableWidgetCard
                      key={widget.id}
                      widget={widget}
                      index={index}
                      total={widgets.length}
                      onChange={(updates) => updateWidget(widget.id, updates)}
                      onMove={(direction) => moveWidget(widget.id, direction)}
                      onDelete={() =>
                        setWidgets((current) => current.filter((item) => item.id !== widget.id))
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CmsSidebarsPage() {
  const { toast } = useToast();
  const [editingSidebar, setEditingSidebar] = useState<CmsSidebar | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<CmsSidebar | null>(null);

  const { data: sidebars = [], isLoading } = useQuery<CmsSidebar[]>({
    queryKey: ["/api/admin/cms/sidebars"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/cms/sidebars/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/sidebars"] });
      toast({ title: "Sidebar deleted" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Failed to delete sidebar", variant: "destructive" }),
  });

  if (editingSidebar !== null) {
    return (
      <AdminSidebar>
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
          <SidebarEditor
            sidebar={editingSidebar === "new" ? null : editingSidebar}
            onClose={() => setEditingSidebar(null)}
          />
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-semibold" data-testid="text-sidebars-title">
              Sidebars & Widgets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create reusable right-side sidebars for CMS pages.
            </p>
          </div>
          <Button onClick={() => setEditingSidebar("new")} data-testid="button-create-sidebar">
            <Plus className="mr-2 h-4 w-4" />
            Create Sidebar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sidebars.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <PanelRight className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />
              <h2 className="text-lg font-medium">No sidebars yet</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Create a default sidebar or page-specific sidebar to get started.
              </p>
              <Button onClick={() => setEditingSidebar("new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Sidebar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sidebars.map((sidebar) => (
              <Card key={sidebar.id} data-testid={`card-sidebar-${sidebar.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {sidebar.name}
                        {sidebar.isDefault && (
                          <Badge className="bg-emerald-600 text-white">Default</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {sidebar.description || "No description"} · {widgetCount(sidebar)} widget
                        {widgetCount(sidebar) === 1 ? "" : "s"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSidebar(sidebar)}
                      >
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(sidebar)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sidebar</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? Pages using this sidebar will
              fall back to a full-width layout until another sidebar is selected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              data-testid="button-confirm-delete-sidebar"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSidebar>
  );
}
