/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { IsArray } from 'class-validator';
import { VerificationResult } from '../types/verification-result';
import { ApiProperty } from '@nestjs/swagger';
import { ProblemDetail } from '../types/problem-detail';

/**
 * A response object from verification of a credential or a presentation.
 * https://w3c-ccg.github.io/vc-api/verifier.html
 */
export class VerificationResultDto implements VerificationResult {
  @IsArray()
  @ApiProperty({ description: 'Warnings' })
  warnings?: ProblemDetail[];

  @IsArray()
  @ApiProperty({ description: 'Errors' })
  errors?: ProblemDetail[];

  @ApiProperty({ description: 'Is the credential valid' })
  verified?: boolean;
}
