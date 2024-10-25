/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { Column, Entity } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { StepDefinitions, WorkflowConfigDto } from '../dtos/create-workflow-request.dto';
import { WorkflowStepDefinitionDto } from '../dtos/workflow-step-definition.dto';

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
export class WorkflowEntity {
  constructor(workflowConfig: WorkflowConfigDto) {
    this.workflowId = workflowConfig?.id ?? uuidv4();
    this.workflowSteps = workflowConfig?.steps;
    this.initialStep = workflowConfig?.initialStep;
  }

  @Column('text', { primary: true })
  workflowId: string;

  @Column('simple-json')
  workflowSteps: StepDefinitions;

  @Column('text')
  initialStep: string;

  /**
   * Get the first step in a workflow.
   * This can then be used to create a new exchange based on this workflow.
   *
   * @returns the first step in the workflow
   */
  public getInitialStep(): WorkflowStepDefinitionDto {
    return this.workflowSteps[this.initialStep];
  }

  // public getNextStep(currentStep: stepId): WorkflowStepDefinitionDto {
}
