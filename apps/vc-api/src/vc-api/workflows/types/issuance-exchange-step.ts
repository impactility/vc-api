/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { VerifiablePresentation } from 'src/vc-api/exchanges/types/verifiable-presentation';
import { CallbackConfiguration } from './callback-configuration';
import { ExchangeStep } from './exchange-step';
import { ExchangeResponseDto } from '../dtos/exchange-response.dto';
import { ExchangeVerificationResultDto } from '../dtos/exchange-verification-result.dto';

export class IssuanceExchangeStep extends ExchangeStep {

  constructor(stepId: string, callback: CallbackConfiguration[], holderRedirectUrl: string) {
    super(stepId, callback);
    this.holderRedirectUrl = holderRedirectUrl;
  }

  holderRedirectUrl: string;

  issuedVP?: VerifiablePresentation;

  public addVP(issuanceVp: VerifiablePresentation): void {
    this.issuedVP = issuanceVp;
  }

  public processPresentation(): Promise<{ errors: string[], verificationResult: ExchangeVerificationResultDto }> {
    return Promise.resolve({
      errors: ['Issuance step does not support presentation processing'],
      verificationResult: null
    });
  }

  public getStepResponse(): ExchangeResponseDto {
    if (this.issuedVP) {
      return {
        verifiablePresentation: this.issuedVP
      };
    }
    // As the issuer hasn't provided VP yet, holder needs to poll until response updates
    else {
      return {
        redirectUrl: this.holderRedirectUrl
      };
    }
  }
}
