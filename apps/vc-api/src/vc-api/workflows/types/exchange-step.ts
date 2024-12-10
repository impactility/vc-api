/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExchangeResponseDto } from '../dtos/exchange-response.dto';
import { CallbackConfiguration } from './callback-configuration';
import { VerifiablePresentation } from '../types/verifiable-presentation';
import { SubmissionVerifier } from './submission-verifier';
import { ExchangeVerificationResultDto } from '../dtos/exchange-verification-result.dto';

export const EXCHANGE_STEP_STATES = {
  STARTED: 'started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
} as const;

export type ExchangeStepState = typeof EXCHANGE_STEP_STATES[keyof typeof EXCHANGE_STEP_STATES];

export abstract class ExchangeStep {
  constructor(stepId: string, callback: CallbackConfiguration[]) {
    this.stepId = stepId;
    this.callback = callback;
    this.state = EXCHANGE_STEP_STATES.STARTED;
  }

  stepId: string;
  state: ExchangeStepState;
  callback: CallbackConfiguration[];
  
  public abstract processPresentation(
    presentation: VerifiablePresentation,
    verifier: SubmissionVerifier
  ): Promise<{ errors: string[], verificationResult: ExchangeVerificationResultDto }>;

  public abstract getStepResponse(): ExchangeResponseDto;
}
