import { Building2, Globe, Headphones, MapPin, ShieldCheck } from "lucide-react";
import { TRUST_STATS } from "../lib/constants";

const icons = [Building2, MapPin, Globe, Headphones, ShieldCheck];

export function TrustStrip() {
  return (
    <section className="border-b border-border bg-white">
      <div className="container-page grid grid-cols-2 gap-y-6 py-8 md:grid-cols-5 md:py-10">
        {TRUST_STATS.map((s, i) => {
          const Icon = icons[i] ?? ShieldCheck;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
