import { useController } from "react-hook-form";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

type Vehicle = { id: string; name: string; type: string; image: string };
const vehicles: Vehicle[] = [
  { id: "1", name: "Sedan", type: "sedan", image: "/assets/car-sedan-CpgS2pjw.jpg" },
  { id: "2", name: "Hatchback", type: "hatchback", image: "/assets/car-ev-DbSXHX_U.jpg" },
  { id: "3", name: "SUV", type: "suv", image: "/assets/car-suv-DJ9YkZUj.jpg" },
  { id: "4", name: "Luxury", type: "luxury", image: "/assets/car-sports-CKq_4lGT.jpg" },
];

export function VehicleSelect<TFieldValues extends FieldValues>({
  control,
}: {
  control: Control<TFieldValues>;
}) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({ name: "vehicleId" as FieldPath<TFieldValues>, control });

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Select Vehicle Type</label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {vehicles.map((v) => (
          <label
            key={v.id}
            className={`
              relative flex cursor-pointer flex-col items-center rounded-xl border-2
              p-3 transition-all duration-200 hover:shadow-lg
              ${value === v.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted hover:border-primary/50"}
            `}
          >
            <div className="h-24 w-full overflow-hidden rounded-lg bg-muted/50">
              <img src={v.image} alt={v.name} className="h-full w-full object-cover transition-transform hover:scale-110" />
            </div>
            <span className="mt-3 text-sm font-semibold">{v.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{v.type}</span>
            <input
              type="radio"
              name="vehicleId"
              value={v.id}
              checked={value === v.id}
              onChange={() => onChange(v.id)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {value === v.id && (
                <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                </div>
            )}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-destructive mt-1 font-medium">{error.message}</p>}
    </div>
  );
}
