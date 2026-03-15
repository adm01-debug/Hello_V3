/**
 * CORS configuration utility for frontend reference.
 */

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposeHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

export const DEFAULT_CORS_CONFIG: CORSConfig = {
  allowedOrigins: [
    window.location.origin,
  ],
  allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "authorization",
    "x-client-info",
    "apikey",
    "content-type",
    "x-supabase-client-platform",
    "x-supabase-client-platform-version",
    "x-supabase-client-runtime",
    "x-supabase-client-runtime-version",
  ],
  exposeHeaders: ["x-total-count"],
  maxAge: 86400,
  credentials: true,
};

export function buildCORSHeaders(config: CORSConfig = DEFAULT_CORS_CONFIG): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": config.allowedOrigins.join(", "),
    "Access-Control-Allow-Methods": config.allowedMethods.join(", "),
    "Access-Control-Allow-Headers": config.allowedHeaders.join(", "),
    "Access-Control-Expose-Headers": config.exposeHeaders.join(", "),
    "Access-Control-Max-Age": String(config.maxAge),
    ...(config.credentials ? { "Access-Control-Allow-Credentials": "true" } : {}),
  };
}
