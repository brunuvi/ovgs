import { Module } from '@nestjs/common';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [SalesOrdersModule],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
