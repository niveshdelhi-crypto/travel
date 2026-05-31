import type { Request } from "express";

export type TelnyxWebhookRequest = Request & {
  rawBody?: Buffer;
  requestId?: string;
  telnyxWebhook?: {
    signatureValid: boolean | null;
    endpoint: string;
    ipAddress?: string;
    replayKey?: string;
  };
};
