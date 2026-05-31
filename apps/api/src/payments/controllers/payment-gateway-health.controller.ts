import { Controller, Get } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { PAYMENT_ADMIN_ROLES } from "../constants/payment-roles.constants";
import { GatewayHealthService } from "../services/gateway-health.service";

@Controller("payments")
@Roles(...PAYMENT_ADMIN_ROLES)
export class PaymentGatewayHealthController {
  constructor(private readonly gatewayHealth: GatewayHealthService) {}

  /** Real provider API validation — no mock statuses. */
  @Get("gateway-health")
  getGatewayHealth() {
    return this.gatewayHealth.getGatewayHealth();
  }
}
