/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExchangeVerificationResult } from '../types/exchange-verification-result';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { VerifiablePresentation } from '../types/verifiable-presentation';

/**
 * A TypeOrm entity representing a Presentation Submission.
 * This is a presentation submitted in response to a VP Request https://w3c-ccg.github.io/vp-request-spec/.
 * Related to a presentation exchange submission (https://identity.foundation/presentation-exchange/#presentation-submission),
 * in that the submitted VP could contain a presentation_submission.
 */
@Entity()
export class PresentationSubmissionEntity {
  constructor(vp: VerifiablePresentation, verificationResult: ExchangeVerificationResult) {
    this.vpHolder = vp?.holder;
    this.verificationResult = verificationResult;
  }

  @PrimaryGeneratedColumn()
  id: string;

  /**
   * The result of the verification of the submitted VP
   */
  @Column('simple-json')
  verificationResult: ExchangeVerificationResult;

  @Column('text', { nullable: true })
  vpHolder: string;
}
