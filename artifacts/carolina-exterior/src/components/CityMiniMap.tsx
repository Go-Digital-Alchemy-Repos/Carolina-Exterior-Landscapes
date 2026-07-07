import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.716 0 1 6.716 1 15c0 10.5 15 27 15 27s15-16.5 15-27C31 6.716 24.284 0 16 0z" fill="#113B28" stroke="#F5F5F5" stroke-width="1.5"/>
    <circle cx="16" cy="15" r="5.5" fill="#5A7F3A"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

interface CityMiniMapProps {
  lat: number;
  lng: number;
  city: string;
  state: string;
}

export function CityMiniMap({ lat, lng, city, state }: CityMiniMapProps) {
  return (
    <div className="rounded-3xl overflow-hidden border border-border shadow-sm relative aspect-[4/3]">
      <MapContainer
        center={[lat, lng]}
        zoom={12}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pinIcon} />
      </MapContainer>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-foreground/70 to-transparent pointer-events-none z-[400]"></div>
      <span className="absolute bottom-5 left-6 text-white font-extrabold text-lg z-[401] pointer-events-none">
        {city}, {state}
      </span>
    </div>
  );
}
