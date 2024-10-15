/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { Column, Entity } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { VpRequestQuery } from '../../exchanges/types/vp-request-query';
import { TransactionEntity } from '../../exchanges/entities/transaction.entity';
import { VpRequestInteractServiceDefinition } from '../../exchanges/types/vp-request-interact-service-definition';
import { VpRequestEntity } from '../../exchanges/entities/vp-request.entity';
import { CallbackConfiguration } from '../../exchanges/types/callback-configuration';
import { ExchangeDefinitionDto } from '../../exchanges/dtos/exchange-definition.dto';
import { ExchangeStepEntity } from './exchange-step.entity';

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
export class ExchangeEntity {
  constructor(exchangeDefinitionDto: ExchangeDefinitionDto) {
    this.exchangeId = exchangeDefinitionDto?.exchangeId;
  }

  @Column('text', { primary: true })
  exchangeId: string;

  @Column('text')
  ttl: string;

  @Column('text')
  state: string;

  @Column('text')
  step: string;

  @Column('simple-json')
  stepLog: ExchangeStepEntity[];

  /**
   * Create transaction associated with this exchange.
   *
   * Transactions are created by exchange (exchange is the aggregate root) because the exchange may want to enforce invariants such as
   * "This exchange may only have a single transaction" (i.e. see oneTimeTransactionId property)
   *
   * @param baseUrl The baseUrl to use for any interaction services
   * @returns
   */
  public participate(baseUrl?: string): ExchangeStepEntity {
    throw new Error('Not implemented');
  }
}
