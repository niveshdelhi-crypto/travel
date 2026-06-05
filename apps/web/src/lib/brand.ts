/** Public-facing product name (marketing + CRM chrome). */
export const BRAND_NAME = "MarkleTravelBooking";

/** Bump when replacing public/brand/markle.png to bust CDN/browser caches. */
export const BRAND_LOGO_VERSION = "3";

export const BRAND_LOGO_SRC = `/brand/markle.png?v=${BRAND_LOGO_VERSION}`;
export const BRAND_LOGO_ALT = "Markle Travel Booking";

/** Intrinsic asset dimensions (1536×1024). */
export const BRAND_LOGO_WIDTH = 1536;
export const BRAND_LOGO_HEIGHT = 1024;
export const BRAND_LOGO_ASPECT_RATIO = BRAND_LOGO_WIDTH / BRAND_LOGO_HEIGHT;

/** Locks rendered width to the PNG’s 3:2 landscape ratio. */
export const BRAND_LOGO_ASPECT_CLASS = "aspect-[3/2]";

/**
 * Height-first logo sizes — width follows 3:2 from the asset.
 * nav ≈ 48–64px tall · xl ≈ 64–88px tall (footer / hero chrome).
 */
export const BRAND_LOGO_SIZE_CLASSES = {
  nav: `${BRAND_LOGO_ASPECT_CLASS} h-14 w-auto max-w-none sm:h-16 lg:h-[4.75rem]`,
  sm: `${BRAND_LOGO_ASPECT_CLASS} h-10 w-auto max-w-none sm:h-11`,
  md: `${BRAND_LOGO_ASPECT_CLASS} h-11 w-auto max-w-none sm:h-12`,
  lg: `${BRAND_LOGO_ASPECT_CLASS} h-12 w-auto max-w-none sm:h-14`,
  xl: `${BRAND_LOGO_ASPECT_CLASS} h-14 w-auto max-w-none sm:h-16 md:h-[5.5rem]`,
} as const;

/** Responsive `sizes` hints for next/image (width ≈ height × 1.5). */
export const BRAND_LOGO_IMAGE_SIZES: Record<keyof typeof BRAND_LOGO_SIZE_CLASSES, string> = {
  nav: "(max-width: 640px) 84px, (max-width: 1024px) 96px, 114px",
  sm: "(max-width: 640px) 60px, 66px",
  md: "(max-width: 640px) 66px, 72px",
  lg: "(max-width: 640px) 72px, 84px",
  xl: "(max-width: 640px) 84px, (max-width: 1024px) 96px, 132px",
};

/** Header bar height that fits the `nav` logo with vertical breathing room. */
export const BRAND_NAVBAR_HEIGHT_CLASS = "h-20 min-h-20";

export type BrandLogoSize = keyof typeof BRAND_LOGO_SIZE_CLASSES;
