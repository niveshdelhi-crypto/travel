import { Body, Controller, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { SkipCsrf } from "../../common/decorators/skip-csrf.decorator";
import { PaypalWebhookService } from "../services/paypal-webhook.service";

/**
 * PayPal REST webhooks (optional). Checkout capture is driven by our API, not webhooks.
 * Register in PayPal Developer Dashboard → Webhooks:
 *   URL: {PUBLIC_API_BASE_URL}/api/payments/webhooks/paypal
 *   Events: CHECKOUT.ORDER.COMPLETED, PAYMENT.CAPTURE.COMPLETED
 */
@Controller("payments/webhooks/paypal")
export class PaypalWebhookController {
  constructor(private readonly webhooks: PaypalWebhookService) {}

  @Public()
  @SkipCsrf()
  @Post()
  handle(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.webhooks.handleIncoming(req, body);
  }
}
