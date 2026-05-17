import type { CreateLeadInput } from "@/lib/leads/types";

export type SearchFormState = {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  driverAge: string;
  residency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  acceptedTerms: boolean;
};

export type SearchFormErrors = Partial<Record<keyof SearchFormState | "form", string>>;

export function toLeadInput(form: SearchFormState, sameLocation: boolean): CreateLeadInput {
  const pickup = `${form.pickupDate}T${form.pickupTime || "10:00"}:00`;
  const returns = `${form.returnDate}T${form.returnTime || "10:00"}:00`;

  return {
    pickup_location: form.pickupLocation.trim(),
    drop_location: (sameLocation ? form.pickupLocation : form.dropoffLocation).trim(),
    pickup_datetime: new Date(pickup).toISOString(),
    return_datetime: new Date(returns).toISOString(),
    customer_name: form.customerName.trim(),
    customer_email: form.customerEmail.toLowerCase().trim(),
    customer_phone: form.customerPhone.trim(),
  };
}

export function validateSearchForm(form: SearchFormState, sameLocation: boolean): SearchFormErrors {
  const errors: SearchFormErrors = {};

  if (!form.pickupLocation.trim()) errors.pickupLocation = "Pickup location is required.";
  if (!sameLocation && !form.dropoffLocation.trim()) {
    errors.dropoffLocation = "Return location is required.";
  }
  if (!form.pickupDate) errors.pickupDate = "Pickup date is required.";
  if (!form.returnDate) errors.returnDate = "Return date is required.";

  const pickup = form.pickupDate ? new Date(`${form.pickupDate}T${form.pickupTime || "10:00"}`) : null;
  const returns = form.returnDate ? new Date(`${form.returnDate}T${form.returnTime || "10:00"}`) : null;
  if (pickup && returns && returns <= pickup) {
    errors.returnDate = "Return must be after pickup.";
  }

  if (!form.customerName.trim()) errors.customerName = "Full name is required.";
  if (!/^\S+@\S+\.\S+$/.test(form.customerEmail.trim())) {
    errors.customerEmail = "Enter a valid email address.";
  }
  if (form.customerPhone.trim().replace(/\D/g, "").length < 7) {
    errors.customerPhone = "Enter a reachable phone number.";
  }
  if (!form.acceptedTerms) errors.acceptedTerms = "Please accept the terms to continue.";

  return errors;
}
