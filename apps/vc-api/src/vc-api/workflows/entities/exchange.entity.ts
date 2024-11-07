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
import { VerifiablePresentation } from '../../exchanges/types/verifiable-presentation';
import { SubmissionVerifier } from '../../exchanges/types/submission-verifier';
import { QueryExchangeStep } from '../types/query-exchange-step';
import { IssuanceExchangeStep } from '../types/issuance-exchange-step';
import { ExchangeResponseDto } from '../dtos/exchange-response.dto';
import { CallbackConfiguration } from '../types/callback-configuration';

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

  public async participateInExchange(
    presentation: VerifiablePresentation,
    verifier: SubmissionVerifier,
    nextStep: WorkflowStepDefinitionDto,
    nextStepId: string
  ): Promise<{ response: ExchangeResponseDto; errors: string[]; callback: CallbackConfiguration[] }> {
    // Get current step
    const currentStep = this.getCurrentStep();
    // Pass presentation to current step to process
    const { errors } = await currentStep.processPresentation(presentation, verifier);
    // If step processing has errors, return errors
    if (errors.length > 0) {
      return {
        response: {},
        errors,
        callback: currentStep.callback
      };
    }

    // As there are no errors, advance step
    const hydratedNextStep = this.hydrateExchangeStep(nextStep, nextStepId);
    this.steps.push(hydratedNextStep);

    return {
      response: this.getExchangeResponse(),
      errors: [],
      callback: currentStep.callback
    };
  }

  /**
   *
   */
  public getExchangeResponse(): ExchangeResponseDto {
    // Get current step
    const currentStep = this.getCurrentStep();
    // Return step status
    return currentStep.getStepResponse();
  }

  private getCurrentStep() {
    return this.steps[-1];
  }

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
    const interactServices = step.verifiablePresentationRequest.interactServices.map((serviceDef) => {
      const serviceEndpoint = `${baseUrl}/workflows/${this.workflowId}/exchanges/${this.exchangeId}`;
      return {
        type: serviceDef.type,
        serviceEndpoint
      };
    });
    // Assuming that if step has a VPR, then it is query step
    if (step.verifiablePresentationRequest) {
      const challenge = uuidv4();
      const vpRequest: VpRequestDto = {
        challenge,
        query: step.verifiablePresentationRequest.query,
        interact: {
          service: interactServices
        },
        domain: baseUrl
      };
      return new QueryExchangeStep(stepId, vpRequest, step.callback);
    }
    // If the step doesn't have a VPR, then it must be for issuance
    else {
      return new IssuanceExchangeStep(stepId, step.callback);
    }
  }
}
