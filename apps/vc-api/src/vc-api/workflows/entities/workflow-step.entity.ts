/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { Column, Entity } from 'typeorm';
import { VpRequestQuery } from '../../exchanges/types/vp-request-query';
import { VpRequestInteractServiceDefinition } from '../../exchanges/types/vp-request-interact-service-definition';
import { ExchangeDefinitionDto } from '../../exchanges/dtos/exchange-definition.dto';

/**
 * A TypeOrm entity representing an exchange
 * https://w3c-ccg.github.io/vc-api/#exchange-examples
 *
 * Some discussion regarding the rational behind the names:
 * https://github.com/w3c-ccg/vc-api/pull/262#discussion_r805895143
 *
 * An exchange does not keep reference to its transactions
 * as the number of transactions grow quite high for a reusable exchange (e.g. "issue-degree" could issues thousands of degrees)
 */
@Entity()
export class WorkflowStepEntity {
  constructor(exchangeDefinitionDto: ExchangeDefinitionDto) {
    this.interactServiceDefinitions = exchangeDefinitionDto?.interactServices;
    this.query = exchangeDefinitionDto?.query;
  }

  @Column('simple-json')
  interactServiceDefinitions: VpRequestInteractServiceDefinition[];

  /**
   * From https://w3c-ccg.github.io/vp-request-spec/#format :
   * "To make a request for one or more objects wrapped in a Verifiable Presentation,
   *  a client constructs a JSON request describing one or more queries that it wishes to perform from the receiver."
   * "The query type serves as the main extension point mechanism for requests for data in the presentation."
   *
   * This property contains the queries that are to be instantiated in each transaction
   */
  @Column('simple-json')
  query: VpRequestQuery[];
}
