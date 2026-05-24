import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Menu,
  Phone,
  Settings,
  ShieldCheck,
  Users2,
  UsersRound,
  X,
  Building2,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { useAuthStore } from "@/store/auth.store";

type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles?: Array<"admin" | "sales_agent">;
};

const primaryNav: NavItem[] = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboard },
  { label: "My workspace", to: "/app/workspace", icon: Users2, roles: ["sales_agent"] },
  { label: "Leads", to: "/app/leads", icon: Users2, roles: ["admin"] },
  { label: "Calls", to: "/app/calls", icon: Phone },
];

const drawerSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Workspace",
    items: [
      { label: "Bookings", to: "/app/bookings", icon: CalendarCheck, roles: ["admin"] },
      { label: "Providers", to: "/app/providers", icon: Building2, roles: ["admin"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", to: "/app/analytics", icon: BarChart3, roles: ["admin"] },
      { label: "Payments", to: "/app/payments", icon: CreditCard, roles: ["admin"] },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", to: "/app/notifications", icon: Bell },
      { label: "Team", to: "/app/team", icon: UsersRound },
      { label: "Admin Ops", to: "/app/admin", icon: ShieldCheck, roles: ["admin"] },
      { label: "Settings", to: "/app/settings", icon: Settings },
    ],
  },
];

function canSee(item: NavItem, role: "admin" | "sales_agent" | undefined) {
  if (!item.roles) return true;
  if (!role) return false;
  return item.roles.includes(role);
}

function isActive(path: string, to: string) {
  return path === to || (to !== "/app" && path.startsWith(to));
}

export function MobileAppNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const role = useAuthStore((s) => s.user?.role);

  const visiblePrimary = primaryNav.filter((item) => canSee(item, role));

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
        aria-label="Primary navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          {visiblePrimary.map((item) => {
            const active = isActive(path, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} />
                <span className="max-w-full truncate">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium text-muted-foreground"
            aria-expanded={menuOpen}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(100%,320px)] flex-col border-l border-border bg-sidebar shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <Brand to="/app" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
              {drawerSections.map((section) => {
                const items = section.items.filter((item) => canSee(item, role));
                if (!items.length) return null;
                return (
                  <div key={section.label} className="mb-4">
                    <p className="px-2 pb-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {section.label}
                    </p>
                    <ul className="space-y-0.5">
                      {items.map((item) => {
                        const active = isActive(path, item.to);
                        return (
                          <li key={item.to}>
                            <Link
                              to={item.to}
                              className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium ${
                                active
                                  ? "bg-sidebar-accent text-foreground"
                                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                              }`}
                            >
                              <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
