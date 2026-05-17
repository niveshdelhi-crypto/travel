import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

const sections = [
  { to: "/legal/terms", label: "Terms & Conditions" },
  { to: "/legal/privacy", label: "Privacy Policy" },
  { to: "/legal/cookies", label: "Cookie Policy" },
  { to: "/legal/refunds", label: "Refund Policy" },
  { to: "/legal/rental-conditions", label: "Rental Conditions" },
];

export const Route = createFileRoute("/legal")({
  component: LegalLayout,
});

function LegalLayout() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container-page py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside>
            <div className="sticky top-20 rounded-2xl border border-border bg-white p-4 shadow-card">
              <h3 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</h3>
              <nav className="flex flex-col">
                {sections.map((s) => {
                  const active = loc.pathname === s.to;
                  return (
                    <Link
                      key={s.to}
                      to={s.to as string}
                      className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                        active ? "bg-accent/10 text-accent font-semibold" : "text-foreground/80 hover:bg-muted"
                      }`}
                    >
                      {s.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          <article className="prose prose-slate max-w-none">
            <Outlet />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
