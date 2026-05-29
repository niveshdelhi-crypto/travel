import { Badge } from "@/components/app/primitives";
import { Repeat2 } from "lucide-react";

export function RecurringCustomerBadge({ count }: { count: number }) {
  if (count < 2) return null;

  return (
    <Badge tone="primary" className="gap-1">
      <Repeat2 className="h-3 w-3" />
      Recurring · {count} bookings
    </Badge>
  );
}
