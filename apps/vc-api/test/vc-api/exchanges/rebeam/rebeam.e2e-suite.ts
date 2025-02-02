/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as request from 'supertest';
import * as nock from 'nock';
import { ProofPurpose } from '@sphereon/pex';
import { RebeamCpoNode } from './rebeam-cpo-node';
import { app, getContinuationEndpoint, vcApiBaseUrl, walletClient } from '../../../app.e2e-spec';
import { RebeamSupplier } from './rebeam-supplier';
import { getChargingDataCredential, presentationDefinition } from '../../credential.service.spec.data';
import { ProvePresentationOptionsDto } from '../../../../src/vc-api/credentials/dtos/prove-presentation-options.dto';

export const rebeamLegacyExchangeSuite = () => {
  it('Rebeam presentation using ed25119 signatures', async () => {
    const holderDIDDoc = await walletClient.createDID('key');
    const holderVerificationMethod = holderDIDDoc.verificationMethod[0].id;

    // SUPPLIER: Issue "rebeam-customer" credential
    const supplier = new RebeamSupplier();
    const energyContractVp = await supplier.issueCredential(holderDIDDoc, walletClient);
    const credential = getChargingDataCredential(holderDIDDoc.id);
    const chargingDataVerifiableCredential = await walletClient.issueVC({
      credential,
      options: {}
    });

    // CPO-NODE: Configure presentation exchange
    const callbackUrlBase = 'http://example.com';
    const callbackUrlPath = '/endpoint';
    const presentationExchange = new RebeamCpoNode(`${callbackUrlBase}${callbackUrlPath}`);
    const scope = nock(callbackUrlBase).post(callbackUrlPath).reply(201);
    const exchangeDef = presentationExchange.getExchangeDefinition();
    await request(app.getHttpServer()).post(`${vcApiBaseUrl}/exchanges`).send(exchangeDef).expect(201);

    // HOLDER WALLET (Switchboard): Start presentation exchange and present credential
    const exchangeEndpoint = `${vcApiBaseUrl}/exchanges/${presentationExchange.getExchangeId()}`;
    const presentationVpRequest = await walletClient.startExchange(
      exchangeEndpoint,
      presentationExchange.queryType
    );
    const presentationExchangeContinuationEndpoint = getContinuationEndpoint(presentationVpRequest);
    expect(presentationExchangeContinuationEndpoint).toContain(exchangeEndpoint);

    const presentation = await walletClient.presentationFrom(presentationDefinition, [
      energyContractVp.vp.verifiableCredential[0],
      chargingDataVerifiableCredential
    ]);

    const presentationOptions: ProvePresentationOptionsDto = {
      proofPurpose: ProofPurpose.authentication,
      verificationMethod: holderVerificationMethod,
      challenge: presentationVpRequest.challenge
    };
    const vp = await walletClient.provePresentation({ presentation, options: presentationOptions });

    // Holder submits presentation
    await walletClient.continueExchange(presentationExchangeContinuationEndpoint, vp, false);
    scope.done();
  });

  it('should throw an error when presentation definition contain more then one `credentialQuery` item', async () => {
    const presentationExchange = new RebeamCpoNode(``);
    const exchangeDef = presentationExchange.getInvalidExchangeDefinition();
    await request(app.getHttpServer()).post(`${vcApiBaseUrl}/exchanges`).send(exchangeDef).expect(400);
  });
};
