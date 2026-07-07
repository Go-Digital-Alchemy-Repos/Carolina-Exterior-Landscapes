import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Save, Type } from "lucide-react";
import { Link } from "wouter";
import { AdminSidebar } from "./admin-sidebar";
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
import { useToast } from "@/hooks/use-toast";
import { CmsImageUpload } from "@/features/admin/cms/components/cms-image-upload";
import {
  BRANDING_FONT_OPTIONS,
  BRANDING_SANS_FONT_OPTIONS,
  BRANDING_SERIF_FONT_OPTIONS,
  fontFamilyForBrandingOption,
  type BrandingFontOption,
} from "@/lib/branding";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export type BrandingSubview = "branding" | "colors" | "typography";

type SettingsResponse = Record<string, Record<string, { value: string; isSecret: boolean }>>;

type SettingField = {
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  type?: "text" | "url" | "tel" | "asset";
  helpText?: string;
};

type ColorField = {
  key: string;
  label: string;
  fallback: string;
  description?: string;
};

const DEFAULT_FONT_VALUE = "__default__";

const DESIGN_TABS: Array<{ value: BrandingSubview; label: string; href: string }> = [
  { value: "branding", label: "Branding", href: "/admin/design/branding" },
  { value: "colors", label: "Color Palette", href: "/admin/design/colors" },
  { value: "typography", label: "Typography", href: "/admin/design/typography" },
];

const DESIGN_COPY: Record<BrandingSubview, { title: string; description: string }> = {
  branding: {
    title: "Branding",
    description: "Manage public identity assets and company details used across the website.",
  },
  colors: {
    title: "Color Palette",
    description: "Control the public website brand colors and text color tokens.",
  },
  typography: {
    title: "Typography",
    description:
      "Choose the frontend heading and body fonts with inline previews for each Google Font option.",
  },
};

const BRANDING_FIELDS: SettingField[] = [
  {
    key: "frontend_logo_url",
    label: "Header Logo",
    placeholder: "/images/logo-full.png",
    type: "asset",
    helpText: "Drag and drop a logo, upload a new file, or pick one from the media library. SVG is recommended for crisp header display.",
  },
  {
    key: "favicon_url",
    label: "Favicon / Admin Icon",
    placeholder: "/images/symbol.svg",
    type: "asset",
    helpText: "Upload or choose a square SVG, PNG, or ICO. This feeds the browser favicon and admin icon.",
  },
  {
    key: "company_name",
    label: "Company Name",
    placeholder: "Carolina Exterior Landscapes",
  },
  {
    key: "company_address",
    label: "Company Address",
    placeholder: "Monroe, NC 28110",
  },
  {
    key: "company_phone_numbers",
    label: "Phone Display",
    placeholder: "(704) 975-5867",
    type: "tel",
  },
  {
    key: "company_google_business_url",
    label: "Google Business URL",
    placeholder: "https://www.google.com/...",
    type: "url",
  },
];

const BRAND_COLORS: ColorField[] = [
  { key: "brand_primary_color", label: "Primary", fallback: "#E8520A" },
  { key: "brand_secondary_color", label: "Secondary", fallback: "#2D5F3F" },
  { key: "brand_tertiary_color", label: "Tertiary / Accent", fallback: "#2C2C2C" },
  { key: "brand_quaternary_color", label: "Quaternary", fallback: "#406A87" },
];

const TEXT_COLORS: ColorField[] = [
  { key: "text_h1_color", label: "H1", fallback: "#FFFFFF" },
  { key: "text_h2_color", label: "H2", fallback: "#111827" },
  { key: "text_h3_h6_color", label: "H3-H6", fallback: "#111827" },
  { key: "text_body_color", label: "Body Text", fallback: "#374151" },
  { key: "text_heading_subtext_color", label: "Heading Subtext", fallback: "#6B7280" },
  { key: "text_supporting_copy_color", label: "Supporting Copy", fallback: "#6B7280" },
  { key: "text_helper_text_color", label: "Helper Text", fallback: "#64748B" },
  { key: "text_meta_color", label: "Meta Text", fallback: "#64748B" },
  { key: "text_link_color", label: "Link", fallback: "#C94608" },
  { key: "text_link_hover_color", label: "Link Hover", fallback: "#2D5F3F" },
  { key: "text_inverse_color", label: "Inverse Text", fallback: "#FFFFFF" },
  { key: "text_primary_foreground_color", label: "On Primary", fallback: "#FFFFFF" },
  { key: "text_secondary_foreground_color", label: "On Secondary", fallback: "#FFFFFF" },
  { key: "text_tertiary_foreground_color", label: "On Tertiary", fallback: "#FFFFFF" },
];

function isHexColor(value: string) {
  return /^#([0-9a-fA-F]{6})$/.test(value.trim());
}

function settingValue(settings: SettingsResponse, key: string) {
  return settings.branding?.[key]?.value ?? "";
}

function fontSettingValue(settings: SettingsResponse, key: string) {
  return settingValue(settings, key) || DEFAULT_FONT_VALUE;
}

function SettingInput({
  field,
  value,
  onSave,
}: {
  field: SettingField;
  value: string;
  onSave: (key: string, value: string) => void;
}) {
  if (field.type === "asset") {
    return (
      <div className="space-y-2">
        <CmsImageUpload
          value={value}
          onChange={(url) => onSave(field.key, url)}
          label={field.label}
          helpText={field.helpText}
          data-testid={`design-upload-${field.key}`}
        />
        <Input
          id={`design-${field.key}`}
          type="url"
          defaultValue={value}
          placeholder={field.placeholder}
          onBlur={(event) => onSave(field.key, event.currentTarget.value)}
          className="font-mono text-xs"
          aria-label={`${field.label} URL`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`design-${field.key}`}>{field.label}</Label>
      <Input
        id={`design-${field.key}`}
        type={field.type ?? "text"}
        defaultValue={value}
        placeholder={field.placeholder}
        onBlur={(event) => onSave(field.key, event.currentTarget.value)}
      />
      {field.description ? (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      ) : null}
    </div>
  );
}

function ColorInput({
  field,
  value,
  onSave,
}: {
  field: ColorField;
  value: string;
  onSave: (key: string, value: string) => void;
}) {
  const current = isHexColor(value) ? value : field.fallback;

  return (
    <div className="space-y-2">
      <Label htmlFor={`design-${field.key}`}>{field.label}</Label>
      <div className="flex gap-2">
        <Input
          id={`design-${field.key}`}
          type="color"
          defaultValue={current}
          className="h-9 w-12 shrink-0 p-1"
          onBlur={(event) => onSave(field.key, event.currentTarget.value)}
          aria-label={`${field.label} color picker`}
        />
        <Input
          defaultValue={value}
          placeholder={field.fallback}
          className="font-mono"
          onBlur={(event) => {
            const nextValue = event.currentTarget.value.trim();
            if (!nextValue || isHexColor(nextValue)) onSave(field.key, nextValue);
          }}
        />
      </div>
      {field.description ? (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      ) : null}
    </div>
  );
}

function FontSelect({
  id,
  label,
  value,
  onChange,
  helpText,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`design-${id}`}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={`design-${id}`}>
          <SelectValue placeholder="Use current theme font" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_FONT_VALUE}>Use current theme font</SelectItem>
          {BRANDING_FONT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{helpText}</p>
    </div>
  );
}

function FontOptionCard({
  option,
  selectedValue,
  onSelect,
  sampleKind,
}: {
  option: BrandingFontOption;
  selectedValue: string;
  onSelect: (value: string) => void;
  sampleKind: "heading" | "body";
}) {
  const selected = selectedValue === option.value;

  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={cn(
        "relative w-full rounded-md border bg-muted/40 p-4 text-left transition-colors hover:border-primary/60 hover:bg-background",
        selected && "border-primary bg-primary/5 ring-1 ring-primary",
      )}
      aria-pressed={selected}
    >
      {selected ? (
        <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Check className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <p className="pr-8 text-sm font-semibold text-foreground">{option.label}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {option.category === "sans" ? "Sans Serif" : "Serif"}
      </p>
      <p
        className={cn(
          "mt-3 text-foreground",
          sampleKind === "heading"
            ? "text-xl font-bold leading-tight"
            : "text-sm font-medium leading-relaxed",
        )}
        style={{ fontFamily: option.family }}
      >
        {sampleKind === "heading"
          ? "The right words should feel understood."
          : "Thoughtful typography helps editors preview the real feeling of the brand before publishing."}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{option.preview}</p>
    </button>
  );
}

function FontPickerColumn({
  title,
  description,
  selectedValue,
  onSelect,
  sampleKind,
}: {
  title: string;
  description: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  sampleKind: "heading" | "body";
}) {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sans Serif Options
          </p>
          <div className="grid gap-3">
            {BRANDING_SANS_FONT_OPTIONS.map((option) => (
              <FontOptionCard
                key={option.value}
                option={option}
                selectedValue={selectedValue}
                onSelect={onSelect}
                sampleKind={sampleKind}
              />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Serif Options
          </p>
          <div className="grid gap-3">
            {BRANDING_SERIF_FONT_OPTIONS.map((option) => (
              <FontOptionCard
                key={option.value}
                option={option}
                selectedValue={selectedValue}
                onSelect={onSelect}
                sampleKind={sampleKind}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDesignPage({ initialSubview }: { initialSubview: BrandingSubview }) {
  const copy = DESIGN_COPY[initialSubview];
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings = {} } = useQuery<SettingsResponse>({ queryKey: ["/api/admin/settings"] });
  const savedBodyFont = fontSettingValue(settings, "frontend_body_font");
  const savedHeadingFont = fontSettingValue(settings, "frontend_heading_font");
  const [bodyFont, setBodyFont] = useState(savedBodyFont);
  const [headingFont, setHeadingFont] = useState(savedHeadingFont);

  useEffect(() => {
    setBodyFont(savedBodyFont);
    setHeadingFont(savedHeadingFont);
  }, [savedBodyFont, savedHeadingFont]);

  const saveSetting = useMutation({
    mutationFn: async (payload: { key: string; value: string }) => {
      const res = await apiRequest("PUT", "/api/admin/settings", {
        category: "branding",
        isSecret: false,
        ...payload,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
      toast({ title: "Brand setting saved" });
    },
  });

  const onSave = (key: string, value: string) => {
    const current = settingValue(settings, key);
    if (current === value) return;
    saveSetting.mutate({ key, value });
  };

  const saveFontsMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        apiRequest("PUT", "/api/admin/settings", {
          key: "frontend_body_font",
          value: bodyFont === DEFAULT_FONT_VALUE ? "" : bodyFont,
          category: "branding",
          isSecret: false,
        }),
        apiRequest("PUT", "/api/admin/settings", {
          key: "frontend_heading_font",
          value: headingFont === DEFAULT_FONT_VALUE ? "" : headingFont,
          category: "branding",
          isSecret: false,
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
      toast({ title: "Typography saved" });
    },
  });

  const hasFontChanges = bodyFont !== savedBodyFont || headingFont !== savedHeadingFont;
  const previewHeadingStyle = {
    fontFamily:
      fontFamilyForBrandingOption(headingFont === DEFAULT_FONT_VALUE ? null : headingFont) ??
      undefined,
  };
  const previewBodyStyle = {
    fontFamily:
      fontFamilyForBrandingOption(bodyFont === DEFAULT_FONT_VALUE ? null : bodyFont) ?? undefined,
  };

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-heading font-bold" data-testid="text-design-title">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-design-description">
            {copy.description}
          </p>
        </div>

        <nav
          className="inline-flex rounded-md bg-muted p-1 text-sm text-muted-foreground"
          aria-label="Design sections"
        >
          {DESIGN_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              className={cn(
                "rounded-sm px-8 py-1.5 font-medium transition-colors hover:text-foreground",
                initialSubview === tab.value && "bg-background text-foreground shadow-sm",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {initialSubview === "branding" ? (
          <Card>
            <CardHeader>
              <CardTitle>Public Identity</CardTitle>
              <CardDescription>
                These values feed the public header, favicon, footer, forms, and email shell.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {BRANDING_FIELDS.map((field) => (
                <SettingInput
                  key={field.key}
                  field={field}
                  value={settingValue(settings, field.key)}
                  onSave={onSave}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {initialSubview === "colors" ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>
                  Primary theme tokens used by public buttons, accents, and highlights.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {BRAND_COLORS.map((field) => (
                  <ColorInput
                    key={field.key}
                    field={field}
                    value={settingValue(settings, field.key)}
                    onSave={onSave}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Text Colors</CardTitle>
                <CardDescription>
                  Optional overrides for public headings, copy, links, and foreground colors.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {TEXT_COLORS.map((field) => (
                  <ColorInput
                    key={field.key}
                    field={field}
                    value={settingValue(settings, field.key)}
                    onSave={onSave}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {initialSubview === "typography" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Type className="h-4 w-4 text-primary" />
                Frontend Typography
              </CardTitle>
              <CardDescription>
                Choose one font for headings and another for body copy on the public-facing website.
                Each option includes an inline sample so editors can compare type directly in the
                admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FontSelect
                  id="frontend_heading_font"
                  label="Heading Font"
                  value={headingFont}
                  onChange={setHeadingFont}
                  helpText="Choose from 10 sans serif and 10 serif Google Fonts."
                />
                <FontSelect
                  id="frontend_body_font"
                  label="Body Font"
                  value={bodyFont}
                  onChange={setBodyFont}
                  helpText="Choose from the same balanced font library for paragraph copy."
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <FontPickerColumn
                  title="Heading Font Picker"
                  description="Preview how each font feels in large editorial headings."
                  selectedValue={headingFont}
                  onSelect={setHeadingFont}
                  sampleKind="heading"
                />
                <FontPickerColumn
                  title="Body Font Picker"
                  description="Preview how each font reads in paragraph-sized content."
                  selectedValue={bodyFont}
                  onSelect={setBodyFont}
                  sampleKind="body"
                />
              </div>

              <div className="rounded-md border bg-background p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preview
                </p>
                <p
                  className="mt-3 text-2xl font-semibold tracking-normal text-foreground"
                  style={previewHeadingStyle}
                >
                  Your public site heading preview appears here.
                </p>
                <p
                  className="mt-2 text-sm leading-relaxed text-muted-foreground"
                  style={previewBodyStyle}
                >
                  Use this preview to compare heading and body combinations before saving. These
                  font selections only apply to the public-facing website, not the admin dashboard.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => saveFontsMutation.mutate()}
                  disabled={!hasFontChanges || saveFontsMutation.isPending}
                  data-testid="button-save-branding-fonts"
                >
                  {saveFontsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Typography
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] })}
          >
            Refresh Settings
          </Button>
          {saveSetting.isPending ? (
            <span className="text-sm text-muted-foreground">Saving...</span>
          ) : null}
        </div>
      </div>
    </AdminSidebar>
  );
}
