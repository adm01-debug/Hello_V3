// WebAuthn utility functions using native browser APIs

export function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bufferToBase64Url(array);
}

export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export interface RegistrationOptions {
  challenge: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  rpName: string;
  rpId: string;
  excludeCredentialIds?: string[];
}

export interface AuthenticationOptions {
  challenge: string;
  rpId: string;
  allowCredentialIds?: string[];
}

export async function startRegistration(options: RegistrationOptions): Promise<{
  credentialId: string;
  publicKey: string;
  clientDataJSON: string;
  attestationObject: string;
  transports?: string[];
}> {
  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: base64UrlToBuffer(options.challenge),
    rp: {
      name: options.rpName,
      id: options.rpId,
    },
    user: {
      id: new TextEncoder().encode(options.userId),
      name: options.userName,
      displayName: options.userDisplayName,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: 'none',
    excludeCredentials: options.excludeCredentialIds?.map(id => ({
      type: 'public-key',
      id: base64UrlToBuffer(id),
    })),
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Failed to create credential');
  }

  const response = credential.response as AuthenticatorAttestationResponse;
  
  return {
    credentialId: bufferToBase64Url(credential.rawId),
    publicKey: bufferToBase64Url(response.getPublicKey?.() || new ArrayBuffer(0)),
    clientDataJSON: bufferToBase64Url(response.clientDataJSON),
    attestationObject: bufferToBase64Url(response.attestationObject),
    transports: response.getTransports?.() || [],
  };
}

export async function startAuthentication(options: AuthenticationOptions): Promise<{
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string;
}> {
  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: base64UrlToBuffer(options.challenge),
    rpId: options.rpId,
    timeout: 60000,
    userVerification: 'required',
    allowCredentials: options.allowCredentialIds?.map(id => ({
      type: 'public-key',
      id: base64UrlToBuffer(id),
      transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
    })),
  };

  const credential = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Failed to get credential');
  }

  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    credentialId: bufferToBase64Url(credential.rawId),
    clientDataJSON: bufferToBase64Url(response.clientDataJSON),
    authenticatorData: bufferToBase64Url(response.authenticatorData),
    signature: bufferToBase64Url(response.signature),
    userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined,
  };
}
