/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmSQLiteModule } from '../in-memory-db';
import { KeyModule } from '../key/key.module';
import { KeyService } from '../key/key.service';
import { DIDService } from './did.service';
import { DIDDocumentEntity } from './entities/did-document.entity';
import { VerificationMethodEntity } from './entities/verification-method.entity';
import { CredoModule } from '../credo/credo.module';
import { CredoService } from '../credo/credo.service';
import { KeyPairDto } from '../key/dtos/key-pair.dto';
import { credoTestSuite, ICredoTestSuite } from '../credo/credo.test.suite';

describe('DIDService', () => {
  let service: DIDService;
  let keyService: KeyService;
  let mockCredoService: ICredoTestSuite;
  beforeEach(async () => {
    mockCredoService = await credoTestSuite();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        KeyModule,
        CredoModule,
        TypeOrmSQLiteModule(),
        TypeOrmModule.forFeature([DIDDocumentEntity, VerificationMethodEntity])
      ],
      providers: [DIDService]
    })
    .overrideProvider(CredoService)
    .useValue(mockCredoService)
    .compile();

    keyService = module.get<KeyService>(KeyService);
    service = module.get<DIDService>(DIDService);
  });

  // close the agent and remove test wallet
  afterAll(async () => {
    await mockCredoService.agent.shutdown();
    await mockCredoService.agent.wallet.delete();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    // it('should generate an did:ethr DID', async () => {
    //   const did = await service.generateEthrDID();
    //   expect(did.id).toBeDefined();
    //   expect(did.verificationMethod?.length).toEqual(1);
    // });

    it('should generate a did:key DID', async () => {
      const did = await service.generateKeyDID();
      expect(did.id).toBeDefined();
      expect(did.verificationMethod?.length).toEqual(1);
    });
  });

  describe('register', () => {
    it('should register a did:key DID from an existing key pair', async () => {
      const keyPair: KeyPairDto = {
        "privateKey": {
          "crv": "Ed25519",
          "d": "_jFgdqwaqQD9lt7rXnnFy7dTXnf07TiaSSIl7pMPOII",
          "x": "Uo2XCpA1tvl3jK9zsYy947H6gfMt_3UjbIg9dLwvbvs",
          "kty": "OKP"
        },
        "publicKey": {
          "crv": "Ed25519",
          "x": "Uo2XCpA1tvl3jK9zsYy947H6gfMt_3UjbIg9dLwvbvs",
          "kty": "OKP",
          "kid": "jNlE5CHnmtcvvNmNWaJqBDYg0dU9bey7m9SXsw1r-2A"
        }
      };
      const existingKey = await keyService.importKey(keyPair);
      const did = await service.registerKeyDID(existingKey.keyId);
      expect(did.id).toBeDefined();
      expect(did.verificationMethod?.length).toEqual(1);
    });
  });
});
