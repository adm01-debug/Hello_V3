/**
 * HTTP Strict Transport Security (HSTS) configuration.
 */

export interface HSTSConfig {
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

export const DEFAULT_HSTS_CONFIG: HSTSConfig = {
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true,
};

export function buildHSTSHeader(config: HSTSConfig = DEFAULT_HSTS_CONFIG): string {
  let header = `max-age=${config.maxAge}`;
  if (config.includeSubDomains) header += "; includeSubDomains";
  if (config.preload) header += "; preload";
  return header;
}

export function isSecureConnection(): boolean {
  return window.location.protocol === "https:";
}

export function enforceHTTPS(): void {
  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
    window.location.replace(
      `https://${window.location.hostname}${window.location.pathname}${window.location.search}`
    );
  }
}
