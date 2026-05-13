// ============================================================
// FleetNexus — Platform Constants
// ============================================================

export const PLATFORM_NAME = "FleetNexus";
export const PLATFORM_TAGLINE = "Car Rental Marketplace & Assisted Booking CRM";
export const PLATFORM_DOMAIN = "app.fleetnexus.io";
export const SUPPORT_MARKETS = ["USA", "Canada"];
export const CITY_COUNT = 142;
export const PROVIDER_COUNT = 42;
export const VEHICLE_COUNT = 18420;

// ─── Lead Pipeline ────────────────────────────────────────────
export const LEAD_STAGES = [
  { key: "new",         label: "New",         color: "bg-muted-foreground", textColor: "text-muted-foreground" },
  { key: "assigned",    label: "Assigned",    color: "bg-info",             textColor: "text-info" },
  { key: "contacted",   label: "Contacted",   color: "bg-secondary",        textColor: "text-secondary" },
  { key: "negotiating", label: "Negotiating", color: "bg-warning",          textColor: "text-warning" },
  { key: "confirmed",   label: "Confirmed",   color: "bg-success",          textColor: "text-success" },
  { key: "completed",   label: "Completed",   color: "bg-primary",          textColor: "text-primary" },
] as const;

// ─── Agent Status Colors ──────────────────────────────────────
export const AGENT_STATUS_CONFIG = {
  available: { label: "Available",  tone: "success"  as const, dot: "bg-success" },
  on_call:   { label: "On call",    tone: "info"     as const, dot: "bg-info" },
  wrap_up:   { label: "Wrap-up",    tone: "warning"  as const, dot: "bg-warning" },
  break:     { label: "Break",      tone: "neutral"  as const, dot: "bg-muted-foreground" },
  offline:   { label: "Offline",    tone: "danger"   as const, dot: "bg-destructive" },
} as const;

// ─── Booking Status Config ────────────────────────────────────
export const BOOKING_STATUS_CONFIG = {
  pending:   { label: "Pending",   tone: "warning" as const },
  confirmed: { label: "Confirmed", tone: "success" as const },
  active:    { label: "Active",    tone: "info"    as const },
  completed: { label: "Completed", tone: "primary" as const },
  cancelled: { label: "Cancelled", tone: "danger"  as const },
  refunded:  { label: "Refunded",  tone: "neutral" as const },
} as const;

// ─── Transaction Status Config ────────────────────────────────
export const TRANSACTION_STATUS_CONFIG = {
  succeeded: { label: "Succeeded", tone: "success" as const },
  pending:   { label: "Pending",   tone: "warning" as const },
  refunded:  { label: "Refunded",  tone: "danger"  as const },
  failed:    { label: "Failed",    tone: "danger"  as const },
} as const;

// ─── Navigation ───────────────────────────────────────────────
export const APP_NAV_ITEMS = [
  { label: "Dashboard",    path: "/app",               section: "workspace" },
  { label: "Leads",        path: "/app/leads",         section: "workspace" },
  { label: "Calls",        path: "/app/calls",         section: "workspace" },
  { label: "Bookings",     path: "/app/bookings",      section: "workspace" },
  { label: "Providers",    path: "/app/providers",     section: "workspace" },
  { label: "Analytics",    path: "/app/analytics",     section: "insights" },
  { label: "Payments",     path: "/app/payments",      section: "insights" },
  { label: "Notifications",path: "/app/notifications", section: "account" },
  { label: "Team",         path: "/app/team",          section: "account" },
  { label: "Admin",        path: "/app/admin",         section: "account" },
  { label: "Settings",     path: "/app/settings",      section: "account" },
] as const;

// ─── Provider Tiers ───────────────────────────────────────────
export const PROVIDER_TIER_COLORS = {
  "A+": "bg-success/10 text-success border-success/20",
  "A":  "bg-success/10 text-success border-success/20",
  "A-": "bg-info/10 text-info border-info/20",
  "B+": "bg-warning/10 text-warning border-warning/20",
  "B":  "bg-warning/10 text-warning border-warning/20",
  "B-": "bg-destructive/10 text-destructive border-destructive/20",
  "C":  "bg-destructive/10 text-destructive border-destructive/20",
} as const;

// ─── API ──────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const API_TIMEOUT_MS = 15_000;
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY_MS = 1_000;

// ─── Socket ───────────────────────────────────────────────────
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000/leads";
export const SOCKET_RECONNECT_ATTEMPTS = 5;

// ─── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// ─── Query Keys ───────────────────────────────────────────────
export const QUERY_KEYS = {
  leads:         ["leads"]        as const,
  lead:          (id: string) => ["leads", id] as const,
  bookings:      ["bookings"]     as const,
  booking:       (id: string) => ["bookings", id] as const,
  calls:         ["calls"]        as const,
  providers:     ["providers"]    as const,
  provider:      (id: string) => ["providers", id] as const,
  transactions:  ["transactions"] as const,
  analytics:     ["analytics"]    as const,
  team:          ["team"]         as const,
  notifications: ["notifications"]as const,
  vehicles:      ["vehicles"]     as const,
} as const;

// ─── Local Storage Keys ───────────────────────────────────────
export const STORAGE_KEYS = {
  AUTH_TOKEN:     "fn_access_token",
  REFRESH_TOKEN:  "fn_refresh_token",
  USER:           "fn_user",
  SIDEBAR_STATE:  "fn_sidebar_collapsed",
  THEME:          "fn_theme",
} as const;
