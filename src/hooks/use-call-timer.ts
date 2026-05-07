import { useCallStore, formatCallTimer } from "@/store/call.store";

/** Returns formatted MM:SS timer string from the active call store */
export function useCallTimer(): string {
  const seconds = useCallStore((s) => s.callTimer);
  return formatCallTimer(seconds);
}
