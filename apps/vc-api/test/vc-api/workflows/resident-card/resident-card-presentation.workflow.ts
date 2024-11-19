/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { plainToClass } from 'class-transformer';
import { CreateWorkflowRequestDto } from '../../../../src/vc-api/workflows/dtos/create-workflow-request.dto';
import { VpRequestInteractServiceType } from '../../../../src/vc-api/workflows/types/vp-request-interact-service-type';
import { VpRequestQueryType } from '../../../../src/vc-api/exchanges/types/vp-request-query-type';

export class ResidentCardPresentation {
  #workflowId = `b229a18f-db45-4b33-8d36-25d442467bab`;
  #callbackUrl: string;
  queryType = VpRequestQueryType.presentationDefinition;

  constructor(callbackUrl: string) {
    this.#callbackUrl = callbackUrl;
  }

  getWorkflowId(): string {
    return this.#workflowId;
  }

  getWorkflowDefinition(): CreateWorkflowRequestDto {
    const permanentResidentQuery = {
      presentationDefinition: {
        id: '286bc1e0-f1bd-488a-a873-8d71be3c690e',
        input_descriptors: [
          {
            id: 'permanent_resident_card',
            name: 'Permanent Resident Card',
            purpose: 'We can only allow permanent residents into the application',
            constraints: {
              fields: [
                {
                  path: ['$.type'],
                  filter: {
                    type: 'array',
                    contains: {
                      type: 'string',
                      const: 'PermanentResidentCard'
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    };
    const exchangeDefinition: CreateWorkflowRequestDto = {
      config: {
        id: this.#workflowId,
        steps: {
          permanentResidentCheck: {
            verifiablePresentationRequest: {
              query: [
                {
                  type: this.queryType,
                  credentialQuery: [permanentResidentQuery]
                }
              ],
              interactServices: [
                {
                  type: VpRequestInteractServiceType.unmediatedPresentation
                }
              ]
            },
            callback: [
              {
                url: this.#callbackUrl
              }
            ],
            nextStep: undefined
          }
        },
        initialStep: 'permanentResidentCheck'
      }
    };
    return plainToClass(CreateWorkflowRequestDto, exchangeDefinition);
  }
}
