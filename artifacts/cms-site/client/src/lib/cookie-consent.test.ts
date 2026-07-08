import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_DURATION_DAYS,
  COOKIE_CONSENT_STORAGE_KEY,
  DEFAULT_COOKIE_CONSENT_PREFERENCES,
  ESSENTIAL_ONLY_COOKIE_CONSENT_PREFERENCES,
  buildCookieConsentRecord,
  getCookieConsentPreferences,
  hasCookieConsent,
  isCookieConsentRecordActive,
  parseCookieConsentRecord,
  readCookieConsentRecord,
  subscribeToCookieConsent,
  writeCookieConsentRecord,
} from "@/lib/cookie-consent";

describe("cookie consent utilities", () => {
  const originalWindow = global.window;
  const originalDocument = global.document;

  beforeEach(() => {
    const storage = new Map<string, string>();
    const listeners = new Map<string, Set<(event: Event) => void>>();

    const mockWindow = {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
      addEventListener: (name: string, callback: (event: Event) => void) => {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name)?.add(callback);
      },
      removeEventListener: (name: string, callback: (event: Event) => void) => {
        listeners.get(name)?.delete(callback);
      },
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((callback) => callback(event));
        return true;
      },
    };

    const mockDocument = {
      cookie: "",
    };

    class MockCustomEvent<T> extends Event {
      detail: T;
      constructor(name: string, params: CustomEventInit<T>) {
        super(name);
        this.detail = params.detail as T;
      }
    }

    vi.stubGlobal("window", mockWindow);
    vi.stubGlobal("document", mockDocument);
    vi.stubGlobal("CustomEvent", MockCustomEvent);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalWindow) vi.stubGlobal("window", originalWindow);
    if (originalDocument) vi.stubGlobal("document", originalDocument);
  });

  it("defaults settings preferences to on without granting gated consent before save", () => {
    expect(getCookieConsentPreferences()).toEqual(DEFAULT_COOKIE_CONSENT_PREFERENCES);
    expect(hasCookieConsent("essential")).toBe(true);
    expect(hasCookieConsent("analytics")).toBe(false);
  });

  it("can build an explicit essential-only record", () => {
    const record = buildCookieConsentRecord(ESSENTIAL_ONLY_COOKIE_CONSENT_PREFERENCES);

    expect(record.preferences).toEqual(ESSENTIAL_ONLY_COOKIE_CONSENT_PREFERENCES);
  });

  it("writes consent, persists 60-day cookie state, and notifies subscribers", () => {
    const record = buildCookieConsentRecord({
      analytics: true,
      marketing: false,
      preferences: true,
    }, new Date("2026-06-24T12:00:00.000Z"));

    const listener = vi.fn();
    const unsubscribe = subscribeToCookieConsent(listener);

    writeCookieConsentRecord(record);

    expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe(JSON.stringify(record));
    expect(readCookieConsentRecord()).toEqual(record);
    expect(getCookieConsentPreferences()).toEqual(record.preferences);
    expect(hasCookieConsent("analytics")).toBe(true);
    expect(hasCookieConsent("marketing")).toBe(false);
    expect(document.cookie).toContain(`${COOKIE_CONSENT_COOKIE_NAME}=`);
    expect(document.cookie).toContain(`max-age=${COOKIE_CONSENT_DURATION_DAYS * 24 * 60 * 60}`);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toEqual(record);

    unsubscribe();
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: record }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("treats expired records as inactive", () => {
    const record = buildCookieConsentRecord(
      { analytics: true },
      new Date("2026-01-01T00:00:00.000Z"),
    );

    expect(isCookieConsentRecordActive(record, new Date("2026-02-15T00:00:00.000Z"))).toBe(true);
    expect(isCookieConsentRecordActive(record, new Date("2026-03-15T00:00:00.001Z"))).toBe(false);
  });

  it("ignores wrong-version and malformed records", () => {
    const wrongVersion = JSON.stringify({
      ...buildCookieConsentRecord({ analytics: true }),
      version: 999,
    });

    expect(parseCookieConsentRecord(wrongVersion)).toBeNull();
    expect(parseCookieConsentRecord("{not-json")).toBeNull();

    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, wrongVersion);
    expect(readCookieConsentRecord()).toBeNull();
    expect(getCookieConsentPreferences()).toEqual(DEFAULT_COOKIE_CONSENT_PREFERENCES);
  });

  it("keeps essential enabled when callers try to turn it off", () => {
    const record = buildCookieConsentRecord({
      essential: false as true,
      analytics: true,
    });

    expect(record.preferences.essential).toBe(true);

    const listener = vi.fn();
    subscribeToCookieConsent(listener);

    writeCookieConsentRecord({
      ...record,
      preferences: {
        ...record.preferences,
        essential: false as true,
      },
    });

    const stored = readCookieConsentRecord();
    expect(stored?.preferences.essential).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].preferences.essential).toBe(true);
  });
});
