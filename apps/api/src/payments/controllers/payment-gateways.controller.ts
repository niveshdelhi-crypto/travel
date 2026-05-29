import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PAYMENT_ADMIN_ROLES } from "../constants/payment-roles.constants";
import { CreatePaymentGatewayDto } from "../dto/create-payment-gateway.dto";
import { UpdatePaymentGatewayDto } from "../dto/update-payment-gateway.dto";
import { PaymentGatewayAdminService } from "../services/payment-gateway-admin.service";

@Controller("payments/gateways")
@Roles(...PAYMENT_ADMIN_ROLES)
export class PaymentGatewaysController {
  constructor(private readonly gatewayAdmin: PaymentGatewayAdminService) {}

  @Get("types")
  listSupportedTypes() {
    return { data: this.gatewayAdmin.getSupportedGatewayTypes() };
  }

  @Get()
  list() {
    return this.gatewayAdmin.listGateways();
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.gatewayAdmin.getGateway(id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentGatewayDto) {
    return this.gatewayAdmin.createGateway(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentGatewayDto,
  ) {
    return this.gatewayAdmin.updateGateway(user.id, id, dto);
  }
}

@Controller("payments/admin")
@Roles(UserRole.admin)
export class PaymentAdminController {
  constructor(private readonly gatewayAdmin: PaymentGatewayAdminService) {}

  @Get("overview")
  overview() {
    return {
      supportedGateways: this.gatewayAdmin.getSupportedGatewayTypes(),
    };
  }
}
