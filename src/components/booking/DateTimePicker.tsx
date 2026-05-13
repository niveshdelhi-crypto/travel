import { useController } from "react-hook-form";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
};

export function DateTimePicker<TFieldValues extends FieldValues>({
  control,
  name,
}: Props<TFieldValues>) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({ name, control });

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">
        {name === "pickupDate" ? "Pick‑up" : "Drop‑off"} date & time
      </label>
      <DatePicker
        selected={value ?? null}
        onChange={onChange}
        showTimeSelect
        timeIntervals={15}
        dateFormat="Pp"
        className={`
          w-full rounded-md border border-muted
          px-3 py-2 text-sm focus:border-primary focus:outline-none
          ${error ? "border-destructive" : ""}
        `}
        placeholderText="Select date & time"
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
