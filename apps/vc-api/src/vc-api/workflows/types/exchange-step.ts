/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { VpRequestDto } from '../dtos/vp-request.dto';
import { CallbackConfiguration } from './callback-configuration';

export class ExchangeStep {
  constructor(stepId: string, vpRequest: VpRequestDto, callback: CallbackConfiguration[]) {
    this.stepId = stepId;
    this.verifiablePresentationRequest = vpRequest;
    this.callback = callback;
  }

  stepId: string;

  verifiablePresentationRequest: VpRequestDto;

  /**
   * From https://w3c-ccg.github.io/vp-request-spec/#format :
   * "To make a request for one or more objects wrapped in a Verifiable Presentation,
   *  a client constructs a JSON request describing one or more queries that it wishes to perform from the receiver."
   * "The query type serves as the main extension point mechanism for requests for data in the presentation."
   *
   * This property contains the queries that are to be instantiated in each transaction
   */
  callback: CallbackConfiguration[];
}
