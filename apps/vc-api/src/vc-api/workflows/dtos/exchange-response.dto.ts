/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { VerifiablePresentationDto } from '../../credentials/dtos/verifiable-presentation.dto';
import { VpRequestDto } from './vp-request.dto';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Describes the possible contents of response to a start/continue exchange request
 */
export class ExchangeResponseDto {
  @ValidateNested()
  @Type(() => VpRequestDto)
  @IsOptional()
  @ApiPropertyOptional({
    description:
      'Verifiable Presentation Request.\n' +
      'Should conform to VP-Request specification.\n' +
      'Will be returned if a VP is required to obtain more information from requester\n' +
      'May not be returned if no further information is required (for example, at the end of the workflow)'
  })
  verifiablePresentationRequest?: VpRequestDto;

  @ValidateNested()
  @Type(() => VerifiablePresentationDto)
  @IsOptional()
  @ApiPropertyOptional({ description: 'If it is an issuance response, then a vp may be provided' })
  verifiablePresentation?: VerifiablePresentationDto;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The URL the exchange wishes to redirect the client to.'
  })
  redirectUrl?: string;
}
