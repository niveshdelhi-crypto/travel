"use client";

import { useState } from "react";
import {
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
import { fieldInputClass, SearchField } from "./search-field";
import { DRIVER_AGE_OPTIONS, RESIDENCY_OPTIONS } from "../lib/constants";
import { todayPlus } from "../lib/utils";
import {
  toLeadInput,
  validateSearchForm,
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

export function SearchForm() {
  const [form, setForm] = useState<SearchFormState>(initialForm);
  const [errors, setErrors] = useState<SearchFormErrors>({});
  const [sameLocation, setSameLocation] = useState(true);
  const [success, setSuccess] = useState<PublicLeadResponse | null>(null);
  const mutation = useSearchLead();

  function set<K extends keyof SearchFormState>(key: K, value: SearchFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateSearchForm(form, sameLocation);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate(toLeadInput(form, sameLocation), {
      onSuccess: (response) => {
        setSuccess(response);
        setForm(initialForm);
        setErrors({});
      },
      onError: (error) => {
        setErrors({ form: error.message || "Unable to submit your request. Please try again." });
      },
    });
  }

  if (success) {
    return (
      <div className="glass-panel rounded-3xl p-6 shadow-glass md:p-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold text-brand-text">Request received</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">
          Our team is matching your trip with available rental partners. Reference:{" "}
          <span className="font-mono text-brand-text">{success.leadId}</span>
        </p>
        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="mt-6 inline-flex h-11 items-center rounded-2xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Search again
        </button>
      </div>
    );
  }

  return (
    <form id="search" onSubmit={onSubmit} className="glass-panel rounded-3xl p-4 shadow-glass md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
            Premium search
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-brand-text md:text-xl">
            Compare rates from 800+ suppliers
          </h2>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-brand-muted">
          <input
            type="checkbox"
            checked={sameLocation}
            onChange={(e) => setSameLocation(e.target.checked)}
            className="size-4 rounded border-white/20 accent-[#FF7A00]"
          />
          Same return location
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-12">
        <SearchField
          label="Pick-up location"
          icon={<MapPin className="size-4" />}
          className="md:col-span-6"
          error={errors.pickupLocation}
        >
          <input
            value={form.pickupLocation}
            onChange={(e) => set("pickupLocation", e.target.value)}
            placeholder="City, airport or station"
            className={fieldInputClass}
            autoComplete="off"
          />
        </SearchField>

        {!sameLocation && (
          <SearchField
            label="Return location"
            icon={<MapPin className="size-4" />}
            className="md:col-span-6"
            error={errors.dropoffLocation}
          >
            <input
              value={form.dropoffLocation}
              onChange={(e) => set("dropoffLocation", e.target.value)}
              placeholder="City, airport or station"
              className={fieldInputClass}
            />
          </SearchField>
        )}

        <SearchField
          label="Pick-up date"
          icon={<Calendar className="size-4" />}
          className="md:col-span-3"
          error={errors.pickupDate}
        >
          <input
            type="date"
            value={form.pickupDate}
            onChange={(e) => set("pickupDate", e.target.value)}
            className={fieldInputClass}
          />
        </SearchField>

        <SearchField label="Time" icon={<Clock className="size-4" />} className="md:col-span-3">
          <input
            type="time"
            value={form.pickupTime}
            onChange={(e) => set("pickupTime", e.target.value)}
            className={fieldInputClass}
          />
        </SearchField>

        <SearchField
          label="Return date"
          icon={<Calendar className="size-4" />}
          className="md:col-span-3"
          error={errors.returnDate}
        >
          <input
            type="date"
            value={form.returnDate}
            onChange={(e) => set("returnDate", e.target.value)}
            className={fieldInputClass}
          />
        </SearchField>

        <SearchField label="Time" icon={<Clock className="size-4" />} className="md:col-span-3">
          <input
            type="time"
            value={form.returnTime}
            onChange={(e) => set("returnTime", e.target.value)}
            className={fieldInputClass}
          />
        </SearchField>

        <SearchField label="Driver age" icon={<User className="size-4" />} className="md:col-span-3">
          <select
            value={form.driverAge}
            onChange={(e) => set("driverAge", e.target.value)}
            className={fieldInputClass}
          >
            {DRIVER_AGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </SearchField>

        <SearchField label="Residency" icon={<Globe2 className="size-4" />} className="md:col-span-3">
          <select
            value={form.residency}
            onChange={(e) => set("residency", e.target.value)}
            className={fieldInputClass}
          >
            {RESIDENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </SearchField>
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-3">
        <SearchField label="Full name" icon={<User className="size-4" />} error={errors.customerName}>
          <input
            value={form.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            placeholder="Your name"
            className={fieldInputClass}
          />
        </SearchField>
        <SearchField label="Email" icon={<Mail className="size-4" />} error={errors.customerEmail}>
          <input
            type="email"
            value={form.customerEmail}
            onChange={(e) => set("customerEmail", e.target.value)}
            placeholder="you@email.com"
            className={fieldInputClass}
          />
        </SearchField>
        <SearchField label="Phone" icon={<Phone className="size-4" />} error={errors.customerPhone}>
          <input
            type="tel"
            value={form.customerPhone}
            onChange={(e) => set("customerPhone", e.target.value)}
            placeholder="+1 555 000 0000"
            className={fieldInputClass}
          />
        </SearchField>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-brand-muted">
        <input
          type="checkbox"
          checked={form.acceptedTerms}
          onChange={(e) => set("acceptedTerms", e.target.checked)}
          className="mt-1 size-4 rounded accent-[#FF7A00]"
        />
        <span>
          I agree to be contacted about this rental request and accept the{" "}
          <a
            href="/terms-and-conditions"
            className="text-brand-accent underline-offset-2 hover:underline"
          >
            terms
          </a>
          .
          {errors.acceptedTerms ? (
            <span className="mt-1 block text-xs text-red-300">{errors.acceptedTerms}</span>
          ) : null}
        </span>
      </label>

      {errors.form ? (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {errors.form}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="group mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary px-6 py-4 text-base font-semibold text-white shadow-cta transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Searching…
          </>
        ) : (
          <>
            <Search className="size-5" />
            Search Cars
          </>
        )}
      </button>

      <p className="mt-3 flex items-center justify-center gap-2 text-xs text-brand-muted">
        <LockKeyhole className="size-3.5" />
        Secure submission · Best price guarantee
      </p>
    </form>
  );
}
