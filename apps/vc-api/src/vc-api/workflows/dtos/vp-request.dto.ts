import { IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VpRequestQueryDto } from './vp-request-query.dto';
import { VpRequestInteractDto } from 'src/vc-api/exchanges/dtos/vp-request-interact.dto';

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
    description:
      'A challenge, intended to prevent replay attacks, provided by the requester that is typically expected to be included in the Verifiable Presentation response.'
  })
  @IsString()
  challenge: string;

  @ApiProperty({
    description: 'A list of interaction mechanisms that are supported by the server.',
    type: [VpRequestInteractDto]
  })
  @ValidateNested()
  @Type(() => VpRequestInteractDto)
  interact: VpRequestInteractDto;

  @ApiProperty({
    description: 'A domain string to prevent replay attacks.'
  })
  @IsString()
  domain: string;
}
