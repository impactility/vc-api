/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExchangeResponseDto } from '../dtos/exchange-response.dto';
import { VpRequestDto } from '../dtos/vp-request.dto';
import { CallbackConfiguration } from './callback-configuration';
import { ExchangeStep } from './exchange-step';
import { SubmissionVerifier } from './submission-verifier';
import { VerifiablePresentation } from '../types/verifiable-presentation';
import { PresentationSubmission } from './presentation-submission';
import { Column } from 'typeorm';
import { ExchangeVerificationResultDto } from '../dtos/exchange-verification-result.dto';

export class QueryExchangeStep extends ExchangeStep {
  constructor(stepId: string, vpRequest: VpRequestDto, callback: CallbackConfiguration[]) {
    super(stepId, callback);
    this.vpRequest = vpRequest;
  }

  @Column('simple-json')
  vpRequest: VpRequestDto;

  @Column('simple-json')
  presentationSubmission?: PresentationSubmission;

  /**
   * Process a presentation submission.
   * @param presentation
   * @param verifier
   */
  public async processPresentation(
    presentation: VerifiablePresentation,
    verifier: SubmissionVerifier
  ): Promise<{ errors: string[]; verificationResult: ExchangeVerificationResultDto }> {
    const verificationResult = await verifier.verifyVpRequestSubmission(presentation, this.vpRequest);

    const errors = verificationResult.errors;
    this.presentationSubmission = new PresentationSubmission(presentation, verificationResult);
    // If no errors, then assume that verification was successful and so query is complete
    if (errors.length == 0) {
      this.markComplete();
    }
    return { errors, verificationResult };
  }

  public getStepResponse(): ExchangeResponseDto {
    return {
      verifiablePresentationRequest: this.vpRequest
    };
  }
}
