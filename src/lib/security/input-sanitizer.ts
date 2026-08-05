/**
 * Input sanitization utilities to prevent XSS and injection attacks.
 */

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

export function escapeHTML(input: string): string {
  return input.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

export function stripHTMLTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export function sanitizeInput(input: string): string {
  return escapeHTML(stripHTMLTags(input.trim()));
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9@._+-]/g, "");
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9+()-\s]/g, "").trim();
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>'"`;\\]/g, "")
    .substring(0, 200);
}

export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
