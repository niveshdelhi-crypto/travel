import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact FleetNexus",
  description: "Get in touch with FleetNexus customer support.",
};

export default function ContactPage() {
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
            href="mailto:support@fleetnexus.com"
            className="font-medium text-foreground hover:text-brand-primary"
          >
            support@fleetnexus.com
          </a>
        </li>
        <li className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
          <Phone className="size-5 text-brand-primary" />
          <span className="font-medium text-foreground">+1 (800) 555-0142</span>
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
