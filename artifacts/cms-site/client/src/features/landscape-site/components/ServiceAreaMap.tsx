import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  buildServiceAreas,
  type CmsLandscapePage,
  type ServiceArea,
} from "../lib/service-area-locations";

async function fetchServiceAreas(): Promise<ServiceArea[]> {
  const response = await fetch("/api/cms/landscape/pages", { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load CMS service areas");
  const pages = await response.json() as CmsLandscapePage[];
  return buildServiceAreas(pages);
}

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.716 0 1 6.716 1 15c0 10.5 15 27 15 27s15-16.5 15-27C31 6.716 24.284 0 16 0z" fill="#113B28" stroke="#F5F5F5" stroke-width="1.5"/>
    <circle cx="16" cy="15" r="5.5" fill="#5A7F3A"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  tooltipAnchor: [0, -38],
});

export function ServiceAreaMap({ height = 500 }: { height?: number }) {
  const [, navigate] = useLocation();
  const { data: serviceAreas = [] } = useQuery({
    queryKey: ["/api/cms/landscape/pages", "service-area-map"],
    queryFn: fetchServiceAreas,
    staleTime: 60_000,
  });
  const mapHeight = Math.max(320, Math.min(720, Math.round(height)));
  if (serviceAreas.length === 0) return null;
  const bounds = L.latLngBounds(serviceAreas.map((area) => [area.lat, area.lng] as [number, number]));

  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        className="w-full z-0"
        style={{ height: mapHeight }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {serviceAreas.map((area) => (
          <Marker
            key={area.slug}
            position={[area.lat, area.lng]}
            icon={pinIcon}
            eventHandlers={{
              click: () => navigate(`/service-areas/${area.slug}`),
            }}
          >
            <Tooltip direction="top" opacity={1}>
              <span className="font-bold">
                {area.city}, {area.state}
              </span>
              <span className="block text-xs text-muted-foreground">
                View local services
              </span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
