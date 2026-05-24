"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallsStore } from "@/lib/calls/store";
import type { CreateOutboundCallInput } from "@/lib/calls/types";
import { callsService } from "@/services/calls.service";

export function useCreateOutboundCallMutation() {
  const upsertFromApi = useCallsStore((state) => state.upsertFromApi);
  const setLastError = useCallsStore((state) => state.setLastError);
  const setPresence = useCallsStore((state) => state.setPresence);

  return useMutation({
    mutationFn: (input: CreateOutboundCallInput) => callsService.createOutbound(input),
    onMutate: () => {
      setLastError(null);
      setPresence("busy");
    },
    onSuccess: (call) => {
      upsertFromApi(call);
      setPresence("on_call");
    },
    onError: (error: Error) => {
      setLastError(error.message);
      setPresence("available");
    },
  });
}
