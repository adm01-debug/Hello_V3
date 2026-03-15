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
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload) as JWTPayload;
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
