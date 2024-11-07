/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExchangeResponseDto } from '../dtos/exchange-response.dto';
import { CallbackConfiguration } from './callback-configuration';
// TODO: move to a common place (can probably be in the credentials module)
import { VerifiablePresentation } from '../../exchanges/types/verifiable-presentation';
import { SubmissionVerifier } from './submission-verifier';

export abstract class ExchangeStep {
  constructor(stepId: string, callback: CallbackConfiguration[]) {
    this.stepId = stepId;
    this.callback = callback;
  }

  stepId: string;

  callback: CallbackConfiguration[];

  public abstract processPresentation(
    presentation: VerifiablePresentation,
    verifier: SubmissionVerifier
  ): Promise<{ errors: string[] }>;

  public abstract getStepResponse(): ExchangeResponseDto;
}
