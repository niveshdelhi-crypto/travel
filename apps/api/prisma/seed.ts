import {
  LeadStatus,
  MarketplaceDestinationKind,
  PaymentGatewayType,
  Prisma,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
import { createCipheriv, randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  direct_line?: string;
};

const seedUsers: SeedUser[] = [
  {
    name: "Book my Carz Admin",
    email: "admin@bookmycarz.com",
    password: "Admin@123",
    role: UserRole.admin,
  },
  {
    name: "Book my Carz Finance Admin",
    email: "finance@bookmycarz.com",
    password: "Finance@123",
    role: UserRole.finance_admin,
  },
  {
    name: "Book my Carz Operations Manager",
    email: "ops@bookmycarz.com",
    password: "Ops@123",
    role: UserRole.operations_manager,
  },
  ...Array.from({ length: 5 }, (_, index) => {
    const agentNumber = index + 1;

    return {
      name: `Book my Carz Agent ${agentNumber}`,
      email: `agent${agentNumber}@bookmycarz.com`,
      password: "Agent@123",
      role: UserRole.sales_agent,
      /** Telnyx inbound DID for agent 1 — matches smoke test / call-center verification */
      ...(agentNumber === 1 ? { direct_line: "+14155550199" } : {}),
    };
  }),
];

/** Pre-rebrand accounts — renamed on seed so existing DBs keep the same user ids where possible. */
const legacyUserEmailMap: { from: string; to: string }[] = [
  { from: "admin@fleetnexus.com", to: "admin@bookmycarz.com" },
  ...Array.from({ length: 5 }, (_, index) => ({
    from: `agent${index + 1}@fleetnexus.com`,
    to: `agent${index + 1}@bookmycarz.com`,
  })),
];

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  is_active: true,
  created_at: true,
} as const;

type SeededUser = {
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
};

async function buildSeedUsers() {
  return Promise.all(
    seedUsers.map(async (user) => ({
      ...user,
      email: normalizeEmail(user.email),
      password_hash: await bcrypt.hash(user.password, BCRYPT_ROUNDS),
    })),
  );
}

async function main() {
  assertUniqueEmails(seedUsers);

  await migrateLegacyUserEmails(prisma);

  const usersWithHashes = await buildSeedUsers();
  const seededUsers = await prisma.$transaction(
    async (tx) =>
      Promise.all(
        usersWithHashes.map((user) =>
          tx.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              role: user.role,
              is_active: true,
              password_hash: user.password_hash,
              direct_line: user.direct_line ?? null,
            },
            create: {
              name: user.name,
              email: user.email,
              password_hash: user.password_hash,
              role: user.role,
              is_active: true,
              direct_line: user.direct_line ?? null,
            },
            select: userSelect,
          }),
        ),
      ),
    { timeout: 120_000 },
  );

  printSeededUsers(seededUsers);
  await seedMarketplaceCatalog(prisma);
  await seedShowcasePipeline(prisma);
  await seedPaymentGateways(prisma);
}

/** Matches CredentialsCryptoService dev fallback when PAYMENT_CREDENTIALS_ENCRYPTION_KEY is unset. */
const DEV_PAYMENT_ENCRYPTION_KEY = scryptSync("fleetnexus-dev-payment-key", "salt", 32);

function encryptPaymentCredentials(plaintext: Record<string, string>): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", DEV_PAYMENT_ENCRYPTION_KEY, iv, {
    authTagLength: 16,
  });
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(plaintext), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

const demoPaymentGateways: Array<{
  name: string;
  type: PaymentGatewayType;
  credentials: Record<string, string>;
  settings?: Prisma.InputJsonValue;
}> = [
  {
    name: "Stripe Sandbox",
    type: PaymentGatewayType.stripe,
    credentials: { secret_key: "sk_test_replace_with_stripe_test_key" },
    settings: { mode: "sandbox", note: "Replace secret_key with your Stripe test key" },
  },
  {
    name: "PayPal Primary",
    type: PaymentGatewayType.paypal,
    credentials: {
      client_id: "sandbox-client-id",
      client_secret: "sandbox-client-secret",
      environment: "sandbox",
    },
    settings: { default_currency: "USD", note: "Replace with PayPal sandbox app credentials" },
  },
  {
    name: "Wise Sandbox",
    type: PaymentGatewayType.wise,
    credentials: {
      api_token: "sandbox-api-token",
      profile_id: "0",
    },
    settings: { mode: "sandbox", note: "Replace with Wise API token and profile id" },
  },
];

async function seedPaymentGateways(client: PrismaClient) {
  for (const gateway of demoPaymentGateways) {
    await client.paymentGateway.upsert({
      where: {
        type_name: { type: gateway.type, name: gateway.name },
      },
      update: {
        is_active: true,
        encrypted_credentials: encryptPaymentCredentials(gateway.credentials),
        settings: gateway.settings,
      },
      create: {
        name: gateway.name,
        type: gateway.type,
        is_active: true,
        encrypted_credentials: encryptPaymentCredentials(gateway.credentials),
        settings: gateway.settings,
      },
    });
  }

  const count = await client.paymentGateway.count();
  console.log(`Payment gateways seeded (${count} total). Update credentials in Admin → Payments or via API.\n`);
}

async function migrateLegacyUserEmails(client: Pick<PrismaClient, "user">) {
  for (const { from, to } of legacyUserEmailMap) {
    const legacyEmail = normalizeEmail(from);
    const nextEmail = normalizeEmail(to);
    const legacyUser = await client.user.findUnique({ where: { email: legacyEmail } });
    if (!legacyUser) continue;

    const targetTaken = await client.user.findUnique({ where: { email: nextEmail } });
    if (targetTaken && targetTaken.id !== legacyUser.id) {
      await client.user.delete({ where: { id: legacyUser.id } });
      continue;
    }

    await client.user.update({
      where: { id: legacyUser.id },
      data: { email: nextEmail },
    });
  }
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function assertUniqueEmails(users: SeedUser[]) {
  const emails = users.map((user) => normalizeEmail(user.email));
  const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);

  if (duplicates.length) {
    throw new Error(
      `Duplicate seed user emails found: ${Array.from(new Set(duplicates)).join(", ")}`,
    );
  }
}

function printSeededUsers(users: SeededUser[]) {
  console.log("\nBook my Carz seed complete. Users ready:\n");
  console.table(
    users.map((user) => ({
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.is_active,
      created_at: user.created_at.toISOString(),
    })),
  );
}

async function seedMarketplaceCatalog(client: PrismaClient) {
  const countries = [
    {
      slug: "usa",
      name: "United States",
      iso_code: "US",
      headline: "Concierge-assisted airport corridors and interstate business hubs.",
      destinations: [
        {
          kind: MarketplaceDestinationKind.AIRPORT,
          slug: "los-angeles-lax",
          name: "Los Angeles International Airport (LAX)",
          subtitle: "Priority arrival coordination across Terminals B and international gates.",
          iata_code: "LAX",
          trend_score: 98,
          seo_title: "Premium car rental near LAX | Book my Carz",
          seo_description:
            "Assisted concierge matching for arrivals at Los Angeles International with verified rental partners.",
        },
        {
          kind: MarketplaceDestinationKind.AIRPORT,
          slug: "new-york-jfk",
          name: "John F. Kennedy International Airport",
          subtitle: "Terminal-aware pickup planning for transatlantic and domestic arrivals.",
          iata_code: "JFK",
          trend_score: 96,
          seo_title: "Premium car rental near JFK | Book my Carz",
          seo_description:
            "Concierge desk support for JFK arrivals with premium vehicle classes and partner verification.",
        },
        {
          kind: MarketplaceDestinationKind.CITY,
          slug: "miami",
          name: "Miami",
          subtitle: "Coastal executive travel, Art Basel season, and family resort routing.",
          iata_code: null,
          trend_score: 90,
          seo_title: "Luxury car rental assistance in Miami | Book my Carz",
          seo_description:
            "Route-aware premium rental matching for Miami beach corridors, downtown, and port arrivals.",
        },
        {
          kind: MarketplaceDestinationKind.CITY,
          slug: "san-francisco",
          name: "San Francisco",
          subtitle: "Hills, tech campuses, and SFO linkage with escalation paths.",
          iata_code: null,
          trend_score: 88,
          seo_title: "Executive rentals in San Francisco | Book my Carz",
          seo_description:
            "Assisted booking coordination across San Francisco, Silicon Valley arrivals, and SFO corridors.",
        },
      ],
    },
    {
      slug: "canada",
      name: "Canada",
      iso_code: "CA",
      headline: "Cross-border itineraries with bilingual concierge coverage.",
      destinations: [
        {
          kind: MarketplaceDestinationKind.AIRPORT,
          slug: "toronto-yyz",
          name: "Toronto Pearson International Airport",
          subtitle: "High-volume arrivals with baggage and terminal timing modeled into pickup.",
          iata_code: "YYZ",
          trend_score: 94,
          seo_title: "Premium car rental at Toronto Pearson YYZ | Book my Carz",
          seo_description:
            "Concierge-assisted premium rentals for Toronto Pearson arrivals and downtown handoffs.",
        },
        {
          kind: MarketplaceDestinationKind.CITY,
          slug: "vancouver",
          name: "Vancouver",
          subtitle: "Mountain routes, cruise links, and Pacific business travel.",
          iata_code: null,
          trend_score: 86,
          seo_title: "Luxury rental assistance in Vancouver | Book my Carz",
          seo_description:
            "Premium vehicle coordination for Vancouver city, YVR airport, and Whistler corridor trips.",
        },
      ],
    },
    {
      slug: "united-kingdom",
      name: "United Kingdom",
      iso_code: "GB",
      headline: "Heathrow-grade precision with GBP-ready supplier orchestration.",
      destinations: [
        {
          kind: MarketplaceDestinationKind.AIRPORT,
          slug: "london-lhr",
          name: "London Heathrow Airport",
          subtitle: "Long-haul arrivals, terminal swaps, and West End transfers.",
          iata_code: "LHR",
          trend_score: 92,
          seo_title: "Premium car rental at London Heathrow | Book my Carz",
          seo_description:
            "Concierge-style rental matching for London Heathrow arrivals and central London itineraries.",
        },
      ],
    },
    {
      slug: "united-arab-emirates",
      name: "United Arab Emirates",
      iso_code: "AE",
      headline: "Desert metropolis arrivals with chauffeur-grade expectations.",
      destinations: [
        {
          kind: MarketplaceDestinationKind.CITY,
          slug: "dubai",
          name: "Dubai",
          subtitle: "DXB arrivals, marina districts, and executive weekend routing.",
          iata_code: null,
          trend_score: 99,
          seo_title: "Premium rental concierge in Dubai | Book my Carz",
          seo_description:
            "Verified partner coordination for Dubai arrivals with luxury SUV and chauffeur-style handoffs.",
        },
      ],
    },
  ];

  /** Brand SVGs served from apps/web and CRM `public/suppliers/`. */
  const supplierLogo = (slug: string) => `/suppliers/${slug}.svg`;

  const suppliers = [
    {
      slug: "hertz",
      name: "Hertz",
      website_url: "https://www.hertz.com",
      logo_url: supplierLogo("hertz"),
      sort_order: 10,
    },
    {
      slug: "enterprise",
      name: "Enterprise Rent-A-Car",
      website_url: "https://www.enterprise.com",
      logo_url: supplierLogo("enterprise"),
      sort_order: 20,
    },
    {
      slug: "avis",
      name: "Avis",
      website_url: "https://www.avis.com",
      logo_url: supplierLogo("avis"),
      sort_order: 30,
    },
    {
      slug: "sixt",
      name: "SIXT",
      website_url: "https://www.sixt.com",
      logo_url: supplierLogo("sixt"),
      sort_order: 40,
    },
    {
      slug: "national",
      name: "National Car Rental",
      website_url: "https://www.nationalcar.com",
      logo_url: supplierLogo("national"),
      sort_order: 50,
    },
    {
      slug: "europcar",
      name: "Europcar",
      website_url: "https://www.europcar.com",
      logo_url: supplierLogo("europcar"),
      sort_order: 60,
    },
  ];

  const testimonials = [
    {
      quote:
        "The desk turned a messy arrival window into a single plan. I knew what vehicle class to expect before I touched baggage claim.",
      author_display: "Editorial profile · Frequent transatlantic traveler",
      meta_line: "Curated perspective · London ↔ New York corridor",
      rating: 5,
      sort_order: 10,
    },
    {
      quote:
        "What sold me was transparency: no mystery fees on the form, and a human followed up with clear next steps.",
      author_display: "Editorial profile · Family multi-city route",
      meta_line: "Curated perspective · USA West Coast",
      rating: 5,
      sort_order: 20,
    },
    {
      quote:
        "This felt closer to a travel desk than a comparison grid. The advisor language was precise and calm under time pressure.",
      author_display: "Editorial profile · Executive roadshow",
      meta_line: "Curated perspective · North America",
      rating: 5,
      sort_order: 30,
    },
  ];

  for (const supplier of suppliers) {
    await client.marketplaceSupplier.upsert({
      where: { slug: supplier.slug },
      update: {
        name: supplier.name,
        website_url: supplier.website_url,
        logo_url: supplier.logo_url,
        sort_order: supplier.sort_order,
      },
      create: {
        name: supplier.name,
        slug: supplier.slug,
        website_url: supplier.website_url,
        logo_url: supplier.logo_url,
        sort_order: supplier.sort_order,
      },
    });
  }

  for (const country of countries) {
    const createdCountry = await client.marketplaceCountry.upsert({
      where: { slug: country.slug },
      update: {
        name: country.name,
        iso_code: country.iso_code,
        headline: country.headline,
      },
      create: {
        slug: country.slug,
        name: country.name,
        iso_code: country.iso_code,
        headline: country.headline,
      },
    });

    for (const destination of country.destinations) {
      await client.marketplaceDestination.upsert({
        where: { slug_kind: { slug: destination.slug, kind: destination.kind } },
        update: {
          name: destination.name,
          subtitle: destination.subtitle,
          iata_code: destination.iata_code,
          trend_score: destination.trend_score,
          seo_title: destination.seo_title,
          seo_description: destination.seo_description,
          country_id: createdCountry.id,
        },
        create: {
          slug: destination.slug,
          kind: destination.kind,
          name: destination.name,
          subtitle: destination.subtitle,
          iata_code: destination.iata_code,
          trend_score: destination.trend_score,
          seo_title: destination.seo_title,
          seo_description: destination.seo_description,
          country_id: createdCountry.id,
        },
      });
    }
  }

  for (const story of testimonials) {
    await client.marketplaceTestimonial.upsert({
      where: { seed_key: `seed-editorial-${story.sort_order}` },
      update: {
        quote: story.quote,
        author_display: story.author_display,
        meta_line: story.meta_line,
        rating: story.rating,
        is_editorial: true,
        sort_order: story.sort_order,
      },
      create: {
        seed_key: `seed-editorial-${story.sort_order}`,
        quote: story.quote,
        author_display: story.author_display,
        meta_line: story.meta_line,
        rating: story.rating,
        is_editorial: true,
        sort_order: story.sort_order,
      },
    });
  }

  console.log("\nMarketplace catalog seeded (countries, destinations, suppliers, editorial stories).\n");
}

/**
 * Demo leads so `/marketplace/trust-snapshot` and CRM demos show non-zero, realistic posture.
 * Removed and recreated on each seed via deterministic customer_email prefix.
 */
async function seedShowcasePipeline(client: PrismaClient) {
  const agent = await client.user.findFirst({
    where: { email: normalizeEmail("agent1@bookmycarz.com") },
  });

  if (!agent) {
    console.warn("Showcase leads skipped — agent1@bookmycarz.com not found.");
    return;
  }

  await client.lead.deleteMany({
    where: { customer_email: { startsWith: "showcase-demo-" } },
  });

  const pickups = [
    "Los Angeles International Airport (LAX), CA",
    "John F. Kennedy International Airport, NY",
    "Toronto Pearson International Airport, ON",
    "Miami International Airport, FL",
    "San Francisco International Airport, CA",
    "London Heathrow Airport (LHR), UK",
    "Dubai International Airport (DXB), UAE",
    "Vancouver International Airport, BC",
  ];

  const statuses: LeadStatus[] = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.NEGOTIATING,
    LeadStatus.CONFIRMED,
    LeadStatus.COMPLETED,
  ];

  const now = Date.now();
  const rows = Array.from({ length: 24 }, (_, index) => {
    const createdAt = new Date(now - (index + 1) * 2 * 60 * 60 * 1000);
    const outreachMinutes = 6 + (index % 11);
    const lastContacted =
      index % 5 === 0 ? null : new Date(createdAt.getTime() + outreachMinutes * 60 * 1000);

    return {
      pickup_location: pickups[index % pickups.length],
      drop_location:
        index % 3 === 0 ? "Financial district / hotel cluster" : "Convention corridor / resort zone",
      pickup_datetime: new Date(createdAt.getTime() + 36 * 60 * 60 * 1000),
      return_datetime: new Date(createdAt.getTime() + 96 * 60 * 60 * 1000),
      customer_name: `Demo itinerary ${index + 1}`,
      customer_email: `showcase-demo-${String(index + 1).padStart(2, "0")}@fleetnexus.demo`,
      customer_phone: "+14155550100",
      status: statuses[index % statuses.length],
      assigned_to: agent.id,
      last_contacted_at: lastContacted,
      created_at: createdAt,
    };
  });

  await client.lead.createMany({ data: rows });

  const agents = await client.user.findMany({
    where: { role: UserRole.sales_agent },
    select: { id: true },
  });

  await Promise.all(
    agents.map(async (a) => {
      const count = await client.lead.count({ where: { assigned_to: a.id } });
      return client.user.update({
        where: { id: a.id },
        data: { current_lead_count: count },
      });
    }),
  );

  console.log(`Showcase pipeline seeded with ${rows.length} demo leads assigned to operations.\n`);
}

main()
  .catch((error) => {
    console.error("Prisma seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
