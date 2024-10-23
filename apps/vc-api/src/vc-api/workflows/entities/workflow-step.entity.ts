/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { Column, Entity } from 'typeorm';
import { v4 as uuid4 } from 'uuid';
import { WorkflowStepDto } from '../dtos/workflow-step.dto';
import { VpRequestDto } from '../dtos/vp-request.dto';
import { CallbackConfiguration } from '../types/callback-configuration';

/**
 * A TypeOrm entity representing a workflow step
 * https://w3c-ccg.github.io/vc-api/#exchange-examples
 *
 * An exchange does not keep reference to its transactions
 * as the number of transactions grow quite high for a reusable exchange (e.g. "issue-degree" could issues thousands of degrees)
 */
@Entity()
export class WorkflowStepEntity {
  constructor(workflowStepDto: WorkflowStepDto) {
    this.verifiablePresentationRequest = workflowStepDto?.verifiablePresentationRequest;
    this.callback = workflowStepDto?.callback;
    this.stepId = uuid4();
  }

  @Column('text', { primary: true })
  stepId: string;

  @Column('simple-json')
  verifiablePresentationRequest: VpRequestDto;

  /**
   * From https://w3c-ccg.github.io/vp-request-spec/#format :
   * "To make a request for one or more objects wrapped in a Verifiable Presentation,
   *  a client constructs a JSON request describing one or more queries that it wishes to perform from the receiver."
   * "The query type serves as the main extension point mechanism for requests for data in the presentation."
   *
   * This property contains the queries that are to be instantiated in each transaction
   */
  @Column('simple-json')
  callback: CallbackConfiguration[];
}
