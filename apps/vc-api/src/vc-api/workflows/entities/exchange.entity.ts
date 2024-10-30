/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { Column, Entity } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ExchangeStep } from '../types/exchange-step';
import { WorkflowStepDefinitionDto } from '../dtos/workflow-step-definition.dto';
import { VpRequestDto } from '../dtos/vp-request.dto';
import { ExchangeState } from '../types/exchange-status';

/**
 * NEW exchange entity (for workflows)
 */
@Entity()
export class ExchangeEntity {
  constructor(workflowId: string, initialStepDefinition: WorkflowStepDefinitionDto, initialStepId: string) {
    this.exchangeId = uuidv4();
    this.workflowId = workflowId;
    this.steps = [];
    this.state = ExchangeState.pending;
    if (initialStepDefinition) {
      const initialStep = this.hydrateExchangeStep(initialStepDefinition, initialStepId);
      this.steps.push(initialStep);
    }
  }

  @Column('text', { primary: true })
  exchangeId: string;

  @Column('text')
  workflowId: string;

  @Column('simple-json')
  steps: ExchangeStep[];

  @Column('text')
  state: ExchangeState;

  /**
   * Convert from a workflow step definition to an instantiated step for an exchange
   * @param baseUrl
   * @param step
   * @returns
   */
  private hydrateExchangeStep(
    step: WorkflowStepDefinitionDto,
    stepId: string,
    baseUrl?: string
  ): ExchangeStep {
    const challenge = uuidv4();
    const interactServices = step.interactServices.map((serviceDef) => {
      const serviceEndpoint = `${baseUrl}/workflows/${this.workflowId}/exchanges/${this.exchangeId}`;
      return {
        type: serviceDef.type,
        serviceEndpoint
      };
    });
    const vpRequest: VpRequestDto = {
      challenge,
      query: step.query,
      interact: {
        service: interactServices
      },
      domain: baseUrl
    };
    return new ExchangeStep(stepId, vpRequest, step.callback);
  }
}
