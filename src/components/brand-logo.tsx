import { Link } from "@tanstack/react-router";
import { PLATFORM_NAME } from "@/constants";

export const BRAND_LOGO_SRC = "/brand/markle.png?v=3";
export const BRAND_LOGO_ALT = "Markle Travel Booking";
export const BRAND_LOGO_WIDTH = 1536;
export const BRAND_LOGO_HEIGHT = 1024;

export type BrandLogoSize = "nav" | "sm" | "md" | "lg" | "xl";

/** 1536×1024 — height-first; width follows 3:2 aspect ratio. */
const sizeClasses: Record<BrandLogoSize, string> = {
  nav: "aspect-[3/2] h-14 w-auto max-w-none sm:h-16 lg:h-[4.75rem]",
  sm: "aspect-[3/2] h-10 w-auto max-w-none sm:h-11",
  md: "aspect-[3/2] h-11 w-auto max-w-none sm:h-12",
  lg: "aspect-[3/2] h-12 w-auto max-w-none sm:h-14",
  xl: "aspect-[3/2] h-14 w-auto max-w-none sm:h-16 md:h-[5.5rem]",
};

export const BRAND_NAVBAR_HEIGHT_CLASS = "h-20 min-h-20";

type BrandLogoProps = {
  to?: string;
  size?: BrandLogoSize;
  className?: string;
  imageClassName?: string;
};

export function BrandLogo({
  to = "/",
  size = "md",
  className = "",
  imageClassName = "",
}: BrandLogoProps) {
  const img = (
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_LOGO_ALT}
      width={BRAND_LOGO_WIDTH}
      height={BRAND_LOGO_HEIGHT}
      decoding="async"
      loading="lazy"
      className={`block shrink-0 object-contain object-left ${sizeClasses[size]} ${imageClassName}`}
    />
  );

  const mark = (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>{img}</span>
  );

  if (!to) {
    return mark;
  }

  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-label={`${PLATFORM_NAME} home`}
    >
      {mark}
    </Link>
  );
}
