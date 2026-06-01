type PayPalSdkOptions = {
  clientId: string;
  currency: string;
  environment?: "sandbox" | "live";
  components?: string[];
};

type PayPalCardFieldsInstance = {
  isEligible: () => boolean;
  NumberField: (opts?: object) => { render: (selector: string) => Promise<void> };
  NameField: (opts?: object) => { render: (selector: string) => Promise<void> };
  ExpiryField: (opts?: object) => { render: (selector: string) => Promise<void> };
  CVVField: (opts?: object) => { render: (selector: string) => Promise<void> };
  submit: () => Promise<{ orderId?: string }>;
};

type PayPalButtonsInstance = {
  render: (selector: string | HTMLElement) => Promise<void>;
  close: () => void;
  isEligible: () => boolean;
};

type PayPalFundingSource = string;

type PayPalNamespace = {
  CardFields?: (config: { createOrder: () => Promise<string> | string }) => PayPalCardFieldsInstance;
  Buttons?: (config: PayPalButtonsConfig) => PayPalButtonsInstance;
  FUNDING?: {
    PAYPAL?: PayPalFundingSource;
    CARD?: PayPalFundingSource;
    VENMO?: PayPalFundingSource;
  };
  isFundingEligible?: (source: PayPalFundingSource) => boolean;
};

type PayPalButtonsConfig = {
  fundingSource?: PayPalFundingSource;
  style?: { layout?: string; color?: string; shape?: string; label?: string; height?: number };
  createOrder?: () => Promise<string> | string;
  onApprove?: (data: { orderID: string }) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (err: unknown) => void;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

const sdkPromises = new Map<string, Promise<PayPalNamespace>>();

function sdkCacheKey(options: PayPalSdkOptions): string {
  const components = (options.components ?? ["buttons", "card-fields"]).join(",");
  return `${options.environment ?? "sandbox"}:${options.clientId}:${options.currency}:${components}`;
}

/** Parse PayPal JS SDK / Card Fields rejection payloads for display. */
export function formatPayPalClientError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (err && typeof err === "object") {
    const payload = err as {
      message?: string;
      details?: Array<{ description?: string; issue?: string }>;
    };
    const detail = payload.details?.[0];
    if (detail?.description?.trim()) return detail.description.trim();
    if (detail?.issue?.trim()) return detail.issue.replace(/_/g, " ");
    if (payload.message?.trim()) return payload.message.trim();
  }
  return "PayPal checkout failed";
}

/** Warm PayPal SDK in the background (safe to call multiple times). */
export function preloadPayPalSdk(options: PayPalSdkOptions): void {
  if (typeof window === "undefined") return;
  void loadPayPalSdk(options).catch(() => undefined);
}

export function loadPayPalSdk(options: PayPalSdkOptions): Promise<PayPalNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PayPal SDK requires a browser environment"));
  }

  const key = sdkCacheKey(options);
  const cached = sdkPromises.get(key);
  if (cached) return cached;

  const promise = new Promise<PayPalNamespace>((resolve, reject) => {
    const components = options.components ?? ["buttons", "card-fields"];
    const host =
      options.environment === "live" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com";
    const params = new URLSearchParams({
      "client-id": options.clientId,
      components: components.join(","),
      currency: options.currency,
      intent: "capture",
    });
    params.set("enable-funding", "venmo,paylater");
    // Sandbox: align buyer country with test cards / billing (see PayPal card testing docs).
    if (options.environment !== "live" && options.currency.toUpperCase() === "USD") {
      params.set("buyer-country", "US");
    }
    // Do NOT set disable-funding=card — that forces Card Fields ineligible.

    const script = document.createElement("script");
    script.src = `${host}/sdk/js?${params.toString()}`;
    script.async = true;
    script.dataset.paypalSdkKey = key;
    script.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error("PayPal SDK failed to initialize"));
    };
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(script);
  });

  sdkPromises.set(key, promise);
  return promise;
}

/** @deprecated use loadPayPalSdk */
export function loadPayPalCardFieldsSdk(options: PayPalSdkOptions): Promise<PayPalNamespace> {
  return loadPayPalSdk({ ...options, components: ["buttons", "card-fields"] });
}

export type {
  PayPalButtonsConfig,
  PayPalButtonsInstance,
  PayPalCardFieldsInstance,
  PayPalFundingSource,
  PayPalNamespace,
};
