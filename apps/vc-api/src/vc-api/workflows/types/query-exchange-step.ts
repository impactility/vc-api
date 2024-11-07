/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExchangeResponseDto } from '../dtos/exchange-response.dto';
import { VpRequestDto } from '../dtos/vp-request.dto';
import { CallbackConfiguration } from './callback-configuration';
import { ExchangeStep } from './exchange-step';
import { SubmissionVerifier } from './submission-verifier';
// TODO: move to a common place (can probably be in the credentials module)
import { VerifiablePresentation } from '../../exchanges/types/verifiable-presentation';
import { PresentationSubmission } from './presentation-submission';
import { Column } from 'typeorm';

export class QueryExchangeStep extends ExchangeStep {
  constructor(stepId: string, vpRequest: VpRequestDto, callback: CallbackConfiguration[]) {
    super(stepId, callback);
    this.verifiablePresentationRequest = vpRequest;
  }

  @Column('simple-json')
  verifiablePresentationRequest: VpRequestDto;

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
  ): Promise<{ errors: string[] }> {
    const verificationResult = await verifier.verifyVpRequestSubmission(
      presentation,
      this.verifiablePresentationRequest
    );
    const errors = verificationResult.errors;
    this.presentationSubmission = new PresentationSubmission(presentation, verificationResult);
    return { errors };
  }

  public getStepResponse(): ExchangeResponseDto {
    return {
      verifiablePresentationRequest: this.verifiablePresentationRequest
    };
  }
}
