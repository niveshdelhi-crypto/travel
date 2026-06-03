/** Public-facing product name (marketing + CRM chrome). */
export const BRAND_NAME = "MarkleTravelBooking";

export const BRAND_LOGO_SRC = "/brand/travel.png";
export const BRAND_LOGO_ALT = "MarkleTravelBooking — Explore. Book. Discover.";
/** Intrinsic asset dimensions (677×369) — wide wordmark. */
export const BRAND_LOGO_WIDTH = 677;
export const BRAND_LOGO_HEIGHT = 369;

/** Height-first sizing; max-width tracks ~1.83:1 aspect ratio. */
export const BRAND_LOGO_SIZE_CLASSES = {
  nav: "h-16 w-auto max-w-[19rem] sm:h-[4.75rem] sm:max-w-[23rem] lg:h-20 lg:max-w-[26rem]",
  sm: "h-12 w-auto max-w-[14rem] sm:h-14 sm:max-w-[16rem]",
  md: "h-14 w-auto max-w-[16rem] sm:h-16 sm:max-w-[18rem]",
  lg: "h-[4.25rem] w-auto max-w-[20rem] sm:h-20 sm:max-w-[22rem]",
  xl: "h-20 w-auto max-w-[22rem] sm:h-24 sm:max-w-[26rem]",
} as const;

export type BrandLogoSize = keyof typeof BRAND_LOGO_SIZE_CLASSES;
