import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthorizeTransportDto {
  @ApiProperty({ description: 'ID of the transport type to authorize' })
  @IsString()
  @IsNotEmpty()
  transportTypeId!: string;
}
