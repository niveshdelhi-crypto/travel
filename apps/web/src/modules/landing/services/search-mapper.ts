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

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time || "10:00"}:00`).toISOString();
}

export function toLeadInput(form: SearchFormState, sameLocation: boolean): CreateLeadInput {
  const dropLocation = (sameLocation ? form.pickupLocation : form.dropoffLocation).trim();

  return {
    pickup_location: form.pickupLocation.trim(),
    drop_location: dropLocation,
    pickup_datetime: combineDateTime(form.pickupDate, form.pickupTime),
    return_datetime: combineDateTime(form.returnDate, form.returnTime),
    customer_name: form.customerName.trim(),
    customer_email: form.customerEmail.toLowerCase().trim(),
    customer_phone: form.customerPhone.trim(),
    driver_age: form.driverAge,
    residency: form.residency,
  };
}

export function validateSearchForm(form: SearchFormState, sameLocation: boolean): SearchFormErrors {
  const errors: SearchFormErrors = {};

  if (!form.pickupLocation.trim()) errors.pickupLocation = "Pick-up location is required.";
  if (!form.dropoffLocation.trim() && !sameLocation) {
    errors.dropoffLocation = "Return location is required.";
  }
  if (sameLocation && !form.pickupLocation.trim()) {
    errors.dropoffLocation = "Pick-up location is required for return.";
  }
  if (!form.pickupDate) errors.pickupDate = "Pick-up date is required.";
  if (!form.returnDate) errors.returnDate = "Return date is required.";
  if (!form.pickupTime) errors.pickupTime = "Pick-up time is required.";
  if (!form.returnTime) errors.returnTime = "Return time is required.";

  const pickup = form.pickupDate
    ? new Date(`${form.pickupDate}T${form.pickupTime || "10:00"}`)
    : null;
  const returns = form.returnDate
    ? new Date(`${form.returnDate}T${form.returnTime || "10:00"}`)
    : null;
  if (pickup && returns && returns <= pickup) {
    errors.returnDate = "Return must be after pick-up.";
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
