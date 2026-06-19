import { Module } from '@nestjs/common';
import { TransportTypesController } from './transport-types.controller';
import { TransportTypesService } from './transport-types.service';

@Module({
  controllers: [TransportTypesController],
  providers: [TransportTypesService],
  exports: [TransportTypesService],
})
export class TransportTypesModule {}
