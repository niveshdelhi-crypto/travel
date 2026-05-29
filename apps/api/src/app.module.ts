import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { CsrfGuard } from "./common/guards/csrf.guard";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AdminModule } from "./admin/admin.module";
import { HealthModule } from "./health/health.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { BookingsModule } from "./bookings/bookings.module";
import { BookingOrchestrationModule } from "./booking-orchestration/booking-orchestration.module";
import { CommunicationsModule } from "./communications/communications.module";
import { LeadsModule } from "./leads/leads.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 120,
      },
      {
        name: "vonageWebhooks",
        ttl: 60_000,
        limit: 60,
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    LeadsModule,
    MarketplaceModule,
    BookingsModule,
    BookingOrchestrationModule,
    PaymentsModule,
    AnalyticsModule,
    AdminModule,
    HealthModule,
    CommunicationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
