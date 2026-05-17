import { Building2, MapPin, Globe, Headphones, Ticket } from "lucide-react";

const stats = [
  { icon: Building2, value: "800+", label: "Trusted suppliers" },
  { icon: MapPin, value: "30,000+", label: "Pickup locations" },
  { icon: Globe, value: "190+", label: "Countries covered" },
  { icon: Ticket, value: "1M+", label: "Bookings completed" },
  { icon: Headphones, value: "24/7", label: "Customer support" },
];

export function TrustStrip() {
  return (
    <section className="border-b border-border bg-white">
      <div className="container-page grid grid-cols-2 gap-y-6 py-8 md:grid-cols-5 md:py-10">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <s.icon className="size-5" />
            </div>
            <div>
              <div className="font-display text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
