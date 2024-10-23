import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VpRequestQueryDto } from './vp-request-query.dto';
import { ExchangeInteractServiceDefinitionDto } from './exchange-interact-service-definition.dto';

export class VpRequestDto {
  @ApiProperty({
    description: 'A set of one or more queries sent by the requester.',
    type: [VpRequestQueryDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VpRequestQueryDto)
  query: VpRequestQueryDto[];

  @ApiProperty({
    description: 'A list of interaction mechanisms supported by the server.',
    type: [ExchangeInteractServiceDefinitionDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExchangeInteractServiceDefinitionDto)
  interact?: ExchangeInteractServiceDefinitionDto[];

  @ApiProperty({
    description: 'A domain string to prevent replay attacks.'
  })
  @IsString()
  domain: string;
}
