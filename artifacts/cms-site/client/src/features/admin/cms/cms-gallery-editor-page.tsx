import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, EyeOff, Images, Plus, Trash2 } from "lucide-react";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { CmsImageUpload } from "@/features/admin/cms/components/cms-image-upload";
import { MediaPickerDialog } from "@/features/admin/cms/components/media-picker-dialog";
import { GalleryRenderer } from "@/components/shared/gallery-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DEFAULT_GALLERY_SETTINGS,
  type CmsGalleryItem,
  type CmsGalleryWithItems,
  type CmsMediaLibraryAsset,
  type GallerySettings,
} from "@shared/schema";

type EditableItem = Omit<CmsGalleryItem, "id" | "galleryId" | "createdAt" | "updatedAt"> & { id?: string };

function normalizeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s/-]+/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/\/+/g, "/").replace(/(^[-/]+|[-/]+$)/g, "");
}

const emptyGallery = (): CmsGalleryWithItems => ({
  id: "",
  title: "",
  slug: "",
  description: "",
  status: "draft",
  layout: "grid",
  settings: DEFAULT_GALLERY_SETTINGS,
  createdBy: null,
  updatedBy: null,
  publishedAt: null,
  createdAt: null,
  updatedAt: null,
  items: [],
});

export default function CmsGalleryEditorPage() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = !params.id || params.id === "new";
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [draft, setDraft] = useState<CmsGalleryWithItems>(emptyGallery);

  const { data: loadedGallery } = useQuery<CmsGalleryWithItems>({
    queryKey: [`/api/admin/cms/galleries/${params.id}`],
    enabled: !isNew,
  });

  useEffect(() => {
    if (loadedGallery) setDraft({ ...loadedGallery, settings: { ...DEFAULT_GALLERY_SETTINGS, ...loadedGallery.settings } });
  }, [loadedGallery]);

  const previewGallery = useMemo<CmsGalleryWithItems>(() => ({
    ...draft,
    id: draft.id || "preview",
    title: draft.title || "Gallery Preview",
    slug: draft.slug || "gallery-preview",
    layout: draft.layout || "grid",
    settings: { ...DEFAULT_GALLERY_SETTINGS, ...draft.settings },
    items: draft.items.map((item, index) => ({ ...item, id: item.id || `preview-${index}`, galleryId: draft.id || "preview", sortOrder: index, createdAt: null, updatedAt: null })),
  }), [draft]);

  const invalidate = () => {
    queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/admin/cms/galleries") });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...draft,
        slug: normalizeSlug(draft.slug || draft.title),
        settings: { ...DEFAULT_GALLERY_SETTINGS, ...draft.settings },
        items: draft.items.map((item, index) => ({ ...item, sortOrder: index })),
      };
      const response = await apiRequest(isNew ? "POST" : "PUT", isNew ? "/api/admin/cms/galleries" : `/api/admin/cms/galleries/${draft.id}`, payload);
      return response.json() as Promise<CmsGalleryWithItems>;
    },
    onSuccess: (gallery) => {
      invalidate();
      toast({ title: "Gallery saved" });
      if (isNew) navigate(`/admin/cms/galleries/${gallery.id}`);
      setDraft({ ...gallery, settings: { ...DEFAULT_GALLERY_SETTINGS, ...gallery.settings } });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  function setField<K extends keyof CmsGalleryWithItems>(key: K, value: CmsGalleryWithItems[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setSetting<K extends keyof GallerySettings>(key: K, value: GallerySettings[K]) {
    setDraft((current) => ({ ...current, settings: { ...DEFAULT_GALLERY_SETTINGS, ...current.settings, [key]: value } }));
  }

  function addAssets(assets: CmsMediaLibraryAsset[]) {
    const newItems: EditableItem[] = assets.map((asset, index) => ({
      mediaId: asset.id,
      imageUrl: asset.url,
      alt: asset.alt || asset.title || asset.originalName,
      title: asset.title ?? "",
      caption: asset.caption ?? "",
      linkUrl: "",
      ctaText: "",
      tags: [],
      sortOrder: draft.items.length + index,
    }));
    setDraft((current) => ({ ...current, items: [...current.items, ...newItems as CmsGalleryItem[]] }));
  }

  function updateItem(index: number, patch: Partial<EditableItem>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const next = [...current.items];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, items: next };
    });
  }

  function removeItem(index: number) {
    setDraft((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/cms/galleries")}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{isNew ? "New Gallery" : draft.title || "Gallery"}</h1>
                <Badge variant={draft.status === "published" ? "default" : "outline"} className={draft.status === "published" ? "bg-green-600" : ""}>
                  {draft.status === "published" ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                  {draft.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Create reusable photo galleries for pages and blog posts.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>Preview Gallery</Button>
            <Button type="button" onClick={() => save.mutate()} disabled={save.isPending}>Save Gallery</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Gallery Details</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={draft.title} onChange={(event) => {
                    const title = event.target.value;
                    setDraft((current) => ({ ...current, title, slug: slugEdited ? current.slug : normalizeSlug(title) }));
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={draft.slug} onChange={(event) => { setSlugEdited(true); setField("slug", normalizeSlug(event.target.value)); }} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={draft.description ?? ""} onChange={(event) => setField("description", event.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={draft.status} onValueChange={(value) => setField("status", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <Select value={draft.layout} onValueChange={(value) => setField("layout", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="masonry">Masonry</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="slider">Slider</SelectItem>
                      <SelectItem value="featured">Featured + thumbnails</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Images</CardTitle>
                <Button type="button" onClick={() => setPickerOpen(true)}><Plus className="h-4 w-4" /> Add Images</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {draft.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                    <Images className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    Add images to build this gallery.
                  </div>
                ) : draft.items.map((item, index) => (
                  <div key={item.id ?? index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-[180px_1fr]">
                    <CmsImageUpload value={item.imageUrl} onChange={(url) => updateItem(index, { imageUrl: url })} data-testid={`gallery-item-upload-${index}`} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input value={item.title ?? ""} onChange={(event) => updateItem(index, { title: event.target.value })} placeholder="Title" />
                      <Input value={item.alt ?? ""} onChange={(event) => updateItem(index, { alt: event.target.value })} placeholder="Alt text" />
                      <Textarea value={item.caption ?? ""} onChange={(event) => updateItem(index, { caption: event.target.value })} placeholder="Caption" className="md:col-span-2" />
                      <Input value={item.linkUrl ?? ""} onChange={(event) => updateItem(index, { linkUrl: event.target.value })} placeholder="Link URL" autoPrependHttps />
                      <Input value={item.ctaText ?? ""} onChange={(event) => updateItem(index, { ctaText: event.target.value })} placeholder="CTA text" />
                      <div className="flex gap-2 md:col-span-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => moveItem(index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /> Move up</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => moveItem(index, 1)} disabled={index === draft.items.length - 1}><ArrowDown className="h-4 w-4" /> Move down</Button>
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4" /> Remove</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <DisplaySettings settings={{ ...DEFAULT_GALLERY_SETTINGS, ...draft.settings }} layout={draft.layout} onChange={setSetting} />
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent>
                <GalleryRenderer gallery={previewGallery} preview />
              </CardContent>
            </Card>
          </div>
        </div>

        <MediaPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={() => undefined}
          onSelectMany={addAssets}
          typeFilter="images"
          multiple
        />

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Gallery Preview</DialogTitle>
              <DialogDescription>Previewing the current gallery draft as it would appear inside page or post content.</DialogDescription>
            </DialogHeader>
            <article className="max-h-[70vh] overflow-y-auto rounded-lg border bg-background p-6">
              <h2 className="text-2xl font-semibold">{previewGallery.title}</h2>
              {previewGallery.description ? <p className="mt-2 text-muted-foreground">{previewGallery.description}</p> : null}
              <div className="mt-6"><GalleryRenderer gallery={previewGallery} preview /></div>
            </article>
          </DialogContent>
        </Dialog>
      </div>
    </AdminSidebar>
  );
}

function DisplaySettings({
  settings,
  layout,
  onChange,
}: {
  settings: GallerySettings;
  layout: string;
  onChange: <K extends keyof GallerySettings>(key: K, value: GallerySettings[K]) => void;
}) {
  const slideLike = layout === "carousel" || layout === "slider" || layout === "featured";
  return (
    <Card>
      <CardHeader><CardTitle>Display Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {["grid", "masonry", "carousel"].includes(layout) ? (
          <div className="grid grid-cols-3 gap-2">
            <NumberField label="Desktop columns / shown" value={settings.columnsDesktop} min={1} max={6} onChange={(value) => onChange("columnsDesktop", value)} />
            <NumberField label="Tablet" value={settings.columnsTablet} min={1} max={4} onChange={(value) => onChange("columnsTablet", value)} />
            <NumberField label="Mobile" value={settings.columnsMobile} min={1} max={2} onChange={(value) => onChange("columnsMobile", value)} />
          </div>
        ) : null}
        <SelectField label="Spacing" value={settings.spacing} onChange={(value) => onChange("spacing", value as GallerySettings["spacing"])} options={[["none", "None"], ["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]} />
        <SelectField label="Image ratio" value={settings.imageRatio} onChange={(value) => onChange("imageRatio", value as GallerySettings["imageRatio"])} options={[["auto", "Natural"], ["1/1", "Square"], ["4/3", "4:3"], ["3/2", "3:2"], ["16/9", "16:9"]]} />
        <SelectField label="Image fit" value={settings.cropMode} onChange={(value) => onChange("cropMode", value as GallerySettings["cropMode"])} options={[["cover", "Crop to fill"], ["contain", "Fit full image"]]} />
        <SelectField label="Corner radius" value={settings.borderRadius} onChange={(value) => onChange("borderRadius", value as GallerySettings["borderRadius"])} options={[["none", "None"], ["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]} />
        <SelectField label="Hover effect" value={settings.hoverEffect} onChange={(value) => onChange("hoverEffect", value as GallerySettings["hoverEffect"])} options={[["none", "None"], ["zoom", "Zoom"], ["fade", "Fade"]]} />
        <NumberField label="Image limit" value={settings.maxImages} min={0} max={200} onChange={(value) => onChange("maxImages", value)} />
        <SelectField label="Caption position" value={settings.captionPosition} onChange={(value) => onChange("captionPosition", value as GallerySettings["captionPosition"])} options={[["below", "Below image"], ["overlay", "Overlay"]]} />
        {slideLike ? <SelectField label="Transition effect" value={settings.transitionEffect} onChange={(value) => onChange("transitionEffect", value as GallerySettings["transitionEffect"])} options={[["none", "No transition effect"], ["fade", "Fade"], ["slide", "Slide left/right"], ["zoom", "Zoom"]]} /> : null}
        {(slideLike || settings.lightbox) ? (
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="Arrow color" value={settings.arrowIconColor} onChange={(value) => onChange("arrowIconColor", value)} />
            <ColorField label="Arrow background" value={settings.arrowBackgroundColor} onChange={(value) => onChange("arrowBackgroundColor", value)} />
          </div>
        ) : null}
        <ToggleField label="Show title" checked={settings.showTitle} onChange={(value) => onChange("showTitle", value)} />
        <ToggleField label="Show captions" checked={settings.showCaptions} onChange={(value) => onChange("showCaptions", value)} />
        <ToggleField label="Lightbox" checked={settings.lightbox} onChange={(value) => onChange("lightbox", value)} />
      </CardContent>
    </Card>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label><Input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label><Input type="color" value={value || "#ffffff"} onChange={(event) => onChange(event.target.value)} /></div>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(([optionValue, label]) => <SelectItem key={optionValue} value={optionValue}>{label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div>;
}
