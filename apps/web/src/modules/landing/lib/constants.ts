/**
 * Landing hero “Call us” number (E.164, e.g. +971501234567).
 * Env `NEXT_PUBLIC_DIRECT_CALL_PHONE` overrides this when set.
 */
export const DIRECT_CALL_PHONE_NUMBER = "";

export const SUPPLIERS = ["Hertz", "Avis", "Enterprise", "Budget", "Alamo", "National"] as const;

export const TRUST_STATS = [
  { value: "800+", label: "Trusted suppliers" },
  { value: "30,000+", label: "Pickup locations" },
  { value: "190+", label: "Countries covered" },
  { value: "24/7", label: "Worldwide support" },
  { value: "100%", label: "Secure booking" },
] as const;

export const RESIDENCY_OPTIONS = [
  { value: "AE", label: "United Arab Emirates" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "ES", label: "Spain" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IN", label: "India" },
  { value: "TR", label: "Türkiye" },
] as const;

export const DRIVER_AGE_OPTIONS = [
  { value: "18-24", label: "18–24" },
  { value: "25-29", label: "25–29" },
  { value: "30-65", label: "30–65" },
  { value: "66+", label: "66+" },
] as const;
