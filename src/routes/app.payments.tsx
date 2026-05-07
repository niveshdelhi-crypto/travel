import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, Panel, PanelHeader, StatCard } from "@/components/app/primitives";
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, RotateCcw, Wallet, Filter } from "lucide-react";

export const Route = createFileRoute("/app/payments")({
  head: () => ({ meta: [{ title: "Payments — RentOps CRM" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <AppShell title="Payments">
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Gross volume" value="$1.84M" delta="+14.2%" icon={CircleDollarSign} spark={[40,55,52,68,72,80,88,92,98,110]} />
          <StatCard label="Net revenue" value="$284k" delta="+8.2%" icon={Wallet} spark={[20,22,24,26,28,30,32,34,36,38]} />
          <StatCard label="Refunds" value="$4,210" delta="-12%" icon={RotateCcw} spark={[8,7,6,7,6,5,5,4,4,4]} />
          <StatCard label="Provider payouts" value="$1.12M" delta="+9.8%" icon={ArrowUpRight} spark={[30,40,42,50,55,60,65,70,72,80]} />
        </div>

        <Panel>
          <PanelHeader
            title="Transactions"
            subtitle="All payment activity across providers"
            right={<button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2"><Filter className="h-3.5 w-3.5" /> Filter</button>}
          />
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5">ID</th>
                <th className="px-3 py-2.5">Customer</th>
                <th className="px-3 py-2.5">Provider</th>
                <th className="px-3 py-2.5">Method</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-5 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-surface-2">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{t.id}</td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><Avatar name={t.c} /><span className="text-foreground">{t.c}</span></div></td>
                  <td className="px-3 py-3 text-muted-foreground">{t.p}</td>
                  <td className="px-3 py-3 text-muted-foreground">{t.m}</td>
                  <td className={`px-3 py-3 font-medium ${t.amt.startsWith("-") ? "text-destructive" : "text-foreground"}`}>{t.amt}</td>
                  <td className="px-3 py-3"><Badge tone={t.tone as any}>{t.s}</Badge></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{t.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  );
}

const txs = [
  { id: "txn_8f29A1", c: "Sarah Chen", p: "Hertz", m: "Visa •• 4242", amt: "+$1,240.00", s: "succeeded", tone: "success", d: "May 6 · 14:22" },
  { id: "txn_8f28Z9", c: "Marcus Reid", p: "Enterprise", m: "Amex •• 0029", amt: "+$890.00", s: "succeeded", tone: "success", d: "May 6 · 13:04" },
  { id: "txn_8f25C3", c: "Priya Shah", p: "Sixt", m: "Mastercard •• 8821", amt: "+$540.00", s: "succeeded", tone: "success", d: "May 6 · 11:48" },
  { id: "txn_8f22B2", c: "Diego Alvarez", p: "Avis", m: "Apple Pay", amt: "+$1,120.00", s: "pending", tone: "warning", d: "May 6 · 10:12" },
  { id: "txn_8f18N0", c: "Hiroshi Tanaka", p: "Hertz", m: "Visa •• 7711", amt: "-$240.00", s: "refunded", tone: "danger", d: "May 5 · 18:33" },
  { id: "txn_8f15K7", c: "Olivia Bennett", p: "Budget", m: "Visa •• 5544", amt: "+$980.00", s: "succeeded", tone: "success", d: "May 5 · 16:02" },
];
