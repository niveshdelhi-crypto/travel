"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Globe2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
} from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { DirectCallButton } from "./direct-call-button";
import { fieldInputClass, fieldSelectClass, SearchField } from "./search-field";
import { DRIVER_AGE_OPTIONS, RESIDENCY_OPTIONS } from "../lib/constants";
import { todayPlus } from "../lib/utils";
import {
  toLeadInput,
  validateContactStep,
  validateTripStep,
  type SearchFormErrors,
  type SearchFormState,
} from "../services/search-mapper";
import { useSearchLead } from "../hooks/use-search-lead";
import type { PublicLeadResponse } from "@/lib/leads/types";

const initialForm: SearchFormState = {
  pickupLocation: "",
  dropoffLocation: "",
  pickupDate: todayPlus(3),
  pickupTime: "10:00",
  returnDate: todayPlus(7),
  returnTime: "10:00",
  driverAge: "30-65",
  residency: "AE",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  acceptedTerms: false,
};

function formatApiError(error: unknown) {
  if (error instanceof ApiError) {
    const nested = error.details as { message?: string | string[] } | undefined;
    if (nested?.message) {
      return Array.isArray(nested.message) ? nested.message.join(", ") : nested.message;
    }
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : "Unable to submit your request. Please try again.";
}

function formatTripDate(date: string, time: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(`${date}T${time}:00`));
  } catch {
    return `${date} ${time}`;
  }
}

export function SearchForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<SearchFormState>(initialForm);
  const [errors, setErrors] = useState<SearchFormErrors>({});
  const [sameLocation, setSameLocation] = useState(true);
  const [success, setSuccess] = useState<PublicLeadResponse | null>(null);
  const mutation = useSearchLead();

  function set<K extends keyof SearchFormState>(key: K, value: SearchFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "pickupLocation" && sameLocation) {
        next.dropoffLocation = value as string;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function toggleSameLocation(checked: boolean) {
    setSameLocation(checked);
    if (checked) {
      setForm((current) => ({ ...current, dropoffLocation: current.pickupLocation }));
    }
    setErrors((current) => ({ ...current, dropoffLocation: undefined }));
  }

  function continueToContact(event: React.FormEvent) {
    event.preventDefault();
    const payload = sameLocation ? { ...form, dropoffLocation: form.pickupLocation } : form;
    const nextErrors = validateTripStep(payload, sameLocation);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setStep(2);
    setErrors({});
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = sameLocation ? { ...form, dropoffLocation: form.pickupLocation } : form;
    const nextErrors = validateContactStep(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate(toLeadInput(payload, sameLocation), {
      onSuccess: (response) => {
        setSuccess(response);
        setForm(initialForm);
        setSameLocation(true);
        setStep(1);
        setErrors({});
      },
      onError: (error) => {
        setErrors({ form: formatApiError(error) });
      },
    });
  }

  if (success) {
    return (
      <div className="glass-panel rounded-2xl p-5 shadow-glass md:p-6">
        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-brand-text">Request received</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-muted">
          Our team is matching your trip. Reference:{" "}
          <span className="font-mono text-brand-text">{success.leadId}</span>
        </p>
        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Search again
        </button>
      </div>
    );
  }

  const returnLocationValue = sameLocation ? form.pickupLocation : form.dropoffLocation;
  const dropLabel = sameLocation
    ? form.pickupLocation || "Same as pick-up"
    : form.dropoffLocation || "—";

  return (
    <div className="glass-panel rounded-2xl p-3 shadow-glass sm:p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
            {step === 1 ? "Step 1 of 2 · Trip" : "Step 2 of 2 · Contact"}
          </p>
          <h2 className="font-display text-base font-bold text-brand-text sm:text-lg">
            {step === 1 ? "Where & when?" : "How can we reach you?"}
          </h2>
        </div>
        <div className="flex gap-1">
          <span
            className={`h-1.5 w-8 rounded-full ${step >= 1 ? "bg-brand-primary" : "bg-white/20"}`}
          />
          <span
            className={`h-1.5 w-8 rounded-full ${step >= 2 ? "bg-brand-primary" : "bg-white/20"}`}
          />
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={continueToContact} className="space-y-2.5">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <SearchField
              label="Pick-up"
              icon={<MapPin className="size-3.5" />}
              error={errors.pickupLocation}
              compact
            >
              <input
                value={form.pickupLocation}
                onChange={(e) => set("pickupLocation", e.target.value)}
                placeholder="City or airport"
                className={fieldInputClass}
                autoComplete="off"
              />
            </SearchField>

            <SearchField
              label="Return"
              icon={<MapPin className="size-3.5" />}
              error={errors.dropoffLocation}
              compact
            >
              <input
                value={returnLocationValue}
                onChange={(e) => set("dropoffLocation", e.target.value)}
                placeholder={sameLocation ? "Same as pick-up" : "City or airport"}
                className={`${fieldInputClass} disabled:cursor-not-allowed disabled:opacity-70`}
                disabled={sameLocation}
                readOnly={sameLocation}
                aria-readonly={sameLocation}
              />
            </SearchField>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-brand-muted">
            <input
              type="checkbox"
              checked={sameLocation}
              onChange={(e) => toggleSameLocation(e.target.checked)}
              className="size-3.5 rounded border-white/20 accent-[#FF7A00]"
            />
            Return to same location
          </label>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <SearchField
              label="Pick-up date"
              icon={<Calendar className="size-3.5" />}
              error={errors.pickupDate}
              compact
            >
              <input
                type="date"
                value={form.pickupDate}
                onChange={(e) => set("pickupDate", e.target.value)}
                className={fieldInputClass}
              />
            </SearchField>
            <SearchField
              label="Time"
              icon={<Clock className="size-3.5" />}
              error={errors.pickupTime}
              compact
            >
              <input
                type="time"
                value={form.pickupTime}
                onChange={(e) => set("pickupTime", e.target.value)}
                className={fieldInputClass}
              />
            </SearchField>
            <SearchField
              label="Return date"
              icon={<Calendar className="size-3.5" />}
              error={errors.returnDate}
              compact
            >
              <input
                type="date"
                value={form.returnDate}
                min={form.pickupDate}
                onChange={(e) => set("returnDate", e.target.value)}
                className={fieldInputClass}
              />
            </SearchField>
            <SearchField
              label="Time"
              icon={<Clock className="size-3.5" />}
              error={errors.returnTime}
              compact
            >
              <input
                type="time"
                value={form.returnTime}
                onChange={(e) => set("returnTime", e.target.value)}
                className={fieldInputClass}
              />
            </SearchField>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <SearchField label="Driver age" icon={<User className="size-3.5" />} compact>
              <select
                value={form.driverAge}
                onChange={(e) => set("driverAge", e.target.value)}
                className={fieldSelectClass}
              >
                {DRIVER_AGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </SearchField>
            <SearchField label="Residency" icon={<Globe2 className="size-3.5" />} compact>
              <select
                value={form.residency}
                onChange={(e) => set("residency", e.target.value)}
                className={fieldSelectClass}
              >
                {RESIDENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </SearchField>
          </div>

          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-cta transition hover:cursor-pointer hover:brightness-110"
          >
            Continue
            <ArrowRight className="size-4" />
          </button>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-wider text-brand-muted">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <DirectCallButton />
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-2.5">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-brand-muted">
            <p className="font-medium text-brand-text">
              {form.pickupLocation || "Pick-up"} → {dropLabel}
            </p>
            <p className="mt-1">
              {formatTripDate(form.pickupDate, form.pickupTime)} —{" "}
              {formatTripDate(form.returnDate, form.returnTime)}
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <SearchField
              label="Full name"
              icon={<User className="size-3.5" />}
              error={errors.customerName}
              compact
            >
              <input
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                placeholder="Your name"
                className={fieldInputClass}
                autoComplete="name"
              />
            </SearchField>
            <SearchField
              label="Email"
              icon={<Mail className="size-3.5" />}
              error={errors.customerEmail}
              compact
            >
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => set("customerEmail", e.target.value)}
                placeholder="you@email.com"
                className={fieldInputClass}
                autoComplete="email"
              />
            </SearchField>
            <SearchField
              label="Phone"
              icon={<Phone className="size-3.5" />}
              error={errors.customerPhone}
              compact
            >
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => set("customerPhone", e.target.value)}
                placeholder="+1 555 000 0000"
                className={fieldInputClass}
                autoComplete="tel"
              />
            </SearchField>
          </div>

          <label className="flex items-start gap-2 text-xs text-brand-muted">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(e) => set("acceptedTerms", e.target.checked)}
              className="mt-0.5 size-3.5 rounded accent-[#FF7A00]"
            />
            <span>
              I agree to be contacted about this rental and accept the{" "}
              <a
                href="/terms-and-conditions"
                className="text-brand-accent underline-offset-2 hover:underline"
              >
                terms
              </a>
              .
              {errors.acceptedTerms ? (
                <span className="mt-1 block text-red-300">{errors.acceptedTerms}</span>
              ) : null}
            </span>
          </label>

          {errors.form ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {errors.form}
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setErrors({});
              }}
              className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/15 text-sm font-medium text-brand-text transition hover:cursor-pointer hover:bg-white/5"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex h-11 flex-[2] cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-primary text-sm font-semibold text-white shadow-cta transition hover:cursor-pointer hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Search Cars
                </>
              )}
            </button>
          </div>

          <DirectCallButton />
        </form>
      )}

      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-brand-muted">
        <LockKeyhole className="size-3" />
        Secure · Best price guarantee
      </p>
    </div>
  );
}
