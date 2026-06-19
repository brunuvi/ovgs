import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateTransportTypeDto {
  @ApiProperty({ example: 'BITRUCK', description: 'Unique code (uppercase)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'code must contain only uppercase letters, numbers and underscores',
  })
  code!: string;

  @ApiProperty({ example: 'Bi-truck' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
