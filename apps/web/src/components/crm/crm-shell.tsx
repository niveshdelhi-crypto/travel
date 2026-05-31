"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Phone,
  ShieldCheck,
  Users2,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

type CrmRoute =
  | "/dashboard"
  | "/leads"
  | "/sales"
  | "/admin"
  | "/calls"
  | "/bookings"
  | "/payments"
  | "/team"
  | "/admin-ops";

const NAV_ITEMS: Array<{
  href: CrmRoute;
  label: string;
  roles: Array<"admin" | "sales_agent">;
  icon?: typeof LayoutDashboard;
}> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["admin", "sales_agent"],
    icon: LayoutDashboard,
  },
  { href: "/leads", label: "Pipeline", roles: ["admin", "sales_agent"], icon: Users2 },
  { href: "/sales", label: "My desk", roles: ["admin", "sales_agent"] },
  { href: "/admin", label: "Admin desk", roles: ["admin"] },
  { href: "/calls", label: "Calls", roles: ["admin", "sales_agent"], icon: Phone },
  { href: "/bookings", label: "Bookings", roles: ["admin", "sales_agent"], icon: CalendarCheck },
  { href: "/payments", label: "Payments", roles: ["admin", "sales_agent"], icon: CircleDollarSign },
  { href: "/team", label: "Team", roles: ["admin", "sales_agent"], icon: UsersRound },
  { href: "/admin-ops", label: "Admin ops", roles: ["admin"], icon: ShieldCheck },
];

export function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.some((role) => hasRole([role])));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2 font-semibold text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-sm">
                FN
              </span>
              <span className="hidden sm:inline">Book my Carz CRM</span>
            </Link>
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-thin">
              {visibleNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    className={`shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium transition md:px-3 ${
                      active
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    {item.icon ? (
                      <span className="inline-flex items-center gap-1.5">
                        <item.icon className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">{item.label}</span>
                        <span className="lg:hidden">{item.label.split(" ")[0]}</span>
                      </span>
                    ) : (
                      item.label
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          {user ? (
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-sm text-slate-400 md:inline">
                {user.name} · {user.role.replace("_", " ")}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}
