/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { IsObject } from 'class-validator';
import { CredentialDto } from './credential.dto';
import { ApiProperty } from '@nestjs/swagger';
import { SingleOrArray } from '@credo-ts/core/build/utils';
import { LinkedDataProof } from '@credo-ts/core/build/modules/vc/data-integrity/models/LinkedDataProof';
import { DataIntegrityProof } from '@credo-ts/core';

/**
 * A JSON-LD Verifiable Credential with a proof.
 * https://w3c-ccg.github.io/vc-api/issuer.html#operation/issueCredential
 */
export class VerifiableCredentialDto extends CredentialDto {
  @IsObject()
  @ApiProperty({ description: 'A JSON-LD Linked Data proof.' })
  proof: SingleOrArray<LinkedDataProof | DataIntegrityProof>;
}
