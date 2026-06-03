import { Link } from "@tanstack/react-router";

export const BRAND_NAME = "MarkleTravelBooking";
export const BRAND_LOGO_SRC = "/brand/travel.png";
export const BRAND_LOGO_ALT = "MarkleTravelBooking — Explore. Book. Discover.";
export const BRAND_LOGO_WIDTH = 677;
export const BRAND_LOGO_HEIGHT = 369;

export type BrandLogoSize = "nav" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<BrandLogoSize, string> = {
  nav: "h-16 w-auto max-w-[19rem] sm:h-[4.75rem] sm:max-w-[23rem] lg:h-20 lg:max-w-[26rem]",
  sm: "h-12 w-auto max-w-[14rem] sm:h-14 sm:max-w-[16rem]",
  md: "h-14 w-auto max-w-[16rem] sm:h-16 sm:max-w-[18rem]",
  lg: "h-[4.25rem] w-auto max-w-[20rem] sm:h-20 sm:max-w-[22rem]",
  xl: "h-20 w-auto max-w-[22rem] sm:h-24 sm:max-w-[26rem]",
};

type BrandLogoProps = {
  to?: string;
  size?: BrandLogoSize;
  className?: string;
};

export function BrandLogo({ to = "/", size = "md", className = "" }: BrandLogoProps) {
  const img = (
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_LOGO_ALT}
      width={BRAND_LOGO_WIDTH}
      height={BRAND_LOGO_HEIGHT}
      decoding="async"
      loading="lazy"
      className={`block shrink-0 object-contain object-center ${sizeClasses[size]}`}
    />
  );

  const mark = <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>{img}</span>;

  if (!to) return mark;

  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90"
      aria-label={`${BRAND_NAME} home`}
    >
      {mark}
    </Link>
  );
}
