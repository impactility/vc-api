import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * https://w3c-ccg.github.io/vc-api/#create-exchange
 */
export class CreateExchangeSuccessDto {
  @ApiProperty({
    description: 'The URL that uniquely identifies the exchange.'
  })
  @IsString()
  exchangeId: string;

  // TODO: add other properties, in particular "state"

  @ApiProperty({
    description: 'The semantic string ID for the current step.'
  })
  @IsString()
  step: string;

  @ApiProperty({
    description: 'Status of current exchange step'
  })
  @IsString()
  state: string;
}
