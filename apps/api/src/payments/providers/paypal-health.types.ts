export type PaypalEnvironment = "sandbox" | "live";

export type PaypalHealthDiagnostics = {
  environment: PaypalEnvironment;
  environment_valid: boolean;
  oauth_valid: boolean;
  oauth_latency_ms: number;
  oauth_message?: string;
  oauth_scopes?: string;
  orders_api: boolean;
  orders_api_message?: string;
  capture_api: boolean;
  capture_api_message?: string;
  card_processing_eligible: boolean;
  card_processing_message?: string;
  currency_supported: boolean;
  currency_tested: string;
  currency_message?: string;
};

export type GatewayOperationalStatus = "CONNECTED" | "DEGRADED" | "FAILED";

export type PaymentGatewayHealthRow = {
  gateway_id: string;
  gateway_name: string;
  gateway_type: string;
  status: GatewayOperationalStatus;
  environment: string | null;
  oauth_valid: boolean;
  orders_api: boolean;
  capture_api: boolean;
  card_processing_eligible: boolean | null;
  currency_supported: boolean | null;
  currency_tested: string | null;
  last_successful_charge: string | null;
  last_failed_charge: string | null;
  is_active: boolean;
  checked_at: string;
  detail?: string;
};
