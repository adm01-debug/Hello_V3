/**
 * JWT utility functions for token inspection (client-side only).
 * NOTE: Never validate JWTs client-side for security decisions.
 */

export interface JWTPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  aud?: string;
  iss?: string;
  [key: string]: unknown;
}

export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function getTokenExpirationDate(token: string): Date | null {
  const payload = decodeJWTPayload(token);
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
}

export function getTimeUntilExpiration(token: string): number {
  const payload = decodeJWTPayload(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
}
