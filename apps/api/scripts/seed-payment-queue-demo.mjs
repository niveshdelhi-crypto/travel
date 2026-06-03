/**
 * Seeds demo leads + bookings for payment/checkout testing.
 * Idempotent: removes prior rows with customer_email prefix payment-demo-.
 *
 * Usage: node scripts/seed-payment-queue-demo.mjs
 */
import { randomUUID } from "crypto";
import {
  BookingLifecycleStatus,
  BookingStatus,
  LeadStatus,
  PaymentGatewayType,
  PaymentSessionStatus,
  PaymentStatus,
  Prisma,
  PrismaClient,
  UserRole,
} from "@prisma/client";

const DEMO_PREFIX = "payment-demo-";
const SESSION_TTL_HOURS = 24;

const demoBookings = [
  {
    customer_name: "Sarah Mitchell",
    pickup: "Los Angeles International Airport (LAX), CA",
    drop: "Downtown Los Angeles / hotel district",
    amount: 289.99,
    notes: "Mid-size SUV · 3-day rental · PayPal checkout test",
  },
  {
    customer_name: "James Chen",
    pickup: "John F. Kennedy International Airport, NY",
    drop: "Manhattan financial district",
    amount: 175.5,
    notes: "Economy sedan · weekend rental",
  },
  {
    customer_name: "Maria Garcia",
    pickup: "Miami International Airport, FL",
    drop: "South Beach resort corridor",
    amount: 412.0,
    notes: "Convertible · 5-day vacation rental",
  },
  {
    customer_name: "David Thompson",
    pickup: "San Francisco International Airport (SFO), CA",
    drop: "Silicon Valley / Palo Alto",
    amount: 356.25,
    notes: "Premium sedan · business travel",
  },
];

async function main() {
  const prisma = new PrismaClient();

  try {
    const [admin, agent, paypalGateway] = await Promise.all([
      prisma.user.findFirst({
        where: { email: "admin@markletravelbooking.com", role: UserRole.admin },
        select: { id: true, name: true },
      }),
      prisma.user.findFirst({
        where: { email: "agent1@markletravelbooking.com", role: UserRole.sales_agent },
        select: { id: true, name: true },
      }),
      prisma.paymentGateway.findFirst({
        where: { type: PaymentGatewayType.paypal, is_active: true },
        select: { id: true, name: true },
        orderBy: { created_at: "asc" },
      }),
    ]);

    if (!admin) throw new Error("admin@markletravelbooking.com not found — run prisma db seed first");
    if (!agent) throw new Error("agent1@markletravelbooking.com not found — run prisma db seed first");
    if (!paypalGateway) {
      throw new Error("No active PayPal gateway — run npm run sync:paypal-credentials first");
    }

    await prisma.lead.deleteMany({
      where: { customer_email: { startsWith: DEMO_PREFIX } },
    });

    const now = Date.now();
    const expiresAt = new Date(now + SESSION_TTL_HOURS * 60 * 60 * 1000);
    const created = [];

    for (const [index, demo] of demoBookings.entries()) {
      const createdAt = new Date(now - (index + 1) * 45 * 60 * 1000);
      const pickupDatetime = new Date(now + (index + 2) * 24 * 60 * 60 * 1000);
      const returnDatetime = new Date(pickupDatetime.getTime() + 72 * 60 * 60 * 1000);
      const email = `${DEMO_PREFIX}${String(index + 1).padStart(2, "0")}@fleetnexus.demo`;
      const idempotencyKey = `payment-demo-booking-${index + 1}`;

      const result = await prisma.$transaction(async (tx) => {
        const lead = await tx.lead.create({
          data: {
            pickup_location: demo.pickup,
            drop_location: demo.drop,
            pickup_datetime: pickupDatetime,
            return_datetime: returnDatetime,
            customer_name: demo.customer_name,
            customer_email: email,
            customer_phone: "+14155550200",
            status: LeadStatus.NEGOTIATING,
            assigned_to: agent.id,
            booking_value: new Prisma.Decimal(demo.amount),
            created_at: createdAt,
          },
        });

        const booking = await tx.booking.create({
          data: {
            lead_id: lead.id,
            gross_revenue: new Prisma.Decimal(demo.amount),
            currency: "USD",
            status: BookingStatus.PAYMENT_PENDING,
            lifecycle_status: BookingLifecycleStatus.PAYMENT_PENDING,
            notes: demo.notes,
            partner_name: "PayPal sandbox demo",
            idempotency_key: idempotencyKey,
            recorded_by: agent.id,
            created_at: createdAt,
          },
        });

        const paymentRequest = await tx.bookingPaymentRequest.create({
          data: {
            booking_id: booking.id,
            gateway_id: paypalGateway.id,
            status: PaymentStatus.PENDING,
            amount: new Prisma.Decimal(demo.amount),
            currency: "USD",
            description: `Collect payment — ${demo.customer_name}`,
            idempotency_key: `pay-req-${idempotencyKey}`,
            requested_by: agent.id,
            created_at: createdAt,
          },
        });

        const paymentSession = await tx.paymentSession.create({
          data: {
            lead_id: lead.id,
            booking_id: booking.id,
            amount: new Prisma.Decimal(demo.amount),
            currency: "USD",
            gateway_id: paypalGateway.id,
            requested_by_id: agent.id,
            status: PaymentSessionStatus.PENDING,
            checkout_mode: "paypal_card_fields",
            finance_notes: demo.notes,
            expires_at: expiresAt,
            created_at: createdAt,
          },
        });

        return {
          lead,
          booking,
          paymentRequest,
          paymentSession,
        };
      });

      created.push({
        customer: demo.customer_name,
        amount: demo.amount,
        booking_id: result.booking.id,
        payment_request_id: result.paymentRequest.id,
        payment_session_id: result.paymentSession.id,
        checkout_path: `/app/checkout-console/${result.paymentSession.id}`,
      });
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          message: `${created.length} demo bookings added to payment queues`,
          gateway: paypalGateway.name,
          booking_payment_queue: created.length,
          finance_checkout_queue: created.length,
          items: created,
          next_steps: [
            "Refresh /app/payments — Booking payment queue",
            "Open /app/finance — Finance payment queue → Start checkout",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
