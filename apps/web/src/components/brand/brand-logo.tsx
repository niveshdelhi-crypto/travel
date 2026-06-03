import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  BRAND_LOGO_ALT,
  BRAND_LOGO_HEIGHT,
  BRAND_LOGO_SIZE_CLASSES,
  BRAND_LOGO_SRC,
  BRAND_LOGO_WIDTH,
  BRAND_NAME,
  type BrandLogoSize,
} from "@/lib/brand";

export type { BrandLogoSize };

type BrandLogoProps = {
  href?: Route | string;
  size?: BrandLogoSize;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  href = "/",
  size = "md",
  className = "",
  imageClassName = "",
  priority = false,
}: BrandLogoProps) {
  const image = (
    <Image
      src={BRAND_LOGO_SRC}
      alt={BRAND_LOGO_ALT}
      width={BRAND_LOGO_WIDTH}
      height={BRAND_LOGO_HEIGHT}
      priority={priority}
      sizes={
        size === "nav"
          ? "(max-width: 640px) 304px, 368px"
          : "(max-width: 640px) 320px, 384px"
      }
      className={`block shrink-0 object-contain object-center ${BRAND_LOGO_SIZE_CLASSES[size]} ${imageClassName}`}
    />
  );

  const mark = (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>{image}</span>
  );

  if (!href) {
    return mark;
  }

  return (
    <Link
      href={href as Route}
      className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
      aria-label={`${BRAND_NAME} home`}
    >
      {mark}
    </Link>
  );
}
