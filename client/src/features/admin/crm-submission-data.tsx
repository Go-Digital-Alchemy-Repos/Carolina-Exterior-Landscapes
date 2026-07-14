import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock3, Database, MapPin } from "lucide-react";

export function crmFieldLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPresent(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function HumanValue({ value }: { value: unknown }) {
  if (!isPresent(value)) return <span>—</span>;
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
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "object") {
    return (
      <div className="space-y-2">
        {Object.entries(value as Record<string, unknown>)
          .filter(([, nested]) => isPresent(nested))
          .map(([key, nested]) => (
            <div key={key}>
              <span className="font-medium text-foreground">{crmFieldLabel(key)}:</span>{" "}
              <HumanValue value={nested} />
            </div>
          ))}
      </div>
    );
  }
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}

function safeDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : format(date, "MMM d, yyyy 'at' h:mm a");
}

export function CrmSubmissionData({
  formData,
  metadata,
  receivedAt,
}: {
  formData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  receivedAt?: string | Date | null;
}) {
  const submittedEntries = Object.entries(formData ?? {}).filter(([, value]) => isPresent(value));
  const meta = metadata ?? {};
  const timestamp =
    safeDate(receivedAt) ??
    safeDate(meta.submittedAt) ??
    safeDate(meta.createdAt) ??
    "Not recorded";
  const ipAddress =
    meta.ipAddress ?? meta.ip ?? meta.clientIp ?? meta.remoteAddress ?? "Not recorded";
  const metadataEntries = Object.entries(meta).filter(
    ([key, value]) =>
      isPresent(value) &&
      !["ipAddress", "ip", "clientIp", "remoteAddress", "submittedAt", "createdAt"].includes(key),
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="flex items-start gap-3 pt-4">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Entered system
              </p>
              <p className="mt-1 text-sm font-medium">{timestamp}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="flex items-start gap-3 pt-4">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                IP address
              </p>
              <p className="mt-1 break-all text-sm font-medium">{String(ipAddress)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submitted information</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {submittedEntries.length ? (
            submittedEntries.map(([key, value]) => (
              <div key={key} className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
                <span className="text-sm font-medium">{crmFieldLabel(key)}</span>
                <div className="min-w-0 text-sm text-muted-foreground">
                  <HumanValue value={value} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No form fields were stored for this record.
            </p>
          )}
        </CardContent>
      </Card>

      {metadataEntries.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-cyan-600" />
              Submission details
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {metadataEntries.map(([key, value]) => (
              <div key={key} className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
                <span className="text-sm font-medium">{crmFieldLabel(key)}</span>
                <div className="min-w-0 text-sm text-muted-foreground">
                  <HumanValue value={value} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
