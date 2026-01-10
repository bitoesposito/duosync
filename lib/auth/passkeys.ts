/**
 * WebAuthn/Passkeys utilities
 * Handles passkey creation and authentication using @simplewebauthn/server
 */

import { env } from "@/lib/env";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import type {
  AuthenticatorTransportFuture,
  Base64URLString,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";

const rpName = "DuoSync";
const rpID = env.WEBAUTHN_RP_ID;
const origin = env.NEXTAUTH_URL;

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Generate WebAuthn registration options
 * Supports both platform and cross-platform authenticators (like Bitwarden)
 */
export async function createRegistrationOptions(
  userId: string,
  userName: string,
  userEmail: string
) {
  const opts: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID,
    userID: stringToUint8Array(userId) as any,
    userName: userEmail,
    userDisplayName: userName,
    timeout: 60000,
    attestationType: "none",
    /**
     * Allow both platform and cross-platform authenticators
     * This enables support for password managers like Bitwarden
     */
    authenticatorSelection: {
      // Don't restrict to platform only - allow cross-platform (Bitwarden, etc.)
      userVerification: "preferred",
      requireResidentKey: true, // Store passkey on device/authenticator
    },
    /**
     * Support the two most common algorithms: ES256, and RS256
     */
    supportedAlgorithmIDs: [-7, -257],
  };

  return await generateRegistrationOptions(opts);
}

/**
 * Verify WebAuthn registration response
 */
export async function verifyRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string
) {
  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    requireUserVerification: false,
  };

  return await verifyRegistrationResponse(opts);
}

/**
 * Generate WebAuthn authentication options
 * Supports both platform and cross-platform authenticators
 */
export async function createAuthenticationOptions(
  allowCredentials?: Array<{
    id: Base64URLString;
    transports?: AuthenticatorTransportFuture[];
  }>
) {
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID,
    timeout: 60000,
    allowCredentials,
    userVerification: "preferred",
    // Don't restrict to platform only - allow cross-platform authenticators
  };

  return await generateAuthenticationOptions(opts);
}

/**
 * Verify WebAuthn authentication response
 */
export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string,
  authenticator: {
    credentialID: Base64URLString;
    credentialPublicKey: Buffer;
    counter: number;
  }
) {
  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    credential: {
      id: authenticator.credentialID,
      publicKey: authenticator.credentialPublicKey as any,
      counter: authenticator.counter,
    },
    requireUserVerification: false,
  };

  return await verifyAuthenticationResponse(opts);
}
