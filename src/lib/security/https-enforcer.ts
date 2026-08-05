/**
 * HTTPS Enforcer - Redirects HTTP to HTTPS in production.
 */

export function shouldEnforceHTTPS(): boolean {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const isHTTPS = window.location.protocol === "https:";
  return !isLocalhost && !isHTTPS;
}

export function enforceHTTPS(): void {
  if (shouldEnforceHTTPS()) {
    const secureUrl = window.location.href.replace("http://", "https://");
    window.location.replace(secureUrl);
  }
}

export function getProtocolInfo(): {
  isSecure: boolean;
  protocol: string;
  hostname: string;
} {
  return {
    isSecure: window.location.protocol === "https:",
    protocol: window.location.protocol,
    hostname: window.location.hostname,
  };
}
