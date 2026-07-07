import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SERVICE_AREAS } from "@/features/landscape-site/content/site";

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

// Bounds covering the full service territory (Charlotte down to Lancaster, SC).
const BOUNDS: [[number, number], [number, number]] = [
  [34.68, -80.92],
  [35.28, -80.5],
];

export function ServiceAreaMap() {
  const [, navigate] = useLocation();

  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <MapContainer
        bounds={BOUNDS}
        scrollWheelZoom={false}
        className="h-[500px] w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {SERVICE_AREAS.map((area) => (
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
