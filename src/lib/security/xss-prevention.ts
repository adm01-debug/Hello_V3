/**
 * XSS Prevention utilities.
 */

const DANGEROUS_PROTOCOLS = ["javascript:", "data:", "vbscript:"];

export function sanitizeURL(url: string): string {
  const trimmed = url.trim().toLowerCase();
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) {
      return "#";
    }
  }
  return url;
}

export function escapeHTML(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

export function sanitizeForAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function stripScriptTags(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

export function sanitizeEventHandlers(html: string): string {
  return html.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export function createSafeHTML(html: string): string {
  return stripScriptTags(sanitizeEventHandlers(html));
}
