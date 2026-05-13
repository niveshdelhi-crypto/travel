export type LeadStatus = "NEW" | "CONTACTED" | "NEGOTIATING" | "CONFIRMED" | "COMPLETED";

export type LeadNote = {
  id: string;
  lead_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
};

export type Lead = {
  id: string;
  pickup_location: string;
  drop_location: string;
  pickup_datetime: string;
  return_datetime: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: LeadStatus;
  assigned_to: string | null;
  booking_value: string | number | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_agent: {
    id: string;
    name: string;
    email: string;
    current_lead_count: number;
  } | null;
  notes: LeadNote[];
};

export type LeadMetrics = {
  statusCounts: Partial<Record<LeadStatus, number>>;
  activeAgents: Array<{
    id: string;
    name: string;
    email: string;
    current_lead_count: number;
  }>;
  revenue: number;
};

export type LeadListParams = {
  page?: number;
  pageSize?: number;
  status?: LeadStatus | "ALL";
};

export type PaginatedLeads = {
  data: Lead[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CreateLeadInput = {
  pickup_location: string;
  drop_location: string;
  pickup_datetime: string;
  return_datetime: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
};

export type PublicLeadResponse = {
  success: true;
  message: string;
  leadId: string;
  status: LeadStatus;
};
