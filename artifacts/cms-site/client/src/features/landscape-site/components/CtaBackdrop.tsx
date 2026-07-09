import defaultImage from "@/features/landscape-site/assets/hero-home.webp";

export function CtaBackdrop({ imageUrl }: { imageUrl?: string }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <img
        src={imageUrl || defaultImage}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[hsl(var(--brand-forest)/0.88)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/20" />
    </div>
  );
}
