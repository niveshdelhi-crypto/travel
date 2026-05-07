import { Brand } from "@/components/brand";

const cols = [
  { title: "Product", links: ["Marketplace", "Booking CRM", "Cloud Telephony", "Payments"] },
  { title: "Company", links: ["About", "Careers", "Press", "Partners"] },
  { title: "Resources", links: ["Help Center", "API Docs", "Status", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-6">
        <div className="col-span-2">
          <Brand />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            The operational platform for car rental marketplaces across USA & Canada.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l}>
                  <a className="text-sm text-foreground/80 transition hover:text-foreground" href="#">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} RentOps Inc. — Operating in USA & Canada</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
