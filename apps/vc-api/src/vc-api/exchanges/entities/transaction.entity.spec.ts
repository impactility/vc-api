/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { PresentationReviewStatus } from '../types/presentation-review-status';
import { SubmissionVerifier } from '../types/submission-verifier';
import { VpRequestInteractServiceType } from '../types/vp-request-interact-service-type';
import { TransactionDidForbiddenException, TransactionEntity } from './transaction.entity';
import { VpRequestEntity } from './vp-request.entity';

describe('TransactionEntity', () => {
  const challenge = 'a9511bdb-5577-4d2f-95e3-e819fe5d3c33';
  const callback_1 = 'https://my-callback.com';
  const configuredCallback = [{ url: callback_1 }];
  const exchangeId = 'my-exchange';
  const transactionId = '9ec5686e-6381-41c4-9286-3c93cdefac53';

  const vp = {
    '@context': [],
    type: [],
    verifiableCredential: [],
    proof: {
      challenge
    },
    holder: 'did:key:z6MkuwwWSi4W3Hw33XUbdzmFaByEpCfWTuMN5huHaPNSZPB7'
  };

  const submissionVerificationResult = {
    verified: true,
    warnings: [],
    errors: []
  };

  const mockSubmissionVerifier: SubmissionVerifier = {
    verifyVpRequestSubmission: jest.fn().mockResolvedValue(submissionVerificationResult)
  };

  describe('mediatedPresentation interact service type', () => {
    describe('constructor', () => {
      const vpRequest: VpRequestEntity = {
        challenge,
        query: [],
        interact: {
          service: [
            {
              type: VpRequestInteractServiceType.mediatedPresentation,
              serviceEndpoint: 'https://endpoint.com'
            }
          ]
        }
      };
      it('should create a transaction with pending review', async () => {
        const transaction = new TransactionEntity(transactionId, exchangeId, vpRequest, configuredCallback);
        expect(transaction.presentationReview.reviewStatus).toEqual(
          PresentationReviewStatus.pendingSubmission
        );
      });
      it('should process a presentation submission', async () => {
        const transaction = new TransactionEntity(transactionId, exchangeId, vpRequest, configuredCallback);
        const { callback } = await transaction.processPresentation(vp, mockSubmissionVerifier);
        expect(transaction.presentationSubmission.vpHolder).toEqual(vp.holder);
        expect(transaction.presentationSubmission.verificationResult).toEqual(submissionVerificationResult);
        expect(transaction.presentationReview.reviewStatus).toEqual(PresentationReviewStatus.pendingReview);
        expect(transaction.presentationReview.VP).toEqual(undefined); // Issuer hasn't submitted a VP yet
        expect(callback).toEqual(configuredCallback);
      });
    });
  });

  describe('processPresentation', () => {
    it('should return result upon successful verification of UnMediatedPresentation', async () => {
      const vpRequest: VpRequestEntity = {
        challenge,
        query: [],
        interact: {
          service: [
            {
              type: VpRequestInteractServiceType.unmediatedPresentation,
              serviceEndpoint: 'https://endpoint.com'
            }
          ]
        }
      };
      const transaction = new TransactionEntity(transactionId, exchangeId, vpRequest, configuredCallback);
      const { callback, response } = await transaction.processPresentation(vp, mockSubmissionVerifier);
      expect(callback).toHaveLength(1);
      expect(callback[0].url).toEqual(callback_1);
      expect(response.errors).toHaveLength(0);
      expect(response.vpRequest).toBeUndefined();
      expect(response.vp).toBeUndefined(); // No issued credentials in the VP
      expect(transaction.presentationSubmission.verificationResult).toEqual(submissionVerificationResult);
      expect(transaction.presentationSubmission.vpHolder).toEqual(vp.holder);
    });
  });

  it('should throw a TransactionDidForbiddenException exception when called second time with holder non matching', async function () {
    const vpRequest: VpRequestEntity = {
      challenge,
      query: [],
      interact: {
        service: [
          {
            type: VpRequestInteractServiceType.unmediatedPresentation,
            serviceEndpoint: 'https://endpoint.com'
          }
        ]
      }
    };
    const transaction = new TransactionEntity(transactionId, exchangeId, vpRequest, configuredCallback);
    await transaction.processPresentation(vp, mockSubmissionVerifier);

    const vp2 = { ...vp, holder: 'invalid holder' };

    await expect(transaction.processPresentation(vp2, mockSubmissionVerifier)).rejects.toThrow(
      TransactionDidForbiddenException
    );
    await expect(transaction.processPresentation(vp2, mockSubmissionVerifier)).rejects.toThrow(
      'DID does not match the DID that initially submitted the presentation'
    );
  });
});
