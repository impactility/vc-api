/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DIDAuth } from '@spruceid/didkit-wasm-node';
import { JWK } from 'jose';
import { DIDService } from '../../did/did.service';
import { KeyService } from '../../key/key.service';
import { IssueOptionsDto } from './dtos/issue-options.dto';
import { IssueCredentialDto } from './dtos/issue-credential.dto';
import { VerifiableCredentialDto } from './dtos/verifiable-credential.dto';
import { VerifiablePresentationDto } from './dtos/verifiable-presentation.dto';
import { VerifyOptionsDto } from './dtos/verify-options.dto';
import { VerificationResultDto } from './dtos/verification-result.dto';
import { AuthenticateDto } from './dtos/authenticate.dto';
import { ProvePresentationDto } from './dtos/prove-presentation.dto';
import { CredentialVerifier } from './types/credential-verifier';
import { PresentationDto } from './dtos/presentation.dto';
import { IPresentationDefinition, IVerifiableCredential, PEX, ProofPurpose, Status } from '@sphereon/pex';
import { VerificationMethod } from 'did-resolver';
import { ProvePresentationOptionsDto } from './dtos/prove-presentation-options.dto';
import { didKitExecutor } from './utils/did-kit-executor.function';
import { CredoService } from '../../credo/credo.service';
import {
  ClaimFormat,
  JsonTransformer,
  W3cCredential,
  W3cJsonLdSignCredentialOptions,
  W3cJsonLdVerifiableCredential,
  W3cJsonLdVerifiablePresentation,
  W3cJsonLdVerifyCredentialOptions,
  W3cPresentation,
  W3cSignPresentationOptions,
  W3cVerifiableCredential,
  W3cVerifyCredentialOptions,
  W3cVerifyCredentialResult,
  W3cVerifyPresentationOptions
} from '@credo-ts/core';
import { CreatePresentationDto } from './dtos/create-presentation.dto';

/**
 * Credential issuance options that Spruce accepts
 * Full options are here: https://github.com/spruceid/didkit/blob/main/cli/README.md#didkit-vc-issue-credential
 */
interface ISpruceIssueOptions {
  proofPurpose: string;
  verificationMethod: string;
  created?: string;
  challenge?: string;
}

/**
 * Credential verification options that Spruce accepts
 * Full options are here: https://github.com/spruceid/didkit/blob/main/cli/README.md#didkit-vc-verify-credential
 */
interface ISpruceVerifyOptions {
  challenge?: string;
}

/**
 * This service provide the VC-API operations
 * This encapsulates the use of Spruce DIDKit
 */
@Injectable()
export class CredentialsService implements CredentialVerifier {
  constructor(
    private didService: DIDService,
    private keyService: KeyService,
    private credoService: CredoService
  ) {}

  async issueCredential(issueDto: IssueCredentialDto): Promise<VerifiableCredentialDto> {
    const verificationMethod = await this.getVerificationMethodForDid(
      typeof issueDto.credential.issuer === 'string'
        ? issueDto.credential.issuer
        : issueDto.credential.issuer.id
    );
    const credentialOption: W3cJsonLdSignCredentialOptions = {
      credential: W3cCredential.fromJson(issueDto.credential), //JsonTransformer.fromJSON(issueDto.credential, W3cCredential),
      format: ClaimFormat.LdpVc,
      proofType: 'Ed25519Signature2018',
      verificationMethod: verificationMethod.id
    };
    const w3cVerifiableCredential =
      await this.credoService.agent.w3cCredentials.signCredential<ClaimFormat.LdpVc>(credentialOption);
    return w3cVerifiableCredential.toJson() as VerifiableCredentialDto;
  }

  async verifyCredential(
    vc: VerifiableCredentialDto,
    options: VerifyOptionsDto
  ): Promise<VerificationResultDto> {
    const w3cVerifyCredentialOptions: W3cVerifyCredentialOptions<ClaimFormat.LdpVc> = {
      credential: W3cJsonLdVerifiableCredential.fromJson(vc) //JsonTransformer.fromJSON(vc, W3cJsonLdVerifiableCredential),
    };
    const obj = { ...w3cVerifyCredentialOptions };
    const verifyCredential: W3cVerifyCredentialResult =
      await this.credoService.agent.w3cCredentials.verifyCredential(obj as any);
    return verifyCredential;
  }

  /**
   * Assembles presentation from provided credentials according to definition
   */
  async presentationFrom({ credentials, id, holder }: CreatePresentationDto): Promise<PresentationDto> {
    const presentation = await this.credoService.agent.w3cCredentials.createPresentation({
      credentials: credentials.map((credential) => W3cJsonLdVerifiableCredential.fromJson(credential)),
      holder,
      id
    });
    return JsonTransformer.toJSON(presentation) as PresentationDto;
  }

  async provePresentation(provePresentationDto: ProvePresentationDto): Promise<VerifiablePresentationDto> {
    const verificationMethod = await this.getVerificationMethodForDid(
      provePresentationDto.presentation.verifiableCredential[0].credentialSubject.id as string
    );

    const signPresentationOption: W3cSignPresentationOptions<ClaimFormat.LdpVp> = {
      presentation: JsonTransformer.fromJSON(provePresentationDto.presentation, W3cPresentation),
      challenge: provePresentationDto.options.challenge,
      verificationMethod: verificationMethod.id,
      format: ClaimFormat.LdpVp,
      proofType: 'Ed25519Signature2018',
      proofPurpose: provePresentationDto.options.proofPurpose
    };
    const w3cVerifiablePresentation =
      await this.credoService.agent.w3cCredentials.signPresentation<ClaimFormat.LdpVp>(
        signPresentationOption
      );

    return w3cVerifiablePresentation.toJson() as VerifiablePresentationDto;
  }

  /**
   * Provide authentication as DID in response to DIDAuth Request
   * https://w3c-ccg.github.io/vp-request-spec/#did-authentication-request
   */
  async didAuthenticate(authenticateDto: AuthenticateDto): Promise<VerifiablePresentationDto> {
    if (authenticateDto.options.proofPurpose !== ProofPurpose.authentication) {
      throw new BadRequestException('proof purpose must be authentication for DIDAuth');
    }

    const verificationMethodId =
      authenticateDto.options.verificationMethod ??
      (await this.getVerificationMethodForDid(authenticateDto.did)).id;

    const key = await this.getKeyForVerificationMethod(verificationMethodId);
    const proofOptions = this.mapVcApiPresentationOptionsToSpruceIssueOptions(authenticateDto.options);

    return didKitExecutor<VerifiablePresentationDto>(
      () => DIDAuth(authenticateDto.did, JSON.stringify(proofOptions), JSON.stringify(key)),
      'DIDAuth'
    );
  }

  async verifyPresentation(
    vp: VerifiablePresentationDto,
    options: VerifyOptionsDto
  ): Promise<VerificationResultDto> {
    const verifyOptions: ISpruceVerifyOptions = options;
    const w3cVerifyPresentationOptions: W3cVerifyPresentationOptions = {
      presentation: JsonTransformer.fromJSON(vp, W3cJsonLdVerifiablePresentation),
      challenge: verifyOptions.challenge
    };
    const verifyPresentation = await this.credoService.agent.w3cCredentials.verifyPresentation(
      w3cVerifyPresentationOptions
    );
    return verifyPresentation;
  }

  private async getVerificationMethodForDid(did: string): Promise<VerificationMethod> {
    const didDoc = await this.didService.getDID(did);

    if (!didDoc) {
      throw new BadRequestException(`DID="${did}" does not exist`);
    }

    return didDoc.verificationMethod[0];
  }

  /**
   * TODO: Maybe we should check if the issuer of the credential controls the associated verification method
   * @param desiredVerificationMethod
   * @returns the privateKey that can issue proofs as the verification method
   */
  private async getKeyForVerificationMethod(desiredVerificationMethodId: string): Promise<JWK> {
    const verificationMethod = await this.didService.getVerificationMethod(desiredVerificationMethodId);
    if (!verificationMethod) {
      throw new InternalServerErrorException('This verification method is not known to this wallet');
    }
    const keyID = verificationMethod.publicKeyJwk?.kid;
    if (!keyID) {
      throw new InternalServerErrorException(
        'There is no key ID (kid) associated with this verification method. Unable to retrieve private key'
      );
    }
    const privateKey = await this.keyService.getPrivateKeyFromKeyId(keyID);
    if (!privateKey) {
      throw new InternalServerErrorException('Unable to retrieve private key for this verification method');
    }
    return privateKey;
  }

  /**
   * As the Spruce proof issuance options may not align perfectly with the VC-API spec issuanceOptions,
   * this method provides a translation between the two
   * @param options
   * @returns
   */
  private mapVcApiIssueOptionsToSpruceIssueOptions(
    options: IssueOptionsDto,
    verificationMethodId: string
  ): ISpruceIssueOptions {
    return {
      proofPurpose: ProofPurpose.assertionMethod, // Issuance is always an "assertion" proof, AFAIK
      verificationMethod: verificationMethodId,
      created: options.created,
      challenge: options.challenge
    };
  }

  /**
   * As the Spruce proof presentation options may not align perfectly with the VC-API spec provePresentationOptions,
   * this method provides a translation between the two
   * @param options
   * @returns
   */
  private mapVcApiPresentationOptionsToSpruceIssueOptions(
    options: ProvePresentationOptionsDto
  ): ISpruceIssueOptions {
    return {
      proofPurpose: options.proofPurpose,
      verificationMethod: options.verificationMethod,
      created: options.created,
      challenge: options.challenge
    };
  }
}
