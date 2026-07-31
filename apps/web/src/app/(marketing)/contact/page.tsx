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
    <a
      href={telHref!}
      className="font-medium text-foreground hover:text-brand-primary"
    >
      {phoneLabel}
    </a>
  </li>

  <li className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4">
    <MapPin className="mt-1 size-5 text-brand-primary" />
    <address className="not-italic font-medium leading-relaxed text-foreground">
      30 N Gould St Ste R
      <br />
      Sheridan, WY 82801
      <br />
      United States
    </address>
  </li>
</ul>
