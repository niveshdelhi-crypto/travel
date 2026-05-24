import type { Request } from "express";

export type VonageWebhookVerificationContext = {
  signatureValid: boolean | null;
  replayKey?: string;
  jwtSubject?: string;
  endpoint: string;
  ipAddress?: string;
  failureReason?: string;
};

export type VonageWebhookRequest = Request & {
  rawBody?: Buffer;
  requestId?: string;
  vonageWebhook?: VonageWebhookVerificationContext;
};
