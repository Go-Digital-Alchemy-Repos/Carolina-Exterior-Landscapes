import { storage } from "../storage/index";
import { logger } from "../utils/logger";

export interface GoogleReview {
  authorName: string;
  authorUrl: string | null;
  profilePhotoUrl: string | null;
  rating: number;
  text: string;
  relativeTimeDescription: string;
  publishTime: string | null;
  source: "Google";
}

export interface GoogleReviewsPayload {
  configured: boolean;
  enabled: boolean;
  placeName: string | null;
  placeUrl: string | null;
  rating: number | null;
  userRatingCount: number | null;
  reviews: GoogleReview[];
  updatedAt: string | null;
}

type GooglePlaceReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string; languageCode?: string };
  originalText?: { text?: string; languageCode?: string };
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  publishTime?: string;
};

type GooglePlaceDetailsResponse = {
  displayName?: { text?: string; languageCode?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GooglePlaceReview[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type CacheEntry = {
  expiresAt: number;
  payload: GoogleReviewsPayload;
};

const DEFAULT_CACHE_MINUTES = 60;
const DEFAULT_LANGUAGE_CODE = "en";
const cache = new Map<string, CacheEntry>();

function numberSetting(value: string | undefined, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function emptyPayload(configured: boolean, enabled: boolean): GoogleReviewsPayload {
  return {
    configured,
    enabled,
    placeName: null,
    placeUrl: null,
    rating: null,
    userRatingCount: null,
    reviews: [],
    updatedAt: null,
  };
}

function normalizeReview(review: GooglePlaceReview): GoogleReview | null {
  const rating = Number(review.rating) || 0;
  const text = review.text?.text || review.originalText?.text || "";
  if (rating !== 5 || !text.trim()) return null;

  return {
    authorName: review.authorAttribution?.displayName || "Google reviewer",
    authorUrl: review.authorAttribution?.uri || null,
    profilePhotoUrl: review.authorAttribution?.photoUri || null,
    rating,
    text: text.trim(),
    relativeTimeDescription: review.relativePublishTimeDescription || "",
    publishTime: review.publishTime || null,
    source: "Google",
  };
}

function cacheKey(placeId: string, languageCode: string) {
  return `${placeId}:${languageCode}`;
}

export function resetGoogleReviewsCache() {
  cache.clear();
}

export async function getGoogleReviews(options: { forceRefresh?: boolean } = {}): Promise<GoogleReviewsPayload> {
  const settings = await storage.settings.getDecryptedCategory("google_reviews");
  const enabled = settings.google_reviews_enabled === "true";
  const placeId = settings.google_reviews_place_id?.trim() || "";
  const apiKey = settings.google_reviews_api_key?.trim() || "";
  const languageCode = settings.google_reviews_language_code?.trim() || DEFAULT_LANGUAGE_CODE;
  const cacheMinutes = numberSetting(settings.google_reviews_cache_minutes, DEFAULT_CACHE_MINUTES, 5, 1440);
  const configured = Boolean(placeId && apiKey);

  if (!enabled || !configured) {
    return emptyPayload(configured, enabled);
  }

  const key = cacheKey(placeId, languageCode);
  const cached = cache.get(key);
  if (!options.forceRefresh && cached && Date.now() < cached.expiresAt) {
    return cached.payload;
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("languageCode", languageCode);
  url.searchParams.set("fields", "displayName,rating,userRatingCount,googleMapsUri,reviews");

  const response = await fetch(url);
  const json = (await response.json()) as GooglePlaceDetailsResponse;

  if (!response.ok || json.error) {
    const message = json.error?.message || response.statusText || "Google Places request failed";
    logger.app.warn("Google reviews request failed", {
      status: response.status,
      googleStatus: json.error?.status,
      message,
    });
    throw new Error(message);
  }

  const payload: GoogleReviewsPayload = {
    configured,
    enabled,
    placeName: json.displayName?.text || null,
    placeUrl: json.googleMapsUri || null,
    rating: typeof json.rating === "number" ? json.rating : null,
    userRatingCount: typeof json.userRatingCount === "number" ? json.userRatingCount : null,
    reviews: (json.reviews || []).map(normalizeReview).filter((review): review is GoogleReview => Boolean(review)),
    updatedAt: new Date().toISOString(),
  };

  cache.set(key, {
    payload,
    expiresAt: Date.now() + cacheMinutes * 60_000,
  });

  return payload;
}
