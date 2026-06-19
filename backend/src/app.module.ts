import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { LoggerModule } from "nestjs-pino";
import { HealthController } from "./common/health.controller";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuditModule } from "./modules/audit/audit.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { ItemsModule } from "./modules/items/items.module";
import { SalesOrdersModule } from "./modules/sales-orders/sales-orders.module";
import { SchedulingModule } from "./modules/scheduling/scheduling.module";
import { TransportTypesModule } from "./modules/transport-types/transport-types.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { singleLine: true } },
      },
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuditModule,
    ClientsModule,
    TransportTypesModule,
    ItemsModule,
    SalesOrdersModule,
    SchedulingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
