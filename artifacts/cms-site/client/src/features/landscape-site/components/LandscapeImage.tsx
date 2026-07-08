import type { ImgHTMLAttributes } from "react";

const STATIC_IMAGE_VERSION = "20260708-image-pass";
const LANDSCAPE_STATIC_IMAGE_PREFIX = "/images/landscape/";

function addVersion(src: string) {
  if (!src.startsWith(LANDSCAPE_STATIC_IMAGE_PREFIX)) return src;
  const [withoutHash, hash] = src.split("#", 2);
  const separator = withoutHash.includes("?") ? "&" : "?";
  return `${withoutHash}${separator}v=${STATIC_IMAGE_VERSION}${hash ? `#${hash}` : ""}`;
}

function getLandscapeVariantSources(src: string) {
  if (!src.startsWith(LANDSCAPE_STATIC_IMAGE_PREFIX)) return null;
  const cleanSrc = src.split(/[?#]/, 1)[0] ?? src;
  const extension = cleanSrc.match(/\.(png|jpe?g)$/i)?.[0];
  if (!extension) return null;

  const base = src.slice(0, src.length - extension.length);
  return {
    avif: addVersion(`${base}.avif`),
    webp: addVersion(`${base}.webp`),
    fallback: addVersion(src),
  };
}

export function LandscapeImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const stringSrc = typeof src === "string" ? src : undefined;
  const variants = stringSrc ? getLandscapeVariantSources(stringSrc) : null;

  if (!stringSrc || !variants) {
    return <img src={src} alt={alt} {...props} />;
  }

  return (
    <picture>
      <source srcSet={variants.avif} type="image/avif" />
      <source srcSet={variants.webp} type="image/webp" />
      <img src={variants.fallback} alt={alt} {...props} />
    </picture>
  );
}
