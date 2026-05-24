import { Link } from "@tanstack/react-router";
import { PLATFORM_NAME } from "@/constants";

export const BRAND_LOGO_SRC = "/brand/bookmycarz-logo.png";
export const BRAND_LOGO_ALT = "BookmyCarz.com — Rent. Drive. Explore.";

export type BrandLogoSize = "nav" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<BrandLogoSize, string> = {
  nav: "h-11 w-auto sm:h-12",
  sm: "h-9 w-auto sm:h-10",
  md: "h-10 w-auto sm:h-11",
  lg: "h-11 w-auto sm:h-12 md:h-[3.25rem]",
  xl: "h-12 w-auto sm:h-14 md:h-16",
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
      width={452}
      height={175}
      decoding="async"
      loading="lazy"
      className={`block h-auto w-auto max-w-none object-contain object-left ${sizeClasses[size]} ${className}`}
    />
  );

  if (!to) {
    return <span className="inline-flex shrink-0 items-center">{img}</span>;
  }

  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-label={`${PLATFORM_NAME} home`}
    >
      {img}
    </Link>
  );
}
