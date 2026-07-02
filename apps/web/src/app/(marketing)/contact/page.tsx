import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { DIRECT_CALL_PHONE_NUMBER } from "@/modules/landing/lib/constants";
import { formatDirectCallLabel, getDirectCallTelHref } from "@/modules/landing/lib/direct-call";

export const metadata: Metadata = {
  title: "Contact MarkleTravelBooking",
  description: "Get in touch with MarkleTravelBooking customer support.",
};

export default function ContactPage() {
  const telHref = getDirectCallTelHref(DIRECT_CALL_PHONE_NUMBER);
  const phoneLabel = formatDirectCallLabel(DIRECT_CALL_PHONE_NUMBER);

  return (
    <article className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Contact us</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Our support team is available 24/7. For the fastest response on an active booking, include
        your reference number.
      </p>
      <ul className="mt-8 space-y-4">
        <li className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
          <Mail className="size-5 text-brand-primary" />
          <a
            href="mailto:support@markletravelbooking.com"
            className="font-medium text-foreground hover:text-brand-primary"
          >
            support@markletravelbooking.com
          </a>
        </li>
        <li className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
          <Phone className="size-5 text-brand-primary" />
          <a href={telHref!} className="font-medium text-foreground hover:text-brand-primary">
            {phoneLabel}
          </a>
        </li>
      <li className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4">
  <MapPin className="mt-1 size-5 text-brand-primary" />
  <address className="not-italic font-medium text-foreground leading-relaxed">
    30 N Gould St Ste R
    <br />
    SHERIDAN COUNTY
    <br />
    SHERIDAN, WYOMING 82801
  </address>
</li>
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">
        Ready to compare rates?{" "}
        <Link href="/#search" className="font-semibold text-brand-primary hover:underline">
          Start your search
        </Link>
        .
      </p>
    </article>
  );
}
