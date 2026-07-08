import locationsData from "./locations.json";
import type { LocationContent } from "./base";

const locations = locationsData as LocationContent[];

export function getLocations(): LocationContent[] {
  return locations;
}

export function getLocation(slug: string): LocationContent | undefined {
  return locations.find((location) => location.slug === slug);
}

export { locations };
