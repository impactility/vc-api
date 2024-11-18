/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { IsArray, IsObject, IsString, ValidateNested } from 'class-validator';
import { CallbackConfigurationDto } from './callback-configuration.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VpRequestDefinitionDto } from './vp-request-definition.dto';

export class WorkflowStepDefinitionDto {
  @ValidateNested({ each: true })
  @IsObject()
  @Type(() => VpRequestDefinitionDto)
  @ApiProperty({
    description: 'A Verifiable Presentation Request object',
    type: VpRequestDefinitionDto
  })
  verifiablePresentationRequest: VpRequestDefinitionDto;

  @IsString()
  @ApiProperty({
    description: 'The next step after the current step'
  })
  nextStep: string;

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
}
