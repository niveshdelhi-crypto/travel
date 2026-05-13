import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, CheckCircle2, Headphones, MapPin, Phone } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/booking/success")({
  component: LeadSuccessPage,
});

type SubmittedLead = {
  id?: string;
  pickupLocation?: string;
  dropLocation?: string;
  dropoffLocation?: string;
  pickupDateTime?: string;
  returnDateTime?: string;
  pickupDate?: string;
  dropDate?: string;
  fullName?: string;
  name?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  vehicleId?: string;
};

function LeadSuccessPage() {
  const [lead, setLead] = useState<SubmittedLead | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("booking_full_data") || sessionStorage.getItem("lead_submission");
    if (!stored) return;

    try {
      setLead(JSON.parse(stored) as SubmittedLead);
    } catch {
      setLead(null);
    }
  }, []);

  const customerName = lead?.fullName || lead?.name;
  const pickupLocation = lead?.pickupLocation;
  const dropLocation = lead?.dropLocation || lead?.dropoffLocation;
  const pickupDate = lead?.pickupDateTime || lead?.pickupDate;
  const returnDate = lead?.returnDateTime || lead?.dropDate;
  const contact = [lead?.countryCode, lead?.phone].filter(Boolean).join(" ");

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl shadow-black/35 sm:p-10"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_48px_-18px_var(--color-primary)]">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Rental Request Received
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Thanks{customerName ? `, ${customerName}` : ""}. Your request has been created, and a rental expert will contact you shortly with matching options.
          </p>

          {lead ? (
            <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
              <Detail icon={MapPin} label="Route">
                {pickupLocation || "Pickup location"} to {dropLocation || "drop location"}
              </Detail>
              <Detail icon={CalendarClock} label="Pickup">
                {pickupDate ? new Date(pickupDate).toLocaleString() : "Date pending"}
              </Detail>
              {returnDate ? (
                <Detail icon={CalendarClock} label="Return">
                  {new Date(returnDate).toLocaleString()}
                </Detail>
              ) : null}
              <Detail icon={Phone} label="Contact">
                {contact || lead.email || "Contact pending"}
              </Detail>
              <Detail icon={Headphones} label="Next step">
                Expert-assisted booking review
              </Detail>
            </div>
          ) : null}

          <div className="mt-8 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
            Keep your phone nearby. Qualified rental requests are prioritized for fast follow-up.
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface-2 px-5 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40"
            >
              Submit another request
            </Link>
            <Link
              to="/search"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-105"
            >
              Browse vehicles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/45 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground/88">{children}</p>
    </div>
  );
}
