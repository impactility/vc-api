/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { VerifiablePresentation } from 'src/vc-api/exchanges/types/verifiable-presentation';
import { CallbackConfiguration } from './callback-configuration';
import { ExchangeStep } from './exchange-step';
import { ExchangeResponseDto } from '../dtos/exchange-response.dto';

export class IssuanceExchangeStep extends ExchangeStep {
  constructor(stepId: string, callback: CallbackConfiguration[]) {
    super(stepId, callback);
  }

  /**
   * TODO: decide if needs to be an entity
   */
  // @OneToOne(() => PresentationReviewEntity, {
  //   cascade: true,
  //   nullable: true
  // })
  // @JoinColumn()
  issuedVP?: VerifiablePresentation;

  public addVP(issuanceVp: VerifiablePresentation): void {
    this.issuedVP = issuanceVp;
  }

  public processPresentation(): Promise<{ errors: string[] }> {
    return Promise.resolve({
      errors: ['Issuance step does not support presentation processing']
    });
  }

  public getStepResponse(): ExchangeResponseDto {
    if (this.issuedVP) {
      return {
        verifiablePresentation: this.issuedVP
      };
    } else {
      return {
        redirectUrl: ''
      };
    }
  }
}
