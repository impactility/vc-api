/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWK } from 'jose';
import { TypeOrmSQLiteModule } from '../in-memory-db';
import { KeyPair } from './key-pair.entity';
import { keyType } from './key-types';
import { KeyService } from './key.service';
import { CredoModule } from '../credo/credo.module';
import { credoTestSuite, ICredoTestSuite } from '../credo/credo.test.suite';
import { CredoService } from '../credo/credo.service';
import { Base64ToBase58 } from '../utils/crypto.utils';

describe('KeyService', () => {
  let service: KeyService;
  let newPublicKey: JWK;
  let mockCredoService: ICredoTestSuite;
  
  beforeEach(async () => {
    mockCredoService = await credoTestSuite();
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmSQLiteModule(), TypeOrmModule.forFeature([KeyPair]), CredoModule],
      providers: [KeyService]
    })
    .overrideProvider(CredoService)
    .useValue(mockCredoService)
    .compile();

    service = module.get<KeyService>(KeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return undefined if asked for privateKey that it does not have', async () => {
    const result = await service.getPublicKeyFromKeyId('thumbprint-of-not-available-key');
    expect(result).toBeUndefined();
  });

  describe('Ed25519', () => {
    beforeEach(async () => {
      const keyDescription = await service.generateKey({ type: keyType.ed25519 });
      newPublicKey = await service.getPublicKeyFromKeyId(keyDescription.keyId);
    });
    keyGenerationTest();
  });

  // describe('Secp256k1', () => {
  //   beforeEach(async () => {
  //     const keyDescription = await service.generateKey({ type: keyType.secp256k1 });
  //     newPublicKey = await service.getPublicKeyFromKeyId(keyDescription.keyId);
  //   });
  //   keyGenerationTest();
  // });

  function keyGenerationTest() {
    /**
     * From https://www.w3.org/TR/did-core/#verification-material :
     * "It is RECOMMENDED that JWK kid values are set to the public key fingerprint [RFC7638]."
     */
    // it('kid of generated key should be thumbprint', async () => {
    //   const thumbprint = await calculateJwkThumbprint(newPublicKey, 'sha256');
    //   expect(newPublicKey.kid).toEqual(thumbprint);
    // });

    it('should generate and retrieve a key', async () => {
      const kid = Base64ToBase58(newPublicKey.x);
      const storedPublicKey = await service.getPublicKeyFromKeyId(kid);
      expect(storedPublicKey).toBeDefined();
      expect(storedPublicKey).toMatchObject(newPublicKey);
    });
  }
});
