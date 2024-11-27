import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IssuanceExchangeStep } from '../types/issuance-exchange-step';
import { QueryExchangeStep } from '../types/query-exchange-step';
import { ExchangeResponseDto } from './exchange-response.dto';

export class ExchangeStepStateDto {

  @IsString()
  @ApiProperty({
    description: 'Exchange Id'
  })
  exchangeId: string;

  @IsString()
  @ApiProperty({
    description: 'Step Id'
  })
  stepId: string;
  
  @IsObject()
  @ApiProperty({
    description: 'Exchange step information'
  })
  step: IssuanceExchangeStep | QueryExchangeStep

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'Exchange step information'
  })
  stepResponse?: ExchangeResponseDto
}
