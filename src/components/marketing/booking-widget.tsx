import { useMutation } from "@tanstack/react-query";
import { Controller, type UseFormRegisterReturn, useForm } from "react-hook-form";
import type { ComponentType, InputHTMLAttributes, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";

import "react-datepicker/dist/react-datepicker.css";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leadsService, type PublicLeadInput, type PublicLeadResponse } from "@/services";
import type { ApiError } from "@/types";

type LeadFormValues = {
  pickupLocation: string;
  dropLocation: string;
  pickupDateTime: Date | null;
  returnDateTime: Date | null;
  fullName: string;
  email: string;
  countryCode:
    | "US +1"
    | "CA +1"
    | "GB +44"
    | "AE +971"
    | "DE +49"
    | "FR +33";
  phone: string;
  terms: boolean;
};

type GoogleAutocomplete = {
  addListener: (eventName: string, callback: () => void) => void;
  getPlace: () => { formatted_address?: string; name?: string };
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: Record<string, unknown>,
          ) => GoogleAutocomplete;
        };
      };
    };
  }
}

export function BookingWidget({ locationHints = [] }: { locationHints?: string[] }) {
  const [createdLead, setCreatedLead] = useState<PublicLeadResponse | null>(null);
  const lastPayloadRef = useRef<LeadFormValues | null>(null);
  const {
    control,
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    mode: "onTouched",
    defaultValues: {
      pickupLocation: "",
      dropLocation: "",
      pickupDateTime: null,
      returnDateTime: null,
      fullName: "",
      email: "",
      countryCode: "US +1",
      phone: "",
      terms: false,
    },
  });

  const leadMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      const payload = toPublicLeadInput(values);
      const idempotencyKey = createIdempotencyKey();
      lastPayloadRef.current = values;

      console.debug("[FleetNexus BookingWidget] submitting public lead", {
        endpoint: "/api/leads/public",
        idempotencyKey,
        payload,
      });

      return leadsService.createPublic(payload, idempotencyKey, { timeout: 45_000 });
    },
    retry: (failureCount, error) =>
      failureCount < 2 && shouldRetrySubmissionError(error),
    retryDelay: (failureCount) => 400 * (failureCount + 1),
    onSuccess: (response) => {
      console.info("[FleetNexus BookingWidget] public lead created", response);
      setCreatedLead(response);
      reset();
      lastPayloadRef.current = null;
    },
    onError: (error) => {
      const message = getLeadSubmissionErrorMessage(error);
      console.error("[FleetNexus BookingWidget] public lead submission failed", error);
      setError("root", { type: "server", message });
    },
  });

  const onSubmit = async (values: LeadFormValues) => {
    setCreatedLead(null);
    clearErrors("root");
    lastPayloadRef.current = values;
    try {
      await leadMutation.mutateAsync(values);
    } catch {
      // Mutation onError attaches field-level root error handling.
    }
  };

  if (createdLead) {
    return (
      <motion.div
        id="lead-form"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-[#0F172A]/90 p-6 shadow-[0_50px_120px_-52px_rgba(0,0,0,.85)] backdrop-blur-xl"
        role="status"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-40 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,179,1,0.12),transparent_72%)]" />
        <div className="relative">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-emerald-300 to-teal-500 text-[#07111F] shadow-lg">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
            Request anchored in queue
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#F8FAFC]/72">
            A concierge specialist may reach out shortly. Reference ID{" "}
            <span className="font-mono text-[#F5B301]">{createdLead.leadId}</span>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setCreatedLead(null)}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-[#F5B301] via-[#F5D565] to-[#F59E0B] px-5 text-sm font-bold text-[#07111F] shadow-[0_24px_64px_-32px_rgba(245,179,1,.75)] transition hover:brightness-[1.03]"
            >
              Start another itinerary
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const showRetry =
    !!errors.root?.message &&
    lastPayloadRef.current &&
    !leadMutation.isPending;

  return (
    <motion.form
      id="lead-form"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      onSubmit={handleSubmit(onSubmit)}
      className="relative overflow-hidden rounded-2xl border border-white/14 bg-[#0F172A]/92 p-6 shadow-[0_50px_120px_-54px_rgba(0,0,0,.9)] backdrop-blur-xl sm:p-8"
    >
      <div className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_68%)]" />
      <div className="pointer-events-none absolute -left-28 bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,179,1,0.12),transparent_65%)]" />

      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F5B301] via-[#3B82F6] to-emerald-400/90" />
      <header className="relative border-b border-white/12 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F5B301]/90">
          Concierge match
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC] md:text-[1.65rem]">
          Lock in a verified premium corridor
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#F8FAFC]/62">
          This request binds to FleetNexus operations in real-time. Specialists compare partner fit across
          your timing, route, and comfort expectations.
        </p>
      </header>

      <div className="relative mt-6 grid gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5">
        <PlaceField
          locationHints={locationHints}
          label="Pickup location"
          icon={MapPin}
          placeholder="Hotel, terminal, or airport"
          error={errors.pickupLocation?.message}
          registration={register("pickupLocation", { required: "Pickup location is required" })}
          onPlaceSelect={(value) => setValue("pickupLocation", value, { shouldValidate: true })}
        />
        <PlaceField
          locationHints={locationHints}
          label="Drop location"
          icon={MapPin}
          placeholder="Same as pickup or drop city"
          error={errors.dropLocation?.message}
          registration={register("dropLocation", { required: "Drop location is required" })}
          onPlaceSelect={(value) => setValue("dropLocation", value, { shouldValidate: true })}
        />
        <Controller
          control={control}
          name="pickupDateTime"
          rules={{ required: "Pickup date and time is required" }}
          render={({ field }) => (
            <DateTimeField
              label="Pickup"
              icon={CalendarClock}
              selected={field.value}
              onChange={field.onChange}
              error={errors.pickupDateTime?.message}
              minDate={new Date()}
            />
          )}
        />
        <Controller
          control={control}
          name="returnDateTime"
          rules={{
            required: "Return date and time is required",
            validate: (value, formValues) => {
              if (!value || !formValues.pickupDateTime) return true;
              return value > formValues.pickupDateTime || "Return time must be after pickup time";
            },
          }}
          render={({ field }) => (
            <DateTimeField
              label="Return"
              icon={CalendarClock}
              selected={field.value}
              onChange={field.onChange}
              error={errors.returnDateTime?.message}
              minDate={new Date()}
            />
          )}
        />
        <TextField
          label="Full legal name"
          icon={UserRound}
          placeholder="Legal name (as on ID)"
          error={errors.fullName?.message}
          {...register("fullName", {
            required: "Full name is required",
            minLength: { value: 2, message: "Enter your full name" },
          })}
        />
        <TextField
          label="Email address"
          icon={Mail}
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register("email", {
            required: "Email address is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address",
            },
          })}
        />
        <div className="sm:col-span-2">
          <PhoneField control={control} register={register} error={errors.phone?.message} />
        </div>
      </div>

      <footer className="relative mt-5 border-t border-white/12 pt-4">
        <Controller
          control={control}
          name="terms"
          rules={{
            validate: (value) => value || "Please accept FleetNexus contact terms",
          }}
          render={({ field }) => (
            <div>
              <label className="flex items-start gap-3 text-sm leading-relaxed text-[#F8FAFC]/70">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-1 h-5 w-5 rounded-md border-white/28 bg-[#07111F]/60 data-[state=checked]:border-[#F5B301]"
                />
                <span>
                  I authorize FleetNexus to contact me about this rental corridor and acknowledge the{" "}
                  <a className="text-[#60A5FA] underline underline-offset-2" href="/privacy-policy">
                    privacy policy
                  </a>
                  .
                </span>
              </label>
              {errors.terms?.message ? (
                <p className="mt-2 text-xs font-semibold text-rose-200">{errors.terms.message}</p>
              ) : null}
            </div>
          )}
        />

        <div className="mt-6 flex flex-col gap-4 sm:mt-7">
          <button
            type="submit"
            disabled={isSubmitting || leadMutation.isPending}
            className="relative flex w-full min-h-[52px] items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#F5B301] via-[#fcd34d] to-[#eab308] px-6 py-3.5 text-center text-sm font-bold leading-snug text-[#07111F] shadow-[0_34px_80px_-40px_rgba(245,179,1,.9)] transition enabled:hover:brightness-[1.02] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {(leadMutation.isPending || isSubmitting) && (
              <span className="absolute inset-x-8 top-1 h-[2px] animate-pulse rounded-full bg-[#07111F]/18" />
            )}
            {(isSubmitting || leadMutation.isPending) && (
              <Loader2 className="relative h-4 w-4 shrink-0 animate-spin" aria-hidden />
            )}
            <span className="relative">
              {(isSubmitting || leadMutation.isPending) ? "Submitting concierge request…" : "Dispatch to operations"}
            </span>
            {(isSubmitting || leadMutation.isPending) === false ? (
              <Search className="relative h-4 w-4 shrink-0" aria-hidden />
            ) : null}
          </button>
          <div className="flex items-start justify-center gap-2 text-center text-[11px] leading-relaxed text-[#F8FAFC]/55 sm:items-center sm:justify-between sm:text-left">
            <LockKeyhole className="mx-auto h-3.5 w-3.5 shrink-0 text-[#F5B301] sm:mx-0" />
            <span className="max-w-xl sm:flex-1">
              Banking-grade HTTPS · No upfront charge for matchmaking
            </span>
          </div>
        </div>

        {showRetry ? (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="text-xs font-semibold text-[#60A5FA] underline underline-offset-2"
              onClick={() => {
                clearErrors("root");
                if (lastPayloadRef.current)
                  void leadMutation.mutateAsync(lastPayloadRef.current);
              }}
            >
              Retry submission
            </button>
          </div>
        ) : null}

        {errors.root?.message ? (
          <div
            className="relative mt-4 flex items-start gap-3 rounded-xl border border-rose-400/25 bg-rose-500/14 px-4 py-3 text-sm text-[#fde8e8]"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-200" />
            <div>
              <p className="font-semibold text-[#fca5a5]">Operational API pause</p>
              <p className="mt-1 leading-snug text-rose-100/88">{errors.root.message}</p>
            </div>
          </div>
        ) : null}
      </footer>
    </motion.form>
  );
}

function shouldRetrySubmissionError(error: unknown) {
  const status = (error as Partial<ApiError>)?.status;
  return status !== 400 && status !== 403 && status !== 404 && status !== 409;
}

function PlaceField({
  label,
  icon,
  placeholder,
  error,
  registration,
  onPlaceSelect,
  locationHints,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  placeholder: string;
  error?: string;
  registration: UseFormRegisterReturn;
  onPlaceSelect: (value: string) => void;
  locationHints: string[];
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { ref, ...rest } = registration;

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places?.Autocomplete) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "name"],
      types: ["geocode", "establishment"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const value = place.formatted_address || place.name || inputRef.current?.value || "";
      onPlaceSelect(value);
    });
  }, [onPlaceSelect]);

  return (
    <FieldGroup icon={icon} label={label} error={error}>
      <input
        {...rest}
        ref={(node) => {
          ref(node);
          inputRef.current = node;
        }}
        list={locationHints.length ? id : undefined}
        placeholder={placeholder}
        autoComplete="off"
        data-lpignore="true"
        className={inputClass(error)}
      />
      {locationHints.length ? (
        <datalist id={id}>
          {locationHints.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      ) : null}
    </FieldGroup>
  );
}

function TextField({
  label,
  icon,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ComponentType<{ className?: string }>;
  error?: string;
}) {
  return (
    <FieldGroup icon={icon} label={label} error={error}>
      <input {...props} className={inputClass(error)} />
    </FieldGroup>
  );
}

function DateTimeField({
  label,
  icon,
  selected,
  onChange,
  error,
  minDate,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  minDate: Date;
}) {
  return (
    <FieldGroup icon={icon} label={label} error={error}>
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect
        minDate={minDate}
        timeIntervals={15}
        dateFormat="MMM d, yyyy h:mm aa"
        placeholderText="Select date and time"
        wrapperClassName="w-full"
        popperClassName="fleet-datepicker-popper"
        className={inputClass(error)}
      />
    </FieldGroup>
  );
}

function PhoneField({
  control,
  register,
  error,
}: {
  control: ReturnType<typeof useForm<LeadFormValues>>["control"];
  register: ReturnType<typeof useForm<LeadFormValues>>["register"];
  error?: string;
}) {
  return (
    <FieldGroup icon={Phone} label="Phone number" error={error}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(136px,200px)_minmax(0,1fr)] sm:items-stretch sm:gap-3">
        <Controller
          control={control}
          name="countryCode"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-11 w-full min-w-0 shrink-0 rounded-lg border-0 bg-[#0c1829] text-[14px] text-[#F8FAFC] shadow-none ring-1 ring-white/10 focus:ring-[#F5B301]/50">
                <SelectValue placeholder="Dial code" />
              </SelectTrigger>
              <SelectContent className="border-white/14 bg-[#0F172A] text-[#F8FAFC]">
                <SelectItem value="US +1">US +1</SelectItem>
                <SelectItem value="CA +1">Canada +1</SelectItem>
                <SelectItem value="GB +44">UK +44</SelectItem>
                <SelectItem value="AE +971">UAE +971</SelectItem>
                <SelectItem value="DE +49">Germany +49</SelectItem>
                <SelectItem value="FR +33">France +33</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <input
          type="tel"
          inputMode="tel"
          placeholder="Including area code"
          className={`${inputClass(error)} min-w-0 flex-1`}
          {...register("phone", {
            required: "Phone number is required",
            validate: (value) =>
              value.replace(/\D/g, "").length >= 8 || "Enter a valid international-ready number",
          })}
        />
      </div>
    </FieldGroup>
  );
}

/** Label + bordered control area — avoids cramped “label inside box” affordances. */
function FieldGroup({
  icon: Icon,
  label,
  error,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-2.5">
        <Icon className={`h-4 w-4 shrink-0 ${error ? "text-rose-300" : "text-[#F5B301]"}`} />
        <span className="text-[13px] font-medium text-[#E8EDF4]">{label}</span>
      </div>
      <div
        className={`rounded-xl border px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] transition focus-within:border-[#F5B301]/55 focus-within:shadow-[0_0_0_2px_rgba(245,179,1,0.2)] ${
          error ? "border-rose-400/45 bg-rose-950/20" : "border-white/[0.18] bg-[#050d18]/90"
        }`}
      >
        {children}
      </div>
      {error ? <p className="mt-2 text-[12px] font-medium text-rose-300">{error}</p> : null}
    </div>
  );
}

function inputClass(error?: string) {
  return `fleet-field-input w-full min-h-[44px] border-0 bg-transparent py-1 text-[15px] leading-snug text-[#F8FAFC] outline-none placeholder:text-slate-500 ${
    error ? "text-rose-200" : ""
  }`;
}

function toPublicLeadInput(values: LeadFormValues): PublicLeadInput {
  return {
    pickup_location: values.pickupLocation.trim(),
    drop_location: values.dropLocation.trim(),
    pickup_datetime: values.pickupDateTime?.toISOString() ?? "",
    return_datetime: values.returnDateTime?.toISOString() ?? "",
    customer_name: values.fullName.trim(),
    customer_email: values.email.trim().toLowerCase(),
    customer_phone: `${values.countryCode} ${values.phone}`.trim(),
  };
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `booking-${crypto.randomUUID()}`;
  }

  return `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getLeadSubmissionErrorMessage(error: unknown) {
  const apiError = error as Partial<ApiError>;
  if (apiError.status === 408) {
    return "The operations API exceeded its response window—please retry in a minute.";
  }

  if (apiError.status === 503) {
    return "The database powering assignments is degraded. Operators have been signaled.";
  }

  if (typeof apiError.message === "string" && apiError.message.trim()) {
    return apiError.message;
  }

  if (error instanceof Error && error.message.trim()) return error.message;
  return "Unable to synchronize this request across suppliers. Retry momentarily.";
}
