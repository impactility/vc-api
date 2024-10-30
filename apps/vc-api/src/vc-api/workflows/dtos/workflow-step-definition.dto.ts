/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { IsArray, IsString, ValidateNested } from 'class-validator';
import { VpRequestQueryDto } from './vp-request-query.dto';
import { ExchangeInteractServiceDefinitionDto } from './exchange-interact-service-definition.dto';
import { CallbackConfigurationDto } from './callback-configuration.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WorkflowStepDefinitionDto {
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

  @IsString()
  @ApiProperty({
    description: 'The next step after the current step'
  })
  nextStep: string;
}
