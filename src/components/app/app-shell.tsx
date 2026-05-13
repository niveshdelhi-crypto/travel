import { Link, useRouterState } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Brand } from "@/components/brand";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notifications.store";
import { useCallStore } from "@/store/call.store";
import { authService } from "@/services";
import { disconnectSocket } from "@/services/socket";
import { StatusDot } from "@/components/app/primitives";
import {
  LayoutDashboard,
  Users2,
  Phone,
  CalendarCheck,
  Building2,
  BarChart3,
  CreditCard,
  Bell,
  UsersRound,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Command,
  CircleDot,
  ChevronDown,
  Activity,
  ShieldCheck,
  PhoneCall,
  X,
  LogOut,
} from "lucide-react";

const navSections = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard",  to: "/app",               icon: LayoutDashboard },
      { label: "Leads",      to: "/app/leads",         icon: Users2,       badge: "24" },
      { label: "Calls",      to: "/app/calls",         icon: Phone,        live: true },
      { label: "Bookings",   to: "/app/bookings",      icon: CalendarCheck },
      { label: "Providers",  to: "/app/providers",     icon: Building2 },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics",  to: "/app/analytics",    icon: BarChart3 },
      { label: "Payments",   to: "/app/payments",     icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", to: "/app/notifications", icon: Bell,       badge: "3" },
      { label: "Team",          to: "/app/team",           icon: UsersRound },
      { label: "Admin Ops",     to: "/app/admin",          icon: ShieldCheck },
    ],
  },
];

const AGENT_STATUS_OPTIONS = [
  { key: "available", label: "Available",  dot: "bg-success" },
  { key: "break",     label: "Break",      dot: "bg-muted-foreground" },
  { key: "offline",   label: "Offline",    dot: "bg-destructive" },
] as const;

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("fn_sidebar_collapsed") === "true"; }
    catch { return false; }
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const path      = useRouterState({ select: (s) => s.location.pathname });
  const user      = useAuthStore((s) => s.user);
  const signOutStore = useAuthStore((s) => s.signOut);
  const unread    = useNotificationStore((s) => s.unreadCount);
  const activeCall = useCallStore((s) => s.activeCall);
  const logoutMutation = useMutation({
    mutationFn: authService.signOut,
    onSettled: async () => {
      signOutStore();
      disconnectSocket();
      queryClient.clear();
      await navigate({ to: "/login", replace: true });
    },
  });

  useEffect(() => {
    try { localStorage.setItem("fn_sidebar_collapsed", String(collapsed)); }
    catch { /* noop */ }
  }, [collapsed]);

  // Keyboard shortcut ⌘K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ── */}
      <aside
        className={`${
          collapsed ? "w-[68px]" : "w-[248px]"
        } sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-200 md:flex`}
      >
        {/* Logo row */}
        <div
          className={`flex h-16 items-center border-b border-border ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-warning text-primary-foreground"
              aria-label="Expand sidebar"
            >
              <CircleDot className="h-4 w-4" />
            </button>
          ) : (
            <Brand to="/app" />
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Active call banner */}
        {activeCall && !collapsed && (
          <div className="mx-2 mt-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <PhoneCall className="h-3 w-3 animate-pulse text-success" />
              <span className="flex-1 truncate font-medium text-success">
                {activeCall.customerName}
              </span>
              <span className="font-mono text-success">Live</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.label} className="mb-1">
              {!collapsed && (
                <div className="px-2.5 pb-1.5 pt-4 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items
                  .filter((n) => n.to !== "/app/admin" || user?.role === "admin")
                  .map((n) => {
                  const active =
                    path === n.to || (n.to !== "/app" && path.startsWith(n.to));
                  return (
                    <li key={n.label}>
                      <Link
                        to={n.to}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? n.label : undefined}
                        className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-sidebar-accent text-foreground shadow-[inset_2px_0_0_oklch(0.86_0.17_92)]"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                        }`}
                      >
                        <n.icon
                          className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{n.label}</span>
                            {"badge" in n && n.badge && (
                              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                                {n.badge}
                              </span>
                            )}
                            {"live" in n && n.live && (
                              <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom — settings + avatar */}
        <div className="border-t border-border p-2">
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="grid h-9 w-full place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/app/settings"
              className="flex items-center gap-2.5 rounded-md p-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h1>
          <span className="hidden text-xs text-muted-foreground md:inline">/ Operations</span>

          <div className="ml-auto flex items-center gap-2">
            {/* Global search */}
            <div className="relative hidden md:block">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="global-search"
                placeholder="Search leads, bookings, agents…"
                aria-label="Global search"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`h-9 w-72 rounded-md border bg-surface pl-8 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                  searchFocused ? "border-border-strong" : "border-border"
                }`}
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>

            {/* System status */}
            <span className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
              All systems
            </span>

            {/* Notifications bell */}
            <Link
              to="/app/notifications"
              className="relative grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground"
              aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            {/* Agent status selector */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
                aria-haspopup="listbox"
                aria-expanded={statusOpen}
              >
                <StatusDot status={user?.status ?? "available"} pulse />
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground capitalize">{(user?.status ?? "available").replace("_", " ")}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {statusOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-40 rounded-lg border border-border bg-surface shadow-2xl shadow-black/40">
                  {AGENT_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setStatusOpen(false)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-surface-2 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User avatar */}
            <button className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 hover:bg-surface-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-secondary to-info text-xs font-semibold text-foreground">
                {user?.initials ?? "??"}
              </span>
              <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
            </button>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
