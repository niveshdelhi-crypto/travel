import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Banknote,
  Car,
  CreditCard,
  Fuel,
  Globe2,
  ParkingCircle,
  Plane,
  Route,
  ShieldCheck,
  Timer,
} from "lucide-react";

export type ConditionSection = {
  id: string;
  title: string;
  badge: string;
  icon: LucideIcon;
  summary: string;
  bullets: string[];
};

/** Enterprise rental playbook — synthesized for transparency; binds contractually via executed supplier agreements & terms. */
export const CONDITION_SECTIONS: ConditionSection[] = [
  {
    id: "deposits",
    title: "Security deposits & preauthorization",
    badge: "Cashflow guardrails",
    icon: Banknote,
    summary:
      "Deposits are captured by contracted suppliers through certified acquirers. Book my Carz does not monetize interchange on those holds and surfaces only what your advisor confirms.",
    bullets: [
      "Amounts correlate to vehicle collateral value, corridor risk, and length of itinerary.",
      "Preauthorized holds may appear several days ahead of pickup; release timing depends on bank rails (often up to seven business days).",
      "Advisors can escalate manual reviews when corporate cards forbid certain MCC classifications.",
    ],
  },
  {
    id: "fuel",
    title: "Fuel policy",
    badge: "Operational harmony",
    icon: Fuel,
    summary:
      "Expect full-to-full when partners support it—especially for concierge-grade deliveries. Alternate policies are labeled before you digitally ratify paperwork.",
    bullets: [
      "Missing fuel rebates are invoiced according to onboard telematics or pump receipts.",
      "EV models include state-of-charge expectations; swaps may differ from ICE policies.",
      "Returning below policy floors can trigger supplemental refueling bundles plus admin fees mandated by fleet owners.",
    ],
  },
  {
    id: "mileage",
    title: "Mileage & usage caps",
    badge: "Duty cycle",
    icon: Route,
    summary:
      "Unlimited mileage is rare at the luxury tier. Operational analytics price overage kilometers using live partner tariffs.",
    bullets: [
      "Domestic itineraries default to pooled daily KM unless your advisor negotiates bespoke touring packages.",
      "Cross-border corridors require explicit underwriting; GPS tampering voids goodwill arrangements.",
      "Delivery relocation fees may cascade when drop cities diverge materially from underwriting assumptions.",
    ],
  },
  {
    id: "insurance",
    title: "Insurance & waiver products",
    badge: "Trust stack",
    icon: ShieldCheck,
    summary:
      "Core statutory coverage ships with contracted rates. Ancillary waiver products mirror what partners file with regulators—you choose stack depth with advisor guidance.",
    bullets: [
      "Collision / loss damage waivers may carry residual liabilities (windshield, underside, terrorism carve-outs—read annexes!).",
      "Personal travel policies should be verified with brokers; Book my Carz is not selling regulated insurance instruments.",
      "Incident documentation must capture police reports when authorities are engaged.",
    ],
  },
  {
    id: "cancellation",
    title: "Cancellation ladders",
    badge: "Forecast accuracy",
    icon: AlertTriangle,
    summary:
      "Because partners lock rolling stock early, cancellations are tiered relative to countdown windows documented on your confirmation artifact.",
    bullets: [
      "Inside 24 hours of pickup, penalties may approximate full rental consideration plus delivery mobilization losses.",
      "Weather or strike waivers activate only after carrier attestation—you cannot self-declare ATC meltdowns without proof.",
      "Subscription or membership bundles may remap fees; reference master services agreements archived in your tenant workspace.",
    ],
  },
  {
    id: "noshow",
    title: "No-show forfeiture",
    badge: "Resource planning",
    icon: Timer,
    summary:
      "Fleet owners treat no-shows akin to chartered aviation—hardware is staged, drivers allocated, bays blocked.",
    bullets: [
      "Grace windows default to sixty minutes unless a flight manifest indicates scheduled delays reported to Ops.",
      "After grace expiry, forfeiture aligns with prepaid segments plus logistic surcharges.",
      "Blacklist flags propagate across partner exchanges for chronic violations—Ops must remediate diplomatically.",
    ],
  },
  {
    id: "latePickup",
    title: "Late pickup adjustments",
    badge: "Throughput",
    icon: Plane,
    summary:
      "Rolling clock starts at contractual pickup timestamps. Sliding windows cost money because fleet utilization compresses downstream reservations.",
    bullets: [
      "Advisors negotiate buffer holds when ATC or customs disruptions are logged in realtime CRM.",
      "After-hours desks may levy premium labor multipliers—you will see itemized deltas before confirming.",
      "Electric handoffs require minimum state-of-charge buffers; tardiness risks missing charging SLA.",
    ],
  },
  {
    id: "age",
    title: "Minimum age & licensee standing",
    badge: "Compliance",
    icon: Car,
    summary:
      "Twenty-five-plus is typical for prestige inventory, but underwriting engines may carve exceptions tied to Fortune 500 travel programs.",
    bullets: [
      "Young-driver fees are contractual pass-through charges; Book my Carz does not pocket margin on them.",
      "Suspended, provisional, or digital-only credentials may disqualify corridors—bring physical cards when mandates require embossing.",
      "Additional authorized drivers incur identity verification workflows and sometimes daily premiums.",
    ],
  },
  {
    id: "cards",
    title: "Debit vs credit underwriting",
    badge: "Clearing rails",
    icon: CreditCard,
    summary:
      "Credit rails keep authorization fluid; debit underwriting often doubles documentation because chargeback windows stress fleet economics.",
    bullets: [
      "PIN-debit corridors may insist on refundable deposits lodged days before staging.",
      "Single-use virtual cards expire—Ops must reconcile before counter release or vehicles remain immobilized.",
      "Book my Carz never stores PAN data on public landing surfaces.",
    ],
  },
  {
    id: "idp",
    title: "International driving permits",
    badge: "Regulatory overlays",
    icon: Globe2,
    summary:
      "Translations are compulsory in certain sovereignties even when rentals originate digitally; advisors cross-check ICAO-aligned guidance.",
    bullets: [
      "Permits must synch with embossed license classifications (motorcycle endorsements excluded unless declared).",
      "Biometric passports may accelerate counter flows but do not waive driving credential reviews.",
      "Sanctioned itineraries trigger OFAC tooling before keys release.",
    ],
  },
  {
    id: "airport",
    title: "Airport fees & concessions",
    badge: "Infrastructure",
    icon: ParkingCircle,
    summary:
      "Facility cost recovery flows through customer-of-record invoices; they are neither optional nor arbitrarily padded by Book my Carz.",
    bullets: [
      "Customer Facility Charges (CFC) differ by terminal—even inside the same IATA umbrella.",
      "Curbside meet-and-greet programs pay premium slotting premiums that appear as transparent line haul items.",
      "After-midnight handoffs incur security surcharges mandated by airports.",
    ],
  },
];
