import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import suvImg from "@/assets/car-suv.jpg";
import {
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Download,
  Headphones,
  MapPin,
  Phone,
  Share2,
  Shield,
  Star,
  Fuel,
  Users,
  Cog,
} from "lucide-react";

export const Route = createFileRoute("/confirmation")({
    component: ConfirmationPage,
});

function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="pt-20">
        <div className="mx-auto max-w-3xl px-6 py-12">

          {/* Success hero */}
          <div className="mb-10 text-center animate-fade-up">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Booking confirmed!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Your reservation is confirmed. A confirmation email has been sent to{" "}
              <span className="font-medium text-foreground">j.smith@example.com</span>
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-mono font-medium text-foreground">
              Booking reference: <span className="text-primary">BK-9821</span>
            </div>
          </div>

          {/* Booking card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20">
            {/* Vehicle banner */}
            <div className="relative h-52 overflow-hidden">
              <img src={suvImg} alt="Range Rover Sport" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/90 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xl font-bold text-foreground">Range Rover Sport</div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span>Hertz · JFK Airport</span>
                      <span>·</span>
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-foreground">4.9</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">$1,240</div>
                    <div className="text-xs text-muted-foreground">Total paid</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle specs */}
            <div className="flex gap-4 border-b border-border bg-surface-2 px-5 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> 7 seats</span>
              <span className="flex items-center gap-1.5"><Cog className="h-3.5 w-3.5" /> Automatic</span>
              <span className="flex items-center gap-1.5"><Fuel className="h-3.5 w-3.5" /> Hybrid</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-success" /> Fully insured</span>
            </div>

            {/* Trip details grid */}
            <div className="grid gap-px bg-border md:grid-cols-2">
              <DetailCell
                icon={MapPin}
                label="Pickup location"
                value="JFK Airport, Terminal 4"
                sub="John F. Kennedy International Airport, NY"
              />
              <DetailCell
                icon={MapPin}
                label="Drop-off location"
                value="Manhattan, 5th Avenue"
                sub="Same-location drop-off included"
                iconTone="text-primary"
              />
              <DetailCell
                icon={Calendar}
                label="Pickup date"
                value="Monday, May 12 · 10:00 AM"
                sub="Be at the counter 15 min early"
              />
              <DetailCell
                icon={Calendar}
                label="Return date"
                value="Sunday, May 18 · 10:00 AM"
                sub="6-day rental duration"
              />
            </div>

            {/* Primary driver */}
            <div className="border-t border-border bg-surface p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Primary driver
              </div>
              <div className="flex items-center gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-secondary to-info text-sm font-bold text-foreground">
                  JS
                </div>
                <div>
                  <div className="font-medium text-foreground">John Smith</div>
                  <div className="text-xs text-muted-foreground">j.smith@example.com · +1 (555) 000-0000</div>
                </div>
              </div>
            </div>

            {/* What's included */}
            <div className="border-t border-border bg-surface-2/60 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                What's included
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  "Collision damage waiver",
                  "Third-party liability",
                  "Airport pickup coordination",
                  "24/7 roadside assistance",
                  "Child seat (pre-arranged)",
                  "Unlimited mileage",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border p-5">
              <div className="flex flex-wrap items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2">
                  <Download className="h-4 w-4" /> Download receipt
                </button>
                <button className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2">
                  <Share2 className="h-4 w-4" /> Share booking
                </button>
                <Link
                  to="/"
                  className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Back to home <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Support panel */}
          <div className="mt-6 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Need anything? We're here.</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Our assisted booking team is available 24/7. Reference your booking ID when calling.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="tel:+18005551234"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    <Phone className="h-3.5 w-3.5" /> +1 (800) 555-1234
                  </a>
                  <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                    <Car className="h-3.5 w-3.5" /> Modify booking
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="mt-6 rounded-xl border border-border bg-surface p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Next steps
            </div>
            <ol className="space-y-4">
              {[
                { n: "1", title: "Check your email", body: "A full confirmation with QR code has been sent to j.smith@example.com" },
                { n: "2", title: "Bring valid ID & license", body: "Driver must present the license used at booking at the counter" },
                { n: "3", title: "Arrive 15 minutes early", body: "Go to the Hertz counter at JFK Terminal 4. Your agent will be ready." },
              ].map((s) => (
                <li key={s.n} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {s.n}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.body}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function DetailCell({
  icon: Icon,
  label,
  value,
  sub,
  iconTone = "text-muted-foreground",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  iconTone?: string;
}) {
  return (
    <div className="bg-surface p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${iconTone}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
