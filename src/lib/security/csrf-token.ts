/**
 * CSRF Token utility for form protection.
 */

const CSRF_STORAGE_KEY = "csrf_token";

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateCSRFToken(): string {
  let token = sessionStorage.getItem(CSRF_STORAGE_KEY);
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  }
  return token;
}

export function validateCSRFToken(token: string): boolean {
  const stored = sessionStorage.getItem(CSRF_STORAGE_KEY);
  return !!stored && stored === token;
}

export function rotateCSRFToken(): string {
  const newToken = generateCSRFToken();
  sessionStorage.setItem(CSRF_STORAGE_KEY, newToken);
  return newToken;
}
