export type ServiceArea = {
  slug: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
};

export type CmsLandscapePage = {
  slug: string;
  content?: {
    landscape?: {
      kind?: string;
      data?: Partial<ServiceArea>;
    };
  };
};

const SERVICE_AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "charlotte-nc": { lat: 35.2271, lng: -80.8431 },
  "indian-land-sc": { lat: 35.0018, lng: -80.8565 },
  "indian-trail-nc": { lat: 35.0768, lng: -80.6692 },
  "lancaster-sc": { lat: 34.7204, lng: -80.7709 },
  "marvin-nc": { lat: 34.9918, lng: -80.8148 },
  "matthews-nc": { lat: 35.1168, lng: -80.7237 },
  "mineral-springs-nc": { lat: 34.9371, lng: -80.6681 },
  "monroe-nc": { lat: 34.9854, lng: -80.5495 },
  "waxhaw-nc": { lat: 34.9246, lng: -80.7434 },
  "weddington-nc": { lat: 35.0224, lng: -80.7609 },
  "wesley-chapel-nc": { lat: 35.0071, lng: -80.6745 },
};

export function buildServiceAreas(pages: CmsLandscapePage[]): ServiceArea[] {
  return pages.flatMap((page) => {
    const landscape = page.content?.landscape;
    const area = landscape?.data;
    const fallback = SERVICE_AREA_COORDINATES[page.slug];
    const lat = typeof area?.lat === "number" ? area.lat : fallback?.lat;
    const lng = typeof area?.lng === "number" ? area.lng : fallback?.lng;

    if (
      landscape?.kind !== "location"
      || !area?.city
      || !area.state
      || typeof lat !== "number"
      || typeof lng !== "number"
    ) {
      return [];
    }

    return [{ slug: page.slug, city: area.city, state: area.state, lat, lng }];
  });
}
