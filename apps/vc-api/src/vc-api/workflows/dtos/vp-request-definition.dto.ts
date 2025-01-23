import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { ExchangeInteractServiceDefinitionDto } from './exchange-interact-service-definition.dto';
import { VpRequestQueryDto } from './vp-request-query.dto';

export class VpRequestDefinitionDto {
  @ValidateNested()
  @IsArray()
  @Type(() => ExchangeInteractServiceDefinitionDto)
  @ApiProperty({
    description:
      'The Interact Service Definitions are related to the Interaction Types of the Verifiable Presentation Request (VPR) specification.\n' +
      'However, as it is a configuration object, it not identical to a VPR interact services.\n' +
      'It can be see as the input data that the application uses to generate VPR interact services during the exchanges.',
    type: ExchangeInteractServiceDefinitionDto,
    isArray: true
  })
  interactServices: ExchangeInteractServiceDefinitionDto[];

  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => VpRequestQueryDto)
  @ApiProperty({
    description: 'Defines requests for data in the Verifiable Presentation',
    type: VpRequestQueryDto,
    isArray: true
  })
  query: VpRequestQueryDto[];
}
