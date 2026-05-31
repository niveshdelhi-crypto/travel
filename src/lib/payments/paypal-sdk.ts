type PayPalSdkOptions = {
  clientId: string;
  currency: string;
  environment?: "sandbox" | "live";
};

type PayPalCardFieldsInstance = {
  isEligible: () => boolean;
  NumberField: (opts?: object) => { render: (selector: string) => Promise<void> };
  NameField: (opts?: object) => { render: (selector: string) => Promise<void> };
  ExpiryField: (opts?: object) => { render: (selector: string) => Promise<void> };
  CVVField: (opts?: object) => { render: (selector: string) => Promise<void> };
  submit: () => Promise<{ orderId?: string }>;
};

type PayPalNamespace = {
  CardFields: (config: { createOrder: () => Promise<string> | string }) => PayPalCardFieldsInstance;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let sdkPromise: Promise<PayPalNamespace> | null = null;

export function loadPayPalCardFieldsSdk(options: PayPalSdkOptions): Promise<PayPalNamespace> {
  if (window.paypal) return Promise.resolve(window.paypal);

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const host =
        options.environment === "live"
          ? "https://www.paypal.com"
          : "https://www.sandbox.paypal.com";
      script.src = `${host}/sdk/js?client-id=${encodeURIComponent(options.clientId)}&components=card-fields&currency=${encodeURIComponent(options.currency)}&intent=capture`;
      script.async = true;
      script.onload = () => {
        if (window.paypal) resolve(window.paypal);
        else reject(new Error("PayPal SDK failed to initialize"));
      };
      script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
      document.body.appendChild(script);
    });
  }

  return sdkPromise;
}

export type { PayPalCardFieldsInstance, PayPalNamespace };
