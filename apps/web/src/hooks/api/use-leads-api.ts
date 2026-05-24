"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leadsService } from "@/services/leads.service";
import { onLeadEvent } from "@/lib/leads/socket";
import { leadQueryKeys } from "@/lib/leads/query-keys";
import type {
  Lead,
  LeadListParams,
  LeadMetrics,
  LeadNote,
  PaginatedLeads,
} from "@/lib/leads/types";

const defaultLeadListParams = {
  page: 1,
  pageSize: 25,
  status: "ALL",
} satisfies Required<LeadListParams>;

function normalizeLeadListParams(params: LeadListParams): Required<LeadListParams> {
  return {
    page: params.page ?? defaultLeadListParams.page,
    pageSize: params.pageSize ?? defaultLeadListParams.pageSize,
    status: params.status ?? defaultLeadListParams.status,
  };
}

export function useLeadsQuery(params: LeadListParams, initialData?: PaginatedLeads) {
  const normalizedParams = normalizeLeadListParams(params);

  return useQuery({
    queryKey: leadQueryKeys.list(normalizedParams),
    queryFn: () => leadsService.listLeads(normalizedParams),
    initialData,
    placeholderData: (previousData) => previousData,
  });
}

export function useLeadMetricsQuery(initialData?: LeadMetrics) {
  return useQuery({
    queryKey: leadQueryKeys.metrics(),
    queryFn: () => leadsService.getLeadMetrics(),
    initialData,
  });
}

export function useLeadRealtimeInvalidation(includeAdminEvents: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateLeads = () => {
      void queryClient.invalidateQueries({ queryKey: leadQueryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: leadQueryKeys.metrics() });
    };

    const disposers = [
      onLeadEvent("lead.assigned", invalidateLeads),
      onLeadEvent("lead.updated", invalidateLeads),
      onLeadEvent("lead.note.created", invalidateLeads),
      onLeadEvent(
        "metrics.changed",
        () => void queryClient.invalidateQueries({ queryKey: leadQueryKeys.metrics() }),
      ),
    ];

    if (includeAdminEvents) {
      disposers.push(onLeadEvent("lead.created", invalidateLeads));
    }

    return () => disposers.forEach((dispose) => dispose());
  }, [includeAdminEvents, queryClient]);
}

export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof leadsService.updateLead>[1];
    }) => leadsService.updateLead(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: leadQueryKeys.lists() });
      const snapshots = queryClient.getQueriesData<PaginatedLeads>({
        queryKey: leadQueryKeys.lists(),
      });

      queryClient.setQueriesData<PaginatedLeads>({ queryKey: leadQueryKeys.lists() }, (page) =>
        page ? mapLeadPage(page, (lead) => (lead.id === id ? { ...lead, ...input } : lead)) : page,
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSuccess: (updatedLead) => updateCachedLead(queryClient, updatedLead),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: leadQueryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: leadQueryKeys.metrics() });
    },
  });
}

export function useRecordCallMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lead: Lead) => leadsService.recordCall(lead.id),
    onMutate: async (lead) => {
      await queryClient.cancelQueries({ queryKey: leadQueryKeys.lists() });
      const snapshots = queryClient.getQueriesData<PaginatedLeads>({
        queryKey: leadQueryKeys.lists(),
      });

      queryClient.setQueriesData<PaginatedLeads>({ queryKey: leadQueryKeys.lists() }, (page) =>
        page
          ? mapLeadPage(page, (item) =>
              item.id === lead.id
                ? { ...item, status: "CONTACTED", last_contacted_at: new Date().toISOString() }
                : item,
            )
          : page,
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSuccess: (updatedLead) => updateCachedLead(queryClient, updatedLead),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: leadQueryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: leadQueryKeys.metrics() });
    },
  });
}

export function useAddLeadNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lead, body }: { lead: Lead; body: string }) =>
      leadsService.addLeadNote(lead.id, body),
    onMutate: async ({ lead, body }) => {
      await queryClient.cancelQueries({ queryKey: leadQueryKeys.lists() });
      const snapshots = queryClient.getQueriesData<PaginatedLeads>({
        queryKey: leadQueryKeys.lists(),
      });
      const optimisticNote: LeadNote = {
        id: `pending-${Date.now()}`,
        lead_id: lead.id,
        author_id: "pending",
        body,
        created_at: new Date().toISOString(),
        author: { id: "pending", name: "You", email: "" },
      };

      queryClient.setQueriesData<PaginatedLeads>({ queryKey: leadQueryKeys.lists() }, (page) =>
        page
          ? mapLeadPage(page, (item) =>
              item.id === lead.id ? { ...item, notes: [optimisticNote, ...item.notes] } : item,
            )
          : page,
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: leadQueryKeys.lists() });
    },
  });
}

function mapLeadPage(page: PaginatedLeads, mapper: (lead: Lead) => Lead): PaginatedLeads {
  return { ...page, data: page.data.map(mapper) };
}

function updateCachedLead(queryClient: ReturnType<typeof useQueryClient>, updatedLead: Lead) {
  queryClient.setQueriesData<PaginatedLeads>({ queryKey: leadQueryKeys.lists() }, (page) =>
    page ? mapLeadPage(page, (lead) => (lead.id === updatedLead.id ? updatedLead : lead)) : page,
  );
}
