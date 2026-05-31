import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TELNYX_CONFIG_KEYS } from "./telnyx.config";

type TelnyxCallActionResponse = { data?: { result?: string } };

@Injectable()
export class TelnyxService {
  private readonly logger = new Logger(TelnyxService.name);
  private readonly apiBase = "https://api.telnyx.com/v2";

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>(TELNYX_CONFIG_KEYS.API_KEY)?.trim());
  }

  getDefaultFromNumber(): string | undefined {
    return this.config.get<string>(TELNYX_CONFIG_KEYS.DEFAULT_FROM_NUMBER)?.trim() || undefined;
  }

  getConnectionId(): string | undefined {
    return this.config.get<string>(TELNYX_CONFIG_KEYS.CONNECTION_ID)?.trim() || undefined;
  }

  buildWebhookUrl(path: string): string {
    const base = this.config.get<string>("PUBLIC_API_BASE_URL")?.replace(/\/$/, "");
    if (!base) {
      throw new Error("PUBLIC_API_BASE_URL is required for Telnyx webhooks");
    }
    return `${base}/api/calls/webhooks/${path}`;
  }

  async answerCall(callControlId: string): Promise<void> {
    await this.postAction(callControlId, "answer");
  }

  async bridgeToConnection(callControlId: string, connectionId: string): Promise<void> {
    await this.postAction(callControlId, "transfer", {
      to: connectionId,
    });
  }

  private async postAction(
    callControlId: string,
    action: string,
    body: Record<string, unknown> = {},
  ): Promise<TelnyxCallActionResponse> {
    const apiKey = this.config.getOrThrow<string>(TELNYX_CONFIG_KEYS.API_KEY).trim();
    const response = await fetch(`${this.apiBase}/calls/${callControlId}/actions/${action}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.warn(
        JSON.stringify({
          message: "telnyx.call_action.failed",
          callControlId,
          action,
          status: response.status,
          body: text.slice(0, 500),
        }),
      );
      throw new Error(`Telnyx ${action} failed (${response.status})`);
    }

    return (await response.json()) as TelnyxCallActionResponse;
  }
}
