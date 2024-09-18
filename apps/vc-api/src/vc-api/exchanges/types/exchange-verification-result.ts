/*
 * Copyright 2021 - 2023 Energy Web Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A response object from verification of a credential or a presentation.
 * https://w3c-ccg.github.io/vc-api/verifier.html
 */

export interface VerificationResult {
  /**	  /**
   * verified
   */
  verified: boolean;

  /**	  /**
   * Warnings
   */
  warnings: string[];

  /**	  /**
   * Errors
   */
  errors: string[];
}
