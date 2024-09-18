/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import { DIDAuth } from '@spruceid/didkit-wasm-node';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { JWK } from 'jose';
import { DIDService } from '../../did/did.service';
import { KeyService } from '../../key/key.service';
import { IssueOptionsDto } from './dtos/issue-options.dto';
import { IssueCredentialDto } from './dtos/issue-credential.dto';
import { VerifiableCredentialDto } from './dtos/verifiable-credential.dto';
import { VerifiablePresentationDto } from './dtos/verifiable-presentation.dto';
import { VerifyOptionsDto } from './dtos/verify-options.dto';
import { VerificationResultDto } from './dtos/verification-result.dto';
import { ProvePresentationDto } from './dtos/prove-presentation.dto';
import { CredentialVerifier } from './types/credential-verifier';
import { PresentationDto } from './dtos/presentation.dto';
import { IPresentationDefinition, IVerifiableCredential, PEX, ProofPurpose, Status } from '@sphereon/pex';
import { DIDDocument, VerificationMethod } from 'did-resolver';
import { ProvePresentationOptionsDto } from './dtos/prove-presentation-options.dto';
import { CredoService } from '../../credo/credo.service';
import {
  ClaimFormat,
  JsonTransformer,
  W3cCredential,
  W3cJsonLdSignCredentialOptions,
  W3cJsonLdVerifiableCredential,
  W3cJsonLdVerifiablePresentation,
  W3cPresentation,
  W3cSignPresentationOptions,
  W3cVerifyCredentialOptions,
  W3cVerifyCredentialResult,
  W3cVerifyPresentationOptions
} from '@credo-ts/core';
import { AuthenticateDto } from './dtos/authenticate.dto';
import { didKitExecutor } from './utils/did-kit-executor.function';
import { transformVerificationResult } from './utils/verification-result-transformer';

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
      credential: W3cCredential.fromJson(issueDto.credential),
      format: ClaimFormat.LdpVc,
      proofType: 'Ed25519Signature2018',
      verificationMethod: verificationMethod.id
    };
    const w3cVerifiableCredential =
      await this.credoService.agent.w3cCredentials.signCredential<ClaimFormat.LdpVc>(credentialOption);
    return w3cVerifiableCredential.toJson() as VerifiableCredentialDto;
  }

  async verifyCredential(vc: VerifiableCredentialDto): Promise<VerificationResultDto> {
    const w3cVerifyCredentialOptions: W3cVerifyCredentialOptions<ClaimFormat.LdpVc> = {
      credential: W3cJsonLdVerifiableCredential.fromJson(vc)
    };
    const obj = { ...w3cVerifyCredentialOptions };
    const verifyCredential: W3cVerifyCredentialResult =
      await this.credoService.agent.w3cCredentials.verifyCredential(obj as any);
    return transformVerificationResult(verifyCredential);
  }

  /**
   * Assembles presentation from provided credentials according to definition
   */
  presentationFrom(
    presentationDefinition: IPresentationDefinition,
    credentials: VerifiableCredentialDto[]
  ): PresentationDto {
    const pex = new PEX();
    // presentation should be created from selected credentials https://github.com/Sphereon-Opensource/pex/issues/91#issuecomment-1115940908
    const { verifiableCredential, areRequiredCredentialsPresent } = pex.selectFrom(
      presentationDefinition,
      credentials as IVerifiableCredential[]
    );
    if (areRequiredCredentialsPresent !== Status.INFO) {
      throw new InternalServerErrorException('Credentials do not satisfy defintion');
    }
    const presentation = pex.presentationFrom(presentationDefinition, verifiableCredential);

    const submissionContextUri = 'https://identity.foundation/presentation-exchange/submission/v1';

    presentation['@context'] = Array.isArray(presentation['@context'])
      ? presentation['@context']
      : [presentation['@context']];

    presentation['@context'] = presentation['@context'].filter((c) => c !== submissionContextUri);
    return presentation as PresentationDto;
  }

  async provePresentation(provePresentationDto: ProvePresentationDto): Promise<VerifiablePresentationDto> {
    const verificationMethodId =
      provePresentationDto.options.verificationMethod ??
      (await this.getVerificationMethodForDid(provePresentationDto.presentation.holder)).id;

    const signPresentationOption: W3cSignPresentationOptions<ClaimFormat.LdpVp> = {
      presentation: JsonTransformer.fromJSON(provePresentationDto.presentation, W3cPresentation, {
        validate: false
      }),
      challenge: provePresentationDto.options.challenge,
      verificationMethod: verificationMethodId,
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
    const signPresentationDto: ProvePresentationDto = {
      presentation: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation', 'DidAuth'],
        holder: authenticateDto.did
      },
      options: authenticateDto.options
    };

    const signed = await this.provePresentation(signPresentationDto);

    return signed;
  }

  async verifyPresentation(
    vp: VerifiablePresentationDto,
    options: VerifyOptionsDto
  ): Promise<VerificationResultDto> {
    const w3cVerifyPresentationOptions: W3cVerifyPresentationOptions = {
      presentation: JsonTransformer.fromJSON(vp, W3cJsonLdVerifiablePresentation, {
        // Credo is expecting the the verifiableCredential property in a VP
        // However, this property is optional in both the v1.1 and v2 VC data models
        // For example, it isn't present if the VP is only for authentication
        validate: !(vp.verifiableCredential === undefined)
      }),
      challenge: options.challenge ?? vp.proof.challenge
    };
    const verifyPresentation = await this.credoService.agent.w3cCredentials.verifyPresentation(
      w3cVerifyPresentationOptions
    );
    return transformVerificationResult(verifyPresentation);
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
