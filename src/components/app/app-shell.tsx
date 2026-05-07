import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Brand } from "@/components/brand";
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
} from "lucide-react";

const nav = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboard },
  { label: "Leads", to: "/app/leads", icon: Users2, badge: "24" },
  { label: "Calls", to: "/app/calls", icon: Phone, dot: true },
  { label: "Bookings", to: "/app/bookings", icon: CalendarCheck },
  { label: "Providers", to: "/app/providers", icon: Building2 },
  { label: "Analytics", to: "/app/analytics", icon: BarChart3 },
  { label: "Payments", to: "/app/payments", icon: CreditCard },
  { label: "Notifications", to: "/app/notifications", icon: Bell, badge: "3" },
  { label: "Team", to: "/app/team", icon: UsersRound },
  { label: "Admin Live Ops", to: "/app/admin", icon: ShieldCheck },
];

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`${
          collapsed ? "w-[68px]" : "w-[248px]"
        } sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-200 md:flex`}
      >
        <div className={`flex h-16 items-center border-b border-border ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          {collapsed ? (
            <Link to="/app" className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-warning text-primary-foreground">
              <CircleDot className="h-4 w-4" />
            </Link>
          ) : (
            <Brand to="/app" />
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground ${collapsed ? "hidden" : ""}`}
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {!collapsed && (
            <div className="px-2.5 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Workspace
            </div>
          )}
          <ul className="space-y-0.5">
            {nav.map((n) => {
              const active = path === n.to || (n.to !== "/app" && path.startsWith(n.to));
              return (
                <li key={n.label}>
                  <Link
                    to={n.to}
                    className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-sidebar-accent text-foreground shadow-[inset_2px_0_0_oklch(0.86_0.17_92)]"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    }`}
                  >
                    <n.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{n.label}</span>
                        {n.badge && (
                          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                            {n.badge}
                          </span>
                        )}
                        {n.dot && <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-2">
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="grid h-9 w-full place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          ) : (
            <Link to="/app/settings" className="flex items-center gap-2.5 rounded-md p-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
              <Settings className="h-4 w-4" /> Settings
            </Link>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h1>
          <span className="hidden text-xs text-muted-foreground md:inline">/ Operations</span>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search leads, bookings, agents…"
                className="h-9 w-72 rounded-md border border-border bg-surface pl-8 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Command className="h-3 w-3" /> K
              </kbd>
            </div>

            <span className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
              All systems
            </span>

            <button className="relative grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>

            <button className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-xs md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground">Available</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            <button className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 hover:bg-surface-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-secondary to-info text-xs font-semibold text-foreground">
                AK
              </span>
              <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
