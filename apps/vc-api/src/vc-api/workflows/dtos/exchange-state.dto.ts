import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeState } from '../types/exchange-status';

export class ExchangeStateDto {
  @IsString()
  @ApiProperty({
    description: 'Exchange Id'
  })
  exchangeId: string;

  @IsString()
  @ApiProperty({
    description: 'Current step in the exchange'
  })
  step: string;

  @IsString()
  @ApiProperty({
    description: 'Exchange status'
  })
  state: ExchangeState;
}
