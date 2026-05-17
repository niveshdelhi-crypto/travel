import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Calendar, Clock, User, Globe2, Search, Loader2 } from "lucide-react";
import { buildResultsHref, submitLead, type SearchPayload } from "@/lib/search";

const todayPlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function SearchCard({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sameLocation, setSameLocation] = useState(true);
  const [form, setForm] = useState<SearchPayload>({
    pickupLocation: "",
    dropoffLocation: "",
    pickupDate: todayPlus(3),
    pickupTime: "10:00",
    returnDate: todayPlus(7),
    returnTime: "10:00",
    driverAge: "30-65",
    residency: "AE",
  });

  const set = <K extends keyof SearchPayload>(k: K, v: SearchPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.pickupLocation.trim()) {
      setError("Please enter a pickup location");
      return;
    }
    const payload = {
      ...form,
      dropoffLocation: sameLocation ? form.pickupLocation : form.dropoffLocation,
    };
    setSubmitting(true);
    const res = await submitLead(payload);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong. Please try again.");
      return;
    }
    navigate({ to: buildResultsHref(payload) });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-3xl bg-white p-5 md:p-6 shadow-elevated border border-border/60 ${
        compact ? "" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
          <input
            type="checkbox"
            checked={sameLocation}
            onChange={(e) => setSameLocation(e.target.checked)}
            className="size-4 rounded border-border accent-[var(--cta)]"
          />
          Return to same location
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-12">
        <Field label="Pick-up location" icon={<MapPin className="size-4" />} className="md:col-span-6">
          <input
            value={form.pickupLocation}
            onChange={(e) => set("pickupLocation", e.target.value)}
            placeholder="City, airport or station"
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            autoComplete="off"
          />
        </Field>

        {!sameLocation && (
          <Field label="Drop-off location" icon={<MapPin className="size-4" />} className="md:col-span-6">
            <input
              value={form.dropoffLocation}
              onChange={(e) => set("dropoffLocation", e.target.value)}
              placeholder="City, airport or station"
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </Field>
        )}

        <Field label="Pick-up date" icon={<Calendar className="size-4" />} className={sameLocation ? "md:col-span-3" : "md:col-span-3"}>
          <input
            type="date"
            value={form.pickupDate}
            onChange={(e) => set("pickupDate", e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
          />
        </Field>

        <Field label="Time" icon={<Clock className="size-4" />} className="md:col-span-3">
          <input
            type="time"
            value={form.pickupTime}
            onChange={(e) => set("pickupTime", e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
          />
        </Field>

        {sameLocation && (
          <Field label="Return date" icon={<Calendar className="size-4" />} className="md:col-span-3">
            <input
              type="date"
              value={form.returnDate}
              onChange={(e) => set("returnDate", e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
            />
          </Field>
        )}

        {sameLocation && (
          <Field label="Time" icon={<Clock className="size-4" />} className="md:col-span-3">
            <input
              type="time"
              value={form.returnTime}
              onChange={(e) => set("returnTime", e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
            />
          </Field>
        )}

        {!sameLocation && (
          <>
            <Field label="Return date" icon={<Calendar className="size-4" />} className="md:col-span-3">
              <input type="date" value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} className="w-full bg-transparent outline-none text-sm" />
            </Field>
            <Field label="Time" icon={<Clock className="size-4" />} className="md:col-span-3">
              <input type="time" value={form.returnTime} onChange={(e) => set("returnTime", e.target.value)} className="w-full bg-transparent outline-none text-sm" />
            </Field>
          </>
        )}

        <Field label="Driver age" icon={<User className="size-4" />} className="md:col-span-3">
          <select
            value={form.driverAge}
            onChange={(e) => set("driverAge", e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
          >
            <option value="18-24">18–24</option>
            <option value="25-29">25–29</option>
            <option value="30-65">30–65</option>
            <option value="66+">66+</option>
          </select>
        </Field>

        <Field label="Residency" icon={<Globe2 className="size-4" />} className="md:col-span-3">
          <select
            value={form.residency}
            onChange={(e) => set("residency", e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
          >
            <option value="AE">United Arab Emirates</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="ES">Spain</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="IN">India</option>
            <option value="TR">Türkiye</option>
          </select>
        </Field>

        <div className="md:col-span-6">
          <button
            type="submit"
            disabled={submitting}
            className="group h-full w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-cta px-6 py-4 text-base font-semibold text-cta-foreground shadow-cta transition-transform hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-70 disabled:cursor-wait"
          >
            {submitting ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
            {submitting ? "Searching…" : "Search Cars"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  icon,
  className = "",
  children,
}: {
  label: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`group block rounded-2xl border border-border bg-surface-muted/60 px-3.5 py-2.5 transition-colors focus-within:border-accent focus-within:bg-white ${className}`}>
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="mt-1 text-foreground">{children}</div>
    </label>
  );
}
