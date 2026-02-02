/**
 * This module provides a minimal shim to emulate the Web Authentication API implemented in browsers. This allows us to
 * write tests where we create and authenticate WebAuthn credentials that are verified on-chain.
 *
 * This implementation is inspired by software authenticators found in the Awesome WebAuthn list [1].
 *
 * [1]: <https://github.com/herrjemand/awesome-webauthn#software-authenticators>
 */
import type { BytesLike } from 'ethers';
/**
 * Encode bytes using the Base64 URL encoding.
 *
 * See <https://www.rfc-editor.org/rfc/rfc4648#section-5>
 *
 * @param data data to encode to `base64url`
 * @returns the `base64url` encoded data as a string.
 */
export declare function base64UrlEncode(data: string | Uint8Array | ArrayBuffer): string;
/**
 * Returns the flag for the user verification requirement.
 *
 * See: <https://w3c.github.io/webauthn/#enumdef-userverificationrequirement>
 *
 * @param userVerification - The user verification requirement.
 * @returns The flag for the user verification requirement.
 */
export declare function userVerificationFlag(userVerification?: UserVerificationRequirement): number;
/**
 * Returns the message that gets signed by the WebAuthn credentials.
 *
 * See <https://w3c.github.io/webauthn/#fig-signature>
 */
export declare function encodeWebAuthnSigningMessage(clientData: {
    type: 'webauthn.get';
    challenge: string;
    [key: string]: unknown;
}, authenticatorData: BytesLike): Uint8Array;
export interface CredentialCreationOptions {
    publicKey: PublicKeyCredentialCreationOptions;
}
export type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged';
/**
 * Public key credetial creation options, restricted to a subset of options that this module supports.
 * See <https://w3c.github.io/webauthn/#dictionary-makecredentialoptions>.
 */
export interface PublicKeyCredentialCreationOptions {
    rp: {
        id: string;
        name: string;
    };
    user: {
        id: Uint8Array;
        displayName: string;
        name: string;
    };
    challenge: Uint8Array;
    pubKeyCredParams: {
        type: 'public-key';
        alg: number;
    }[];
    attestation?: 'none';
    userVerification?: Exclude<UserVerificationRequirement, 'discouraged'>;
}
export interface CredentialRequestOptions {
    publicKey: PublicKeyCredentialRequestOptions;
}
/**
 * Public key credetial request options, restricted to a subset of options that this module supports.
 * See <https://w3c.github.io/webauthn/#dictionary-assertion-options>.
 */
export interface PublicKeyCredentialRequestOptions {
    challenge: Uint8Array;
    rpId: string;
    allowCredentials: {
        type: 'public-key';
        id: Uint8Array;
    }[];
    userVerification?: Exclude<UserVerificationRequirement, 'discouraged'>;
    attestation?: 'none';
}
/**
 * A created public key credential. See <https://w3c.github.io/webauthn/#iface-pkcredential>.
 */
export interface PublicKeyCredential<AuthenticatorResponse> {
    type: 'public-key';
    id: string;
    rawId: ArrayBuffer;
    response: AuthenticatorResponse;
}
/**
 * The authenticator's response to a client’s request for the creation of a new public key credential.
 * See <https://w3c.github.io/webauthn/#iface-authenticatorattestationresponse>.
 */
export interface AuthenticatorAttestationResponse {
    clientDataJSON: ArrayBuffer;
    attestationObject: ArrayBuffer;
    getPublicKey: () => ArrayBuffer;
}
/**
 * The authenticator's response to a client’s request generation of a new authentication assertion given the WebAuthn Relying Party's challenge.
 * See <https://w3c.github.io/webauthn/#iface-authenticatorassertionresponse>.
 */
export interface AuthenticatorAssertionResponse {
    clientDataJSON: ArrayBuffer;
    authenticatorData: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle: ArrayBuffer;
}
declare class Credential {
    rp: string;
    user: Uint8Array;
    id: string;
    rawId: Uint8Array;
    pk: bigint;
    constructor(rp: string, user: Uint8Array, pk?: bigint);
    /**
     * Computes the COSE encoded public key for this credential.
     * See <https://datatracker.ietf.org/doc/html/rfc8152>.
     *
     * @returns Hex-encoded COSE-encoded public key
     */
    cosePublicKey(): string;
}
export declare class WebAuthnCredentials {
    private privateKey?;
    credentials: Credential[];
    /**
     * Creates a new instance of the WebAuthn credentials.
     * @param privateKey The private key to use for the credentials. If not provided, a random key will be generated.
     */
    constructor(privateKey?: bigint | undefined);
    /**
     * This is a shim for `navigator.credentials.create` method.
     * See <https://w3c.github.io/webappsec-credential-management/#dom-credentialscontainer-create>.
     *
     * @param options The public key credential creation options.
     * @returns A public key credential with an attestation response.
     */
    create({ publicKey }: CredentialCreationOptions): PublicKeyCredential<AuthenticatorAttestationResponse>;
    /**
     * This is a shim for `navigator.credentials.get` method.
     * See <https://w3c.github.io/webappsec-credential-management/#dom-credentialscontainer-get>.
     *
     * @param options The public key credential request options.
     * @returns A public key credential with an assertion response.
     */
    get({ publicKey }: CredentialRequestOptions): PublicKeyCredential<AuthenticatorAssertionResponse>;
}
export {};
//# sourceMappingURL=webauthnShim.d.ts.map