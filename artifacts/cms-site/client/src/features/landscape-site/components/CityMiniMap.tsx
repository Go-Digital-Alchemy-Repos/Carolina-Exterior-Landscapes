import { MapPin } from "lucide-react";

interface CityMiniMapProps {
  lat: number;
  lng: number;
  city: string;
  state: string;
}

function pinPosition(lat: number, lng: number) {
  const latRange = { min: 34.68, max: 35.28 };
  const lngRange = { min: -80.92, max: -80.5 };
  const x = ((lng - lngRange.min) / (lngRange.max - lngRange.min)) * 100;
  const y = (1 - (lat - latRange.min) / (latRange.max - latRange.min)) * 100;

  return {
    left: `${Math.min(72, Math.max(28, x))}%`,
    top: `${Math.min(66, Math.max(28, y))}%`,
  };
}

export function CityMiniMap({ lat, lng, city, state }: CityMiniMapProps) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-[#23382f] shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_20%,rgba(255,255,255,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="absolute -left-10 top-8 h-40 w-40 rounded-full border border-white/10" />
      <div className="absolute -right-12 bottom-4 h-48 w-48 rounded-full border border-white/10" />

      <svg className="absolute inset-0 h-full w-full text-white/20" viewBox="0 0 400 300" aria-hidden="true">
        <path d="M40 210 C110 180 145 195 205 150 C260 108 305 118 360 80" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 86 C138 122 172 112 222 146 C274 182 318 174 352 218" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="8 10" />
        <path d="M98 242 C142 214 178 220 218 196 C256 174 286 170 328 150" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <div
        className="absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center"
        style={pinPosition(lat, lng)}
        aria-hidden="true"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-lg ring-4 ring-white/20">
          <MapPin className="h-5 w-5" />
        </span>
        <span className="mt-2 h-2 w-8 rounded-full bg-black/20 blur-[2px]" />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pt-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Local service area</p>
        <p className="mt-1 text-xl font-extrabold tracking-tight text-white">
          {city}, {state}
        </p>
      </div>
    </div>
  );
}
