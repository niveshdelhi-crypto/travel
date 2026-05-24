export class VonageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VonageConfigurationError";
  }
}

export class VonageApiError extends Error {
  readonly statusCode?: number;
  readonly providerCode?: string;
  readonly retryable: boolean;

  constructor(
    message: string,
    options?: { statusCode?: number; providerCode?: string; retryable?: boolean },
  ) {
    super(message);
    this.name = "VonageApiError";
    this.statusCode = options?.statusCode;
    this.providerCode = options?.providerCode;
    this.retryable = options?.retryable ?? false;
  }
}
