"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Headphones,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { leadsService } from "@/services/leads.service";
import type { CreateLeadInput, PublicLeadResponse } from "@/lib/leads/types";

type LeadFormState = {
  pickup_location: string;
  drop_location: string;
  pickup_datetime: string;
  return_datetime: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  accepted_terms: boolean;
};

type FormErrors = Partial<Record<keyof LeadFormState | "form", string>>;

const initialForm: LeadFormState = {
  pickup_location: "",
  drop_location: "",
  pickup_datetime: "",
  return_datetime: "",
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  accepted_terms: false,
};

const reveal: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

export function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -90]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 180]);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || window.matchMedia("(pointer: coarse)").matches) return;

    const quickX = gsap.quickTo(cursor, "x", { duration: 0.24, ease: "power3.out" });
    const quickY = gsap.quickTo(cursor, "y", { duration: 0.24, ease: "power3.out" });
    const onMove = (event: PointerEvent) => {
      quickX(event.clientX - 10);
      quickY(event.clientY - 10);
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={pageRef} className="relative min-h-screen overflow-hidden bg-[#06101f] text-white">
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-50 hidden h-5 w-5 rounded-full border border-sky-200/50 mix-blend-screen md:block"
      />
      <motion.div
        aria-hidden="true"
        style={{ y: glowY }}
        className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.26),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.16),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(15,118,110,0.2),rgba(2,6,23,0.2))]"
      />
      <div aria-hidden="true" className="mobility-grid absolute inset-0 opacity-40" />
      <HeroSection heroY={heroY} />
      <TrustBar />
      <HowItWorks />
      <OperationsSection />
      <CoverageSection />
      <SocialProof />
      <FinalCta />
    </div>
  );
}

function HeroSection({ heroY }: { heroY: MotionValue<number> }) {
  return (
    <section className="relative min-h-[92svh] px-5 pb-10 pt-6 sm:px-8 lg:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="#" className="flex items-center gap-3" aria-label="FleetNexus home">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/10 shadow-2xl shadow-sky-500/20 backdrop-blur">
            <Sparkles className="h-5 w-5 text-sky-200" />
          </span>
          <span className="text-lg font-semibold tracking-tight">FleetNexus</span>
        </a>
        <div className="hidden items-center gap-7 text-sm text-white/72 md:flex">
          <a href="#how-it-works" className="hover:text-white">
            How it works
          </a>
          <a href="#coverage" className="hover:text-white">
            Coverage
          </a>
          <a href="#trust" className="hover:text-white">
            Trust
          </a>
        </div>
        <a
          href="#request"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-950 shadow-xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-sky-100"
        >
          Request rental
          <ArrowRight className="h-4 w-4" />
        </a>
      </nav>

      <div className="mx-auto grid max-w-7xl items-center gap-10 pt-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.78fr)] lg:pt-20">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-4xl"
        >
          <motion.div
            variants={reveal}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200/20 bg-white/8 px-3 py-1.5 text-sm text-sky-100 shadow-2xl shadow-sky-500/10 backdrop-blur-xl"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            Live rental operations desk online
          </motion.div>

          <motion.h1
            variants={reveal}
            className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Premium vehicle rentals, backed by real experts.
          </motion.h1>

          <motion.p
            variants={reveal}
            className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl"
          >
            Submit your rental requirements and FleetNexus operations specialists coordinate the
            best available vehicle, price, and pickup plan with verified rental partners.
          </motion.p>

          <motion.div variants={reveal} className="mt-8 flex flex-wrap gap-3">
            <TrustPill icon={Clock3} label="Fast expert response" />
            <TrustPill icon={Headphones} label="24/7 rental assistance" />
            <TrustPill icon={ShieldCheck} label="Verified partner network" />
          </motion.div>

          <motion.div
            variants={reveal}
            className="mt-10 grid max-w-2xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl"
          >
            <Counter value="8 min" label="median response" />
            <Counter value="120+" label="coverage markets" />
            <Counter value="4.9/5" label="support rating" />
          </motion.div>
        </motion.div>

        <motion.div style={{ y: heroY }} className="relative z-10" id="request">
          <LeadRequestCard />
        </motion.div>
      </div>

      <MobilityVisual />
    </section>
  );
}

function LeadRequestCard() {
  const [form, setForm] = useState<LeadFormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<PublicLeadResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const idempotencyKey = createIdempotencyKey();
      return leadsService.createLead(input, idempotencyKey);
    },
    onSuccess: (response) => {
      setSuccess(response);
      setForm(initialForm);
      setErrors({});
    },
    onError: (error) => {
      setErrors({
        form: error instanceof Error ? error.message : "Unable to submit your request.",
      });
    },
  });

  function update<Key extends keyof LeadFormState>(key: Key, value: LeadFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLeadForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    mutation.mutate(toLeadInput(form));
  }

  if (success) {
    return (
      <>
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed right-4 top-4 z-40 rounded-2xl border border-emerald-200/20 bg-slate-950/90 px-4 py-3 text-sm text-emerald-100 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl"
        >
          Request submitted. An expert will follow up shortly.
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="rounded-[2rem] border border-emerald-200/20 bg-white/[0.08] p-6 shadow-2xl shadow-emerald-500/20 backdrop-blur-2xl"
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300 text-emerald-950">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold">Request received.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Your FleetNexus operations specialist is matching your trip with available rental
            partners. Reference ID: <span className="font-mono text-white">{success.leadId}</span>
          </p>
          <button
            onClick={() => setSuccess(null)}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950"
          >
            Submit another request
          </button>
        </motion.div>
      </>
    );
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[2rem] border border-white/14 bg-white/[0.08] p-4 shadow-2xl shadow-sky-950/50 backdrop-blur-2xl sm:p-5"
    >
      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
              Concierge request
            </p>
            <h2 className="mt-1 text-xl font-semibold">Get matched with the right vehicle</h2>
          </div>
          <span className="rounded-full bg-emerald-300/12 px-3 py-1 text-xs font-semibold text-emerald-200">
            24/7
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FloatingField
            icon={MapPin}
            label="Pickup location"
            value={form.pickup_location}
            error={errors.pickup_location}
            placeholder="City, airport, address"
            onChange={(value) => update("pickup_location", value)}
          />
          <FloatingField
            icon={MapPin}
            label="Drop location"
            value={form.drop_location}
            error={errors.drop_location}
            placeholder="Same or alternate"
            onChange={(value) => update("drop_location", value)}
          />
          <FloatingField
            icon={CalendarClock}
            label="Pickup date and time"
            value={form.pickup_datetime}
            error={errors.pickup_datetime}
            type="datetime-local"
            onChange={(value) => update("pickup_datetime", value)}
          />
          <FloatingField
            icon={CalendarClock}
            label="Return date and time"
            value={form.return_datetime}
            error={errors.return_datetime}
            type="datetime-local"
            onChange={(value) => update("return_datetime", value)}
          />
          <FloatingField
            icon={User}
            label="Full name"
            value={form.customer_name}
            error={errors.customer_name}
            placeholder="Alex Morgan"
            onChange={(value) => update("customer_name", value)}
          />
          <FloatingField
            icon={Phone}
            label="Phone"
            value={form.customer_phone}
            error={errors.customer_phone}
            placeholder="+1 555 000 0000"
            inputMode="tel"
            onChange={(value) => update("customer_phone", value)}
          />
          <div className="sm:col-span-2">
            <FloatingField
              icon={Mail}
              label="Email"
              value={form.customer_email}
              error={errors.customer_email}
              placeholder="you@company.com"
              type="email"
              onChange={(value) => update("customer_email", value)}
            />
          </div>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.accepted_terms}
            onChange={(event) => update("accepted_terms", event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-sky-300"
          />
          <span>
            I agree to be contacted by FleetNexus operations about this rental request.
            {errors.accepted_terms ? (
              <span className="mt-1 block text-xs text-rose-200">{errors.accepted_terms}</span>
            ) : null}
          </span>
        </label>

        {errors.form ? (
          <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {errors.form}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="group mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 shadow-2xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Matching request
            </>
          ) : (
            <>
              Request expert assistance
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <LockKeyhole className="h-3.5 w-3.5" />
          Secure submission. No payment required to request assistance.
        </div>
      </div>
    </motion.form>
  );
}

function MobilityVisual() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[48%] lg:block"
    >
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 1440 520" fill="none">
        <path
          className="route-line"
          d="M-20 390 C 220 270, 300 460, 520 310 S 880 130, 1060 260 S 1270 420, 1460 250"
          stroke="url(#routeA)"
          strokeWidth="2"
        />
        <path
          className="route-line-fast"
          d="M80 450 C 330 350, 420 210, 650 250 S 930 420, 1200 160"
          stroke="url(#routeB)"
          strokeWidth="1.5"
        />
        <defs>
          <linearGradient id="routeA" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="0.48" stopColor="#7dd3fc" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="routeB" x1="0" y1="0" x2="1200" y2="0">
            <stop stopColor="#f8fafc" stopOpacity="0" />
            <stop offset="0.5" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <motion.div
        animate={{ x: [0, 28, 0], y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-24 left-[12%] rounded-3xl border border-white/10 bg-white/[0.08] px-4 py-3 backdrop-blur-xl"
      >
        <CarGlyph />
      </motion.div>
      <motion.div
        animate={{ x: [0, -22, 0], y: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-40 right-[18%] rounded-3xl border border-sky-200/15 bg-sky-200/[0.08] px-4 py-3 backdrop-blur-xl"
      >
        <CarGlyph />
      </motion.div>
    </div>
  );
}

function TrustBar() {
  const partners = [
    "Horizon Fleet",
    "NorthStar Rentals",
    "MetroDrive",
    "Apex Mobility",
    "Executive Auto",
  ];

  return (
    <section className="relative border-y border-white/10 bg-white/[0.04] px-5 py-7 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-slate-300">
          Trusted operating model for premium rental support
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white/55">
          {partners.map((partner) => (
            <span key={partner}>{partner}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: MapPin,
      title: "Submit your exact route",
      body: "Tell us where, when, and what kind of rental experience you need.",
    },
    {
      icon: Zap,
      title: "Operations team matches options",
      body: "FleetNexus checks partner availability, logistics, price, and pickup quality.",
    },
    {
      icon: BadgeCheck,
      title: "Book with confidence",
      body: "A real specialist helps coordinate the final vehicle and handoff details.",
    },
  ];

  return (
    <Section
      id="how-it-works"
      eyebrow="Concierge workflow"
      title="A faster way to secure the right rental."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.article
            key={step.title}
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="glow-card rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-200/12 text-sky-100">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-sm text-white/35">0{index + 1}</span>
            </div>
            <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>
            <p className="mt-3 leading-7 text-slate-300">{step.body}</p>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

function OperationsSection() {
  return (
    <Section
      eyebrow="Operational intelligence"
      title="Built around real support, not endless browsing."
    >
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
        >
          <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-sky-200">Live desk</p>
                <h3 className="mt-1 text-xl font-semibold">Rental operations queue</h3>
              </div>
              <span className="rounded-full bg-emerald-300/12 px-3 py-1 text-xs text-emerald-200">
                Active
              </span>
            </div>
            {[
              ["Toronto", "Premium SUV", "Matched"],
              ["New York", "Executive sedan", "Reviewing"],
              ["Miami", "Convertible", "Partner check"],
              ["Vancouver", "Family van", "Matched"],
            ].map(([city, vehicle, state]) => (
              <div
                key={`${city}-${vehicle}`}
                className="flex items-center justify-between border-b border-white/8 py-4 last:border-0"
              >
                <div>
                  <p className="font-medium">{city}</p>
                  <p className="mt-1 text-sm text-slate-400">{vehicle}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {state}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            [
              "Transparent pricing",
              "Specialists help compare total rental value, not just headline rates.",
            ],
            [
              "Verified partners",
              "FleetNexus focuses on trusted operators with reliable handoff workflows.",
            ],
            [
              "Fast follow-up",
              "Requests route into an operational queue built for rapid response.",
            ],
            [
              "Travel-ready support",
              "Pickup, return, and changes are coordinated by people who understand rentals.",
            ],
          ].map(([title, body]) => (
            <motion.div
              key={title}
              variants={reveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-200" />
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function CoverageSection() {
  return (
    <Section
      id="coverage"
      eyebrow="Nationwide coverage"
      title="A mobility network designed for urgent rental needs."
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-sky-950/40 sm:p-8">
        <div className="premium-noise absolute inset-0 opacity-30" />
        <svg
          className="relative h-[330px] w-full"
          viewBox="0 0 1000 330"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M90 245 C240 90 380 280 520 150 S760 60 920 210"
            stroke="#38bdf8"
            strokeOpacity="0.45"
            strokeWidth="2"
            className="route-line"
          />
          <path
            d="M130 120 C300 210 370 70 540 210 S780 270 880 90"
            stroke="#a7f3d0"
            strokeOpacity="0.35"
            strokeWidth="2"
            className="route-line-fast"
          />
          {[
            [120, 230, "SEA"],
            [280, 120, "SFO"],
            [420, 235, "DEN"],
            [570, 150, "DFW"],
            [730, 95, "YYZ"],
            [875, 205, "NYC"],
          ].map(([x, y, label]) => (
            <g key={label}>
              <circle cx={x} cy={y} r="22" fill="#38bdf8" fillOpacity="0.08" />
              <circle cx={x} cy={y} r="5" fill="#7dd3fc" />
              <text
                x={Number(x) + 14}
                y={Number(y) - 10}
                fill="#e0f2fe"
                fontSize="14"
                fontWeight="700"
              >
                {label}
              </text>
            </g>
          ))}
        </svg>
        <div className="relative grid gap-4 md:grid-cols-3">
          <MetricBlock value="24/7" label="Rental assistance" />
          <MetricBlock value="120+" label="priority markets" countTo={120} suffix="+" />
          <MetricBlock value="8 min" label="median specialist response" countTo={8} suffix=" min" />
        </div>
      </div>
    </Section>
  );
}

function SocialProof() {
  return (
    <Section
      id="trust"
      eyebrow="Customer confidence"
      title="Designed for travelers who need certainty."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          [
            "It felt less like searching and more like having an operations team on my side.",
            "Maya R.",
            "Executive traveler",
          ],
          [
            "FleetNexus found a better SUV option and coordinated the pickup details within minutes.",
            "Daniel K.",
            "Family rental",
          ],
          [
            "The human follow-up is the difference. We had changes, and they handled the moving pieces.",
            "Priya S.",
            "Business trip",
          ],
        ].map(([quote, name, role]) => (
          <motion.figure
            key={name}
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
          >
            <div className="mb-5 flex gap-1 text-sky-200" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index}>*</span>
              ))}
            </div>
            <blockquote className="text-lg leading-8 text-slate-100">"{quote}"</blockquote>
            <figcaption className="mt-6 text-sm text-slate-400">
              <span className="font-semibold text-white">{name}</span> - {role}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </Section>
  );
}

function FinalCta() {
  return (
    <section className="relative px-5 py-20 sm:px-8 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.08] p-8 text-center shadow-2xl shadow-sky-950/40 backdrop-blur-2xl sm:p-12"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">
          Move with certainty
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          Tell us the trip. We will help secure the vehicle.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
          FleetNexus combines premium rental partners with real operational support, so your request
          moves quickly from requirement to coordinated booking.
        </p>
        <a
          href="#request"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-100"
        >
          Start a rental request
          <ArrowRight className="h-4 w-4" />
        </a>
      </motion.div>
    </section>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="relative px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-10 max-w-3xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">{eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function FloatingField({
  label,
  value,
  error,
  icon: Icon,
  onChange,
  type = "text",
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  error?: string;
  icon: React.ElementType;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const active = value.length > 0 || type === "datetime-local";

  return (
    <label className="landing-field block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        <Icon className="h-3.5 w-3.5 text-sky-200" />
        {label}
      </span>
      <input
        value={value}
        type={type}
        inputMode={inputMode}
        placeholder={active ? placeholder : ""}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-slate-500"
      />
      {error ? <span className="mt-1.5 block text-xs text-rose-200">{error}</span> : null}
    </label>
  );
}

function TrustPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl">
      <Icon className="h-4 w-4 text-sky-200" />
      {label}
    </span>
  );
}

function Counter({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 text-center">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
    </div>
  );
}

function MetricBlock({
  value,
  label,
  countTo,
  suffix = "",
}: {
  value: string;
  label: string;
  countTo?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView || countTo == null) return;

    let frame = 0;
    const frames = 36;
    const interval = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / frames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(countTo * eased));
      if (progress === 1) window.clearInterval(interval);
    }, 24);

    return () => window.clearInterval(interval);
  }, [countTo, isInView]);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
    >
      <p className="text-3xl font-semibold">
        {countTo == null ? value : `${displayValue}${suffix}`}
      </p>
      <p className="mt-2 text-sm text-slate-300">{label}</p>
    </div>
  );
}

function CarGlyph() {
  return (
    <svg width="98" height="34" viewBox="0 0 98 34" fill="none" aria-hidden="true">
      <path
        d="M16 22H7.5C4.5 22 3 20.4 3 18.4C3 16.4 4.4 15.2 6.8 14.8L18.8 12.7L28.3 5.8C31 3.8 34.2 2.8 37.6 2.8H58.5C62 2.8 65.3 4.1 67.8 6.5L75.5 13.8L88.8 15.9C92.5 16.5 95 18.8 95 21.8H83.5"
        stroke="#e0f2fe"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M28 22H70" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="24" r="6" stroke="#7dd3fc" strokeWidth="2" />
      <circle cx="77" cy="24" r="6" stroke="#7dd3fc" strokeWidth="2" />
      <path
        d="M31 13H45V7H38C35.8 7 33.8 7.7 32 9L28 12C27.5 12.4 27.8 13 28.4 13H31Z"
        fill="#bae6fd"
        fillOpacity="0.24"
      />
      <path d="M50 13H68L63.5 8.8C62.3 7.7 60.7 7 59 7H50V13Z" fill="#bae6fd" fillOpacity="0.24" />
    </svg>
  );
}

function validateLeadForm(form: LeadFormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.pickup_location.trim()) errors.pickup_location = "Pickup location is required.";
  if (!form.drop_location.trim()) errors.drop_location = "Drop location is required.";
  if (!form.customer_name.trim()) errors.customer_name = "Name is required.";
  if (!/^\S+@\S+\.\S+$/.test(form.customer_email.trim()))
    errors.customer_email = "Enter a valid email.";
  if (form.customer_phone.trim().replace(/\D/g, "").length < 7) {
    errors.customer_phone = "Enter a reachable phone number.";
  }
  if (!form.pickup_datetime) errors.pickup_datetime = "Pickup time is required.";
  if (!form.return_datetime) errors.return_datetime = "Return time is required.";

  const pickup = form.pickup_datetime ? new Date(form.pickup_datetime) : null;
  const returns = form.return_datetime ? new Date(form.return_datetime) : null;
  if (pickup && returns && returns <= pickup) {
    errors.return_datetime = "Return must be after pickup.";
  }
  if (!form.accepted_terms) errors.accepted_terms = "Consent is required.";
  return errors;
}

function toLeadInput(form: LeadFormState): CreateLeadInput {
  return {
    pickup_location: form.pickup_location.trim(),
    drop_location: form.drop_location.trim(),
    pickup_datetime: new Date(form.pickup_datetime).toISOString(),
    return_datetime: new Date(form.return_datetime).toISOString(),
    customer_name: form.customer_name.trim(),
    customer_email: form.customer_email.toLowerCase().trim(),
    customer_phone: form.customer_phone.trim(),
  };
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `landing-${crypto.randomUUID()}`;
  }
  return `landing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
