import { IsArray, ValidateNested,  IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CallbackConfigurationDto } from './callback-configuration.dto';
import { VpRequestDto } from './vp-request.dto';

export class WorkflowStepDto {

    @ValidateNested({ each: true })
    @IsArray()
    @Type(() => CallbackConfigurationDto)
    @IsOptional()
    @ApiProperty({
      description:
        'An array of "callbacks" that will be used by VC API to send notifications on the status/result of the exchange.',
      type: CallbackConfigurationDto,
      isArray: true
    })
    callback: CallbackConfigurationDto[];
  
    @ApiProperty({
      description: 'A verifiable presentation request object.',
      type: VpRequestDto
    })
    @ValidateNested()
    @Type(() => VpRequestDto)
    verifiablePresentationRequest: VpRequestDto;
}