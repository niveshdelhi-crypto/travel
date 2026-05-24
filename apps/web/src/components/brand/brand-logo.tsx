import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { BRAND_LOGO_ALT, BRAND_LOGO_SRC } from "@/lib/brand";

/** Trimmed wide logo asset (452×175). */
const LOGO_WIDTH = 452;
const LOGO_HEIGHT = 175;

export type BrandLogoSize = "nav" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<BrandLogoSize, string> = {
  /** Max height that fits a standard h-16 navbar (bar stays 64px). */
  nav: "h-11 w-auto sm:h-12",
  sm: "h-9 w-auto sm:h-10",
  md: "h-10 w-auto sm:h-11",
  lg: "h-11 w-auto sm:h-12 md:h-[3.25rem]",
  xl: "h-12 w-auto sm:h-14 md:h-16",
};

type BrandLogoProps = {
  href?: Route | string;
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  href = "/",
  size = "md",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const image = (
    <Image
      src={BRAND_LOGO_SRC}
      alt={BRAND_LOGO_ALT}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      sizes={size === "nav" ? "(max-width: 640px) 200px, 260px" : "(max-width: 640px) 240px, 360px"}
      className={`block h-auto w-auto max-w-none object-contain object-left ${sizeClasses[size]} ${className}`}
    />
  );

  if (!href) {
    return <span className="inline-flex shrink-0 items-center">{image}</span>;
  }

  return (
    <Link
      href={href as Route}
      className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
      aria-label={`${BRAND_LOGO_ALT} home`}
    >
      {image}
    </Link>
  );
}
