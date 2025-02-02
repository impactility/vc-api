/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { VcApiController } from './vc-api.controller';
import { CredentialsService } from './credentials/credentials.service';
import { ExchangeService } from './exchanges/exchange.service';
import { WorkflowService } from './workflows/workflow.service';

describe('VcApiController', () => {
  let controller: VcApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VcApiController],
      providers: [
        {
          provide: CredentialsService,
          useValue: {}
        },
        {
          provide: ExchangeService,
          useValue: {}
        },
        {
          provide: WorkflowService,
          useValue: {}
        }
      ]
    }).compile();

    controller = module.get<VcApiController>(VcApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
