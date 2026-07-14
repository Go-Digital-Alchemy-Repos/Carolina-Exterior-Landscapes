import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_COOKIE_CONSENT_PREFERENCES,
  buildCookieConsentRecord,
  isCookieConsentRecordActive,
  readCookieConsentRecord,
  writeCookieConsentRecord,
  type CookieConsentPreferences,
} from "@/lib/cookie-consent";
import { cn } from "@/lib/utils";

type EditableCookiePreference = Exclude<keyof CookieConsentPreferences, "essential">;

const SETTINGS_ROWS: Array<{
  key: keyof CookieConsentPreferences;
  title: string;
  description: string;
  editable: boolean;
}> = [
  {
    key: "essential",
    title: "Essential Cookies",
    description: "Required for security, navigation, and core site functionality. These always stay on.",
    editable: false,
  },
  {
    key: "preferences",
    title: "Preferences Cookies",
    description: "Remember choices such as display preferences to improve your experience on return visits.",
    editable: true,
  },
  {
    key: "analytics",
    title: "Analytics Cookies",
    description: "Help us understand how visitors use the site so we can improve performance and usability.",
    editable: true,
  },
  {
    key: "marketing",
    title: "Marketing Cookies",
    description: "Support campaign tracking and embedded third-party tools that help us reach the right audience.",
    editable: true,
  },
];

function hasActiveConsentRecord() {
  return isCookieConsentRecordActive(readCookieConsentRecord());
}

export function CookieConsentBanner() {
  const [location] = useLocation();
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(DEFAULT_COOKIE_CONSENT_PREFERENCES);

  const pathname = useMemo(() => location.split(/[?#]/)[0] || "/", [location]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsBannerVisible(pathname === "/" && !hasActiveConsentRecord());
  }, [pathname]);

  function saveConsent(nextPreferences: Partial<CookieConsentPreferences>) {
    writeCookieConsentRecord(buildCookieConsentRecord(nextPreferences));
    setPreferences({
      ...DEFAULT_COOKIE_CONSENT_PREFERENCES,
      ...nextPreferences,
      essential: true,
    });
    setIsSettingsOpen(false);
    setIsBannerVisible(false);
  }

  function acceptAll() {
    saveConsent({
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true,
    });
  }

  function essentialOnly() {
    saveConsent(DEFAULT_COOKIE_CONSENT_PREFERENCES);
  }

  function openSettings() {
    const stored = readCookieConsentRecord();
    setPreferences(stored?.preferences ?? DEFAULT_COOKIE_CONSENT_PREFERENCES);
    setIsSettingsOpen(true);
  }

  function updatePreference(key: EditableCookiePreference, checked: boolean) {
    setPreferences((current) => ({
      ...current,
      [key]: checked,
      essential: true,
    }));
  }

  return (
    <>
      {isBannerVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-lg border border-border/80 bg-background/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/85 animate-in slide-in-from-bottom-4 duration-300 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 space-y-2 pr-8 sm:pr-0">
              <h2 className="text-base font-semibold text-foreground">We use cookies to improve your experience.</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Essential cookies keep the site working. You can accept all cookies or review cookie settings to turn off non-essential cookies at any time.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-44">
              <Button type="button" onClick={acceptAll}>
                Accept All
              </Button>
              <Button type="button" variant="outline" onClick={essentialOnly}>
                Essential Only
              </Button>
              <Button type="button" variant="ghost" onClick={openSettings}>
                Cookie Settings
              </Button>
            </div>
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={essentialOnly}
              aria-label="Dismiss cookie banner"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cookie Settings</DialogTitle>
            <DialogDescription>
              Essential cookies keep the site secure and functional. You can choose whether to allow non-essential cookies below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {SETTINGS_ROWS.map((row) => (
              <div key={row.key} className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-card-foreground">{row.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{row.description}</p>
                </div>
                <Switch
                  checked={preferences[row.key]}
                  disabled={!row.editable}
                  onCheckedChange={(checked) => updatePreference(row.key as EditableCookiePreference, checked)}
                  aria-label={row.title}
                  className={cn(!row.editable && "opacity-100")}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={essentialOnly}>
              Essential Only
            </Button>
            <Button type="button" onClick={() => saveConsent(preferences)}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
