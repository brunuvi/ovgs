import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Distribuidora Exemplo LTDA' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '12345678000190', description: 'Unique CNPJ/CPF' })
  @IsString()
  @IsNotEmpty()
  document!: string;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'IDs of transport types authorized on creation',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  authorizedTransportTypeIds?: string[];
}
