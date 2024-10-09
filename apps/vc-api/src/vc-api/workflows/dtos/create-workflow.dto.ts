import { IsString, IsArray, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VpRequestQueryDto } from '../../exchanges/dtos/vp-request-query.dto';
import { ExchangeInteractServiceDefinitionDto } from 'src/vc-api/exchanges/dtos/exchange-interact-service-definition.dto';
import { CallbackConfigurationDto } from 'src/vc-api/exchanges/dtos/callback-configuration.dto';

class VerifiablePresentationRequest {
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

class Step {
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => CallbackConfigurationDto)
  @ApiProperty({
    description:
      'An array of "callbacks" that will be used by VC API to send notifications on the status/result of the exchange.',
    type: CallbackConfigurationDto,
    isArray: true
  })
  callback: CallbackConfigurationDto[];

  @ApiProperty({
    description: 'A verifiable presentation request object.',
    type: VerifiablePresentationRequest
  })
  @ValidateNested()
  @Type(() => VerifiablePresentationRequest)
  verifiablePresentationRequest: VerifiablePresentationRequest;
}

class Steps {
  @ApiProperty({
    description: 'A map of step names to their respective step objects.',
    type: Object
  })
  @IsObject()
  steps: Record<string, Step>;
}

export class CreateWorkflowRequestDto {
  @ApiProperty({
    description: 'The steps required to complete an exchange on the workflow.',
    type: Steps
  })
  @ValidateNested()
  @Type(() => Steps)
  steps: Steps;

  @ApiProperty({
    description: 'The initial step of the workflow.'
  })
  @IsString()
  initialStep: string;
}
