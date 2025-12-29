import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const EmailSchema = z.string().email().min(5).max(254);
const UUIDSchema = z.string().uuid();
const URLSchema = z.string().url();
const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);

class InputValidator {
  public static validateEmail(email: string): boolean {
    return EmailSchema.safeParse(email).success;
  }

  public static validateUUID(uuid: string): boolean {
    return UUIDSchema.safeParse(uuid).success;
  }

  public static validateURL(url: string): boolean {
    return URLSchema.safeParse(url).success;
  }

  public static validatePhone(phone: string): boolean {
    return PhoneSchema.safeParse(phone).success;
  }

  public static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
    });
  }

  public static sanitizeString(input: string): string {
    return input
      .replace(/[<>'"]/g, '')
      .trim()
      .substring(0, 1000);
  }

  public static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}

export { InputValidator, EmailSchema, UUIDSchema, URLSchema, PhoneSchema };
